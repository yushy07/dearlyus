begin;

create or replace function public.lock_dare_truth_answer(target_session_id uuid,answer_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); s public.activity_sessions; current_round_id uuid;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.activity_sessions where id=target_session_id and activity_type='dare' for update;
  if s.id is null or not public.is_room_member(s.room_id) then raise exception 'FORBIDDEN'; end if;
  if s.snapshot->>'stage'<>'answering' or s.snapshot->>'promptType'<>'truth'
    or (s.snapshot->>'activePlayerId')::uuid<>actor then raise exception 'NOT_YOUR_TURN'; end if;
  if pg_column_size(coalesce(answer_payload,'{}'::jsonb))>4096
    or char_length(trim(coalesce(answer_payload->>'answer',''))) not between 1 and 280 then raise exception 'INVALID_ANSWER'; end if;
  current_round_id:=(s.snapshot->>'roundId')::uuid;
  if exists(select 1 from public.dare_private_truths d where d.session_id=s.id and d.round_id=current_round_id) then raise exception 'ANSWER_ALREADY_LOCKED'; end if;
  insert into public.dare_private_truths(session_id,round_id,answerer_id,answer_payload)
    values(s.id,current_round_id,actor,answer_payload);
  return jsonb_build_object('locked',true,'roundId',current_round_id);
end $$;

create or replace function public.get_my_account_bootstrap()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  current_user_id uuid:=auth.uid(); saved_profile public.profiles; saved_space jsonb;
  saved_preferences public.shared_preferences; selected_couple_id uuid; member_count integer:=0; account_state text;
begin
  if current_user_id is null then raise exception '[AUTH_REQUIRED] Sign in to open your space' using errcode='42501'; end if;
  select * into saved_profile from public.profiles where id=current_user_id;
  select cm.couple_id into selected_couple_id from public.couple_members cm where cm.user_id=current_user_id limit 1;
  if selected_couple_id is not null then
    saved_space:=public.get_my_space();
    select count(*)::integer into member_count from public.couple_members cm where cm.couple_id=selected_couple_id;
    select * into saved_preferences from public.shared_preferences sp where sp.couple_id=selected_couple_id;
  end if;
  account_state:=case when saved_profile.id is null or not saved_profile.onboarding_completed then 'needs_profile'
    when selected_couple_id is null then 'needs_connection' when member_count<2 then 'waiting_for_partner' else 'connected' end;
  return jsonb_build_object(
    'state',account_state,
    'profile',case when saved_profile.id is null then null else jsonb_build_object('id',saved_profile.id,'displayName',saved_profile.display_name,'city',coalesce(saved_profile.city,''),'timezone',saved_profile.timezone,'avatarUrl',saved_profile.avatar_url,'onboardingCompleted',saved_profile.onboarding_completed,'accountStatus',saved_profile.account_status) end,
    'space',saved_space,
    'preferences',case when saved_preferences.couple_id is null then null else jsonb_build_object('preferredMood',coalesce(saved_preferences.preferred_mood,'playful'),'defaultDurationMinutes',coalesce(saved_preferences.default_duration_minutes,30),'ambientAudioEnabled',saved_preferences.ambient_audio_enabled,'reducedMotion',saved_preferences.reduced_motion,'aiConsent',coalesce((saved_preferences.metadata->>'aiConsent')::boolean,false),'updatedAt',saved_preferences.updated_at) end,
    'summary',jsonb_build_object('keepsakeCount',case when selected_couple_id is null then 0 else (select count(*) from public.keepsakes k where k.couple_id=selected_couple_id and k.deleted_at is null) end,'milestoneCount',case when selected_couple_id is null then 0 else (select count(*) from public.relationship_milestones rm where rm.couple_id=selected_couple_id) end,'pendingActivityCount',0),
    'revision',extract(epoch from greatest(coalesce(saved_profile.updated_at,to_timestamp(0)),coalesce((select c.updated_at from public.couples c where c.id=selected_couple_id),to_timestamp(0)),coalesce(saved_preferences.updated_at,to_timestamp(0))))::bigint
  );
end $$;

create or replace function public.upsert_shared_activity_record(target_couple_id uuid,target_kind text,target_key text,target_title text,target_payload jsonb,target_status text default 'active',target_at timestamptz default null,expected_revision bigint default null)
returns jsonb language plpgsql security definer set search_path=public as $$
<<fn>>
declare actor uuid:=auth.uid(); saved public.plans_and_milestones;
begin
  if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
  if target_kind not in ('future_plan','reunion','bucket_date','date_plan','ritual','forecast','lab_session','love_match','date_night_capsule','birthday_gift','passport','cupidot_home') then raise exception 'INVALID_KIND'; end if;
  if target_key !~ '^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$' then raise exception 'INVALID_KEY'; end if;
  if char_length(coalesce(target_title,'')) not between 1 and 120 or pg_column_size(coalesce(target_payload,'{}'::jsonb))>65536 then raise exception 'INVALID_RECORD'; end if;
  select * into saved from public.plans_and_milestones p where p.couple_id=target_couple_id and p.record_kind=target_kind and p.record_key=target_key for update;
  if saved.id is null then
    if expected_revision is not null and expected_revision<>0 then raise exception 'STALE_RECORD'; end if;
    insert into public.plans_and_milestones(couple_id,record_kind,record_key,title,payload,status,target_at,created_by,updated_by,revision)
      values(target_couple_id,target_kind,target_key,target_title,target_payload,target_status,fn.target_at,actor,actor,1) returning * into saved;
  else
    if expected_revision is not null and saved.revision<>expected_revision then raise exception 'STALE_RECORD'; end if;
    update public.plans_and_milestones p set title=target_title,payload=target_payload,status=target_status,target_at=fn.target_at,updated_by=actor,updated_at=now(),revision=p.revision+1 where p.id=saved.id returning * into saved;
  end if;
  return to_jsonb(saved);
end $$;

commit;

begin;

create unique index if not exists couple_members_one_space_per_user_idx
  on public.couple_members (user_id);

create unique index if not exists couple_invites_one_active_per_couple_idx
  on public.couple_invites (couple_id)
  where status = 'active' and accepted_at is null and revoked_at is null;

create or replace function public.get_my_account_bootstrap()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_profile public.profiles;
  saved_space jsonb;
  saved_preferences public.shared_preferences;
  couple_id uuid;
  member_count integer := 0;
  account_state text;
begin
  if current_user_id is null then
    raise exception '[AUTH_REQUIRED] Sign in to open your space' using errcode = '42501';
  end if;

  select * into saved_profile
  from public.profiles
  where id = current_user_id;

  select cm.couple_id into couple_id
  from public.couple_members cm
  where cm.user_id = current_user_id
  limit 1;

  if couple_id is not null then
    saved_space := public.get_my_space();
    select count(*)::integer into member_count
    from public.couple_members cm
    where cm.couple_id = couple_id;

    select * into saved_preferences
    from public.shared_preferences sp
    where sp.couple_id = couple_id;
  end if;

  account_state := case
    when saved_profile.id is null or not saved_profile.onboarding_completed then 'needs_profile'
    when couple_id is null then 'needs_connection'
    when member_count < 2 then 'waiting_for_partner'
    else 'connected'
  end;

  return jsonb_build_object(
    'state', account_state,
    'profile', case when saved_profile.id is null then null else jsonb_build_object(
      'id', saved_profile.id,
      'displayName', saved_profile.display_name,
      'city', coalesce(saved_profile.city, ''),
      'timezone', saved_profile.timezone,
      'avatarUrl', saved_profile.avatar_url,
      'onboardingCompleted', saved_profile.onboarding_completed,
      'accountStatus', saved_profile.account_status
    ) end,
    'space', saved_space,
    'preferences', case when saved_preferences.couple_id is null then null else jsonb_build_object(
      'preferredMood', coalesce(saved_preferences.preferred_mood, 'playful'),
      'defaultDurationMinutes', coalesce(saved_preferences.default_duration_minutes, 30),
      'ambientAudioEnabled', saved_preferences.ambient_audio_enabled,
      'reducedMotion', saved_preferences.reduced_motion,
      'aiConsent', coalesce((saved_preferences.metadata ->> 'aiConsent')::boolean, false),
      'updatedAt', saved_preferences.updated_at
    ) end,
    'summary', jsonb_build_object(
      'keepsakeCount', case when couple_id is null then 0 else (select count(*) from public.keepsakes k where k.couple_id = couple_id and k.deleted_at is null) end,
      'milestoneCount', case when couple_id is null then 0 else (select count(*) from public.relationship_milestones rm where rm.couple_id = couple_id) end,
      'pendingActivityCount', 0
    ),
    'revision', extract(epoch from greatest(
      coalesce(saved_profile.updated_at, to_timestamp(0)),
      coalesce((select c.updated_at from public.couples c where c.id = couple_id), to_timestamp(0)),
      coalesce(saved_preferences.updated_at, to_timestamp(0))
    ))::bigint
  );
end;
$$;

create or replace function public.create_couple_space_v2(space_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '[AUTH_REQUIRED] Sign in to create your space' using errcode = '42501';
  end if;

  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    return public.get_my_account_bootstrap();
  end if;

  perform public.create_couple_space(space_name);
  return public.get_my_account_bootstrap();
exception
  when unique_violation then
    if exists (select 1 from public.couple_members where user_id = auth.uid()) then
      return public.get_my_account_bootstrap();
    end if;
    raise;
end;
$$;

create or replace function public.accept_couple_invite_v2(invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_code text := upper(btrim(coalesce(invite_code, '')));
  selected_invite public.couple_invites;
  existing_couple_id uuid;
begin
  if auth.uid() is null then
    raise exception '[AUTH_REQUIRED] Sign in to accept this invitation' using errcode = '42501';
  end if;

  select * into selected_invite
  from public.couple_invites ci
  where ci.code = clean_code
  for update;

  if selected_invite.id is null then
    raise exception '[INVITE_UNAVAILABLE] This invitation is not available' using errcode = '22023';
  end if;

  select cm.couple_id into existing_couple_id
  from public.couple_members cm
  where cm.user_id = auth.uid()
  limit 1;

  if existing_couple_id = selected_invite.couple_id then
    return public.get_my_account_bootstrap();
  elsif existing_couple_id is not null then
    raise exception '[ALREADY_CONNECTED] This account already belongs to another space' using errcode = '23505';
  end if;

  perform public.join_couple_by_invite(clean_code);
  return public.get_my_account_bootstrap();
exception
  when unique_violation then
    if exists (select 1 from public.couple_members where user_id = auth.uid()) then
      return public.get_my_account_bootstrap();
    end if;
    raise;
end;
$$;

revoke all on function public.get_my_account_bootstrap() from public, anon;
revoke all on function public.create_couple_space_v2(text) from public, anon;
revoke all on function public.accept_couple_invite_v2(text) from public, anon;
grant execute on function public.get_my_account_bootstrap() to authenticated;
grant execute on function public.create_couple_space_v2(text) to authenticated;
grant execute on function public.accept_couple_invite_v2(text) to authenticated;

commit;

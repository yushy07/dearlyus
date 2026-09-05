-- Dearly Us roadmap scope completion: invite lifecycle, shared preferences,
-- private keepsake finalization, and relationship milestones.

alter table public.couple_invites add column if not exists status text not null default 'active';
alter table public.couple_invites add column if not exists revoked_at timestamptz;
alter table public.couple_invites drop constraint if exists couple_invites_status_check;
alter table public.couple_invites add constraint couple_invites_status_check
  check (status in ('active', 'accepted', 'revoked', 'expired'));

update public.couple_invites
set status = case
  when revoked_at is not null then 'revoked'
  when accepted_at is not null then 'accepted'
  when expires_at <= now() then 'expired'
  else 'active'
end;

create index if not exists couple_invites_active_idx
  on public.couple_invites(couple_id, created_at desc)
  where status = 'active';

alter table public.keepsakes add column if not exists storage_bucket text;
alter table public.keepsakes add column if not exists storage_path text;
alter table public.keepsakes add column if not exists deleted_at timestamptz;

create or replace function public.get_couple_invite_preview(invite_code text)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare selected_invite public.couple_invites; creator_name text;
begin
  if auth.uid() is null then raise exception using message = '[AUTH_REQUIRED] Sign in to view this invitation'; end if;
  select * into selected_invite from public.couple_invites
  where code = upper(trim(invite_code))
    and status = 'active'
    and revoked_at is null
    and accepted_at is null
    and expires_at > now()
  limit 1;
  if selected_invite.id is null then
    raise exception using message = '[INVITE_UNAVAILABLE] This invitation is expired, revoked, or already used';
  end if;
  select display_name into creator_name from public.profiles where id = selected_invite.created_by;
  return jsonb_build_object(
    'code', selected_invite.code,
    'spaceName', (select name from public.couples where id = selected_invite.couple_id),
    'inviterName', coalesce(nullif(creator_name, ''), 'Your person'),
    'expiresAt', selected_invite.expires_at,
    'isSelfInvite', selected_invite.created_by = auth.uid()
  );
end;
$$;

create or replace function public.join_couple_by_invite(invite_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_invite public.couple_invites;
begin
  if auth.uid() is null then raise exception using message = '[AUTH_REQUIRED] Sign in to accept this invitation'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception using message = '[ALREADY_CONNECTED] This account already belongs to a couple space';
  end if;
  select * into selected_invite from public.couple_invites
  where code = upper(trim(invite_code))
  for update;
  if selected_invite.id is null or selected_invite.status <> 'active' or selected_invite.revoked_at is not null
     or selected_invite.accepted_at is not null or selected_invite.expires_at <= now() then
    raise exception using message = '[INVITE_UNAVAILABLE] This invitation is expired, revoked, or already used';
  end if;
  if selected_invite.created_by = auth.uid() then
    raise exception using message = '[SELF_INVITE] Send this invitation to your partner';
  end if;
  perform 1 from public.couples where id = selected_invite.couple_id for update;
  if (select count(*) from public.couple_members where couple_id = selected_invite.couple_id) >= 2 then
    raise exception using message = '[SPACE_FULL] This couple space already has two people';
  end if;
  insert into public.couple_members (couple_id, user_id, role)
  values (selected_invite.couple_id, auth.uid(), 'partner');
  update public.couple_invites
  set accepted_at = now(), accepted_by = auth.uid(), status = 'accepted'
  where id = selected_invite.id;
  update public.couple_invites
  set status = 'revoked', revoked_at = now(), expires_at = least(expires_at, now())
  where couple_id = selected_invite.couple_id and id <> selected_invite.id and status = 'active';
  return public.get_my_space();
end;
$$;

create or replace function public.regenerate_couple_invite()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_couple_id uuid; new_code text;
begin
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then raise exception using message = '[SPACE_REQUIRED] Create a couple space first'; end if;
  perform 1 from public.couples where id = selected_couple_id for update;
  if (select count(*) from public.couple_members where couple_id = selected_couple_id) >= 2 then
    raise exception using message = '[SPACE_FULL] Your partner is already connected';
  end if;
  update public.couple_invites set status = 'revoked', revoked_at = now(), expires_at = least(expires_at, now())
  where couple_id = selected_couple_id and status = 'active';
  loop
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (select 1 from public.couple_invites where code = new_code);
  end loop;
  insert into public.couple_invites (couple_id, code, created_by, status)
  values (selected_couple_id, new_code, auth.uid(), 'active');
  return public.get_my_space();
end;
$$;

create or replace function public.revoke_couple_invite()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_couple_id uuid;
begin
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then raise exception using message = '[SPACE_REQUIRED] Create a couple space first'; end if;
  update public.couple_invites set status = 'revoked', revoked_at = now(), expires_at = least(expires_at, now())
  where couple_id = selected_couple_id and status = 'active';
  return public.get_my_space();
end;
$$;

create or replace function public.get_shared_preferences()
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare selected_couple_id uuid; result jsonb;
begin
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then return null; end if;
  select jsonb_build_object(
    'preferredMood', coalesce(preferred_mood, 'playful'),
    'defaultDurationMinutes', coalesce(default_duration_minutes, 30),
    'ambientAudioEnabled', ambient_audio_enabled,
    'reducedMotion', reduced_motion,
    'updatedAt', updated_at
  ) into result from public.shared_preferences where couple_id = selected_couple_id;
  return coalesce(result, jsonb_build_object(
    'preferredMood', 'playful', 'defaultDurationMinutes', 30,
    'ambientAudioEnabled', false, 'reducedMotion', false, 'updatedAt', null
  ));
end;
$$;

create or replace function public.save_shared_preferences(preferences jsonb)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_couple_id uuid; clean_mood text; clean_duration integer;
begin
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then raise exception using message = '[SPACE_REQUIRED] Connect your partner first'; end if;
  clean_mood := coalesce(nullif(trim(preferences->>'preferredMood'), ''), 'playful');
  if clean_mood not in ('playful', 'romantic', 'deep', 'cozy') then
    raise exception using message = '[INVALID_PREFERENCES] Choose a supported mood';
  end if;
  clean_duration := coalesce((preferences->>'defaultDurationMinutes')::integer, 30);
  if clean_duration not in (15, 30, 45, 60, 90) then
    raise exception using message = '[INVALID_PREFERENCES] Choose a supported duration';
  end if;
  insert into public.shared_preferences (
    couple_id, preferred_mood, default_duration_minutes, ambient_audio_enabled,
    reduced_motion, updated_by, updated_at
  ) values (
    selected_couple_id, clean_mood, clean_duration,
    coalesce((preferences->>'ambientAudioEnabled')::boolean, false),
    coalesce((preferences->>'reducedMotion')::boolean, false), auth.uid(), now()
  ) on conflict (couple_id) do update set
    preferred_mood = excluded.preferred_mood,
    default_duration_minutes = excluded.default_duration_minutes,
    ambient_audio_enabled = excluded.ambient_audio_enabled,
    reduced_motion = excluded.reduced_motion,
    updated_by = auth.uid(), updated_at = now();
  return public.get_shared_preferences();
end;
$$;

create or replace function public.finalize_keepsake(
  keepsake_kind text,
  keepsake_title text,
  target_bucket text default null,
  target_path text default null,
  source_activity_path text default null,
  source_session_id uuid default null,
  keepsake_caption text default null,
  keepsake_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer set search_path = public, storage
as $$
declare selected_couple_id uuid; new_keepsake public.keepsakes;
begin
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then raise exception using message = '[SPACE_REQUIRED] Connect your partner first'; end if;
  if keepsake_kind not in ('photostrip','passport','receipt','letter','scrapbook','activity') then
    raise exception using message = '[INVALID_KEEPSAKE] Unsupported keepsake type';
  end if;
  if length(trim(keepsake_title)) not between 1 and 100 then
    raise exception using message = '[INVALID_KEEPSAKE] Add a title between 1 and 100 characters';
  end if;
  if source_session_id is not null and not public.session_is_mine(source_session_id) then
    raise exception using message = '[SESSION_UNAVAILABLE] Session unavailable';
  end if;
  if target_bucket is not null then
    if target_bucket not in ('couple-keepsakes','couple-drawings','couple-photostrips')
       or (storage.foldername(target_path))[1] <> selected_couple_id::text
       or not exists (select 1 from storage.objects where bucket_id = target_bucket and name = target_path) then
      raise exception using message = '[INVALID_STORAGE_OBJECT] Private upload could not be verified';
    end if;
  end if;
  insert into public.keepsakes (
    couple_id, created_by, kind, title, activity_path, session_id, caption,
    metadata, storage_bucket, storage_path
  ) values (
    selected_couple_id, auth.uid(), keepsake_kind, trim(keepsake_title),
    source_activity_path, source_session_id, nullif(trim(keepsake_caption), ''),
    coalesce(keepsake_metadata, '{}'::jsonb), target_bucket, target_path
  ) returning * into new_keepsake;
  insert into public.relationship_milestones (couple_id, kind, title, keepsake_id, metadata)
  values (selected_couple_id, 'keepsake_saved', new_keepsake.title, new_keepsake.id,
          jsonb_build_object('keepsakeKind', new_keepsake.kind));
  return jsonb_build_object('id', new_keepsake.id, 'kind', new_keepsake.kind,
    'title', new_keepsake.title, 'activityPath', new_keepsake.activity_path,
    'createdAt', new_keepsake.created_at);
end;
$$;

create or replace function public.delete_keepsake(target_keepsake_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public, storage
as $$
declare selected_keepsake public.keepsakes;
begin
  select * into selected_keepsake from public.keepsakes
  where id = target_keepsake_id and public.is_couple_member(couple_id)
  for update;
  if selected_keepsake.id is null then raise exception using message = '[KEEPSAKE_UNAVAILABLE] Keepsake unavailable'; end if;
  update public.keepsakes set deleted_at = now() where id = target_keepsake_id;
  if selected_keepsake.storage_bucket is not null and selected_keepsake.storage_path is not null then
    delete from storage.objects where bucket_id = selected_keepsake.storage_bucket and name = selected_keepsake.storage_path;
  end if;
  return jsonb_build_object('deleted', true, 'id', target_keepsake_id);
end;
$$;

drop policy if exists "keepsakes_select_couple" on public.keepsakes;
create policy "keepsakes_select_couple" on public.keepsakes for select to authenticated
using (deleted_at is null and public.is_couple_member(couple_id));

revoke all on function public.get_couple_invite_preview(text) from public, anon;
revoke all on function public.join_couple_by_invite(text) from public, anon;
revoke all on function public.regenerate_couple_invite() from public, anon;
revoke all on function public.revoke_couple_invite() from public, anon;
revoke all on function public.get_shared_preferences() from public, anon;
revoke all on function public.save_shared_preferences(jsonb) from public, anon;
revoke all on function public.finalize_keepsake(text,text,text,text,text,uuid,text,jsonb) from public, anon;
revoke all on function public.delete_keepsake(uuid) from public, anon;

grant execute on function public.get_couple_invite_preview(text) to authenticated;
grant execute on function public.join_couple_by_invite(text) to authenticated;
grant execute on function public.regenerate_couple_invite() to authenticated;
grant execute on function public.revoke_couple_invite() to authenticated;
grant execute on function public.get_shared_preferences() to authenticated;
grant execute on function public.save_shared_preferences(jsonb) to authenticated;
grant execute on function public.finalize_keepsake(text,text,text,text,text,uuid,text,jsonb) to authenticated;
grant execute on function public.delete_keepsake(uuid) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.couple_members;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.couple_invites;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.keepsakes;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.relationship_milestones;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.shared_preferences;
exception when duplicate_object then null; end $$;

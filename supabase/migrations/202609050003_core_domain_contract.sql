-- Dearly Us roadmap section 5: explicit contracts for users, couples, invites,
-- rooms, activity sessions, ordered events, ephemeral presence, and keepsakes.

begin;

alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'deletion_requested', 'deleted'));

alter table public.couples add column if not exists relationship_metadata jsonb not null default '{}'::jsonb;
alter table public.couples add column if not exists current_room_id uuid;

alter table public.rooms add column if not exists host_user_id uuid references auth.users(id) on delete restrict;
alter table public.rooms add column if not exists started_at timestamptz;
alter table public.rooms add column if not exists created_at timestamptz not null default now();
update public.rooms set host_user_id = created_by where host_user_id is null;

do $$ begin
  alter table public.couples add constraint couples_current_room_id_fkey
    foreign key (current_room_id) references public.rooms(id) on delete set null;
exception when duplicate_object then null;
end $$;

alter table public.activity_sessions add column if not exists paused_at timestamptz;
alter table public.activity_sessions add column if not exists resumed_at timestamptz;
alter table public.activity_sessions add column if not exists result_summary jsonb not null default '{}'::jsonb;
alter table public.activity_sessions drop constraint if exists activity_sessions_status_check;
alter table public.activity_sessions add constraint activity_sessions_status_check
  check (status in ('preparing', 'active', 'waiting', 'revealing', 'paused', 'completed', 'abandoned'));

alter table public.room_events add column if not exists schema_version integer not null default 1;
alter table public.room_events drop constraint if exists room_events_schema_version_check;
alter table public.room_events add constraint room_events_schema_version_check check (schema_version > 0);

alter table public.keepsakes add column if not exists status text not null default 'finalized';
alter table public.keepsakes add column if not exists finalized_at timestamptz not null default now();
alter table public.keepsakes drop constraint if exists keepsakes_status_check;
alter table public.keepsakes add constraint keepsakes_status_check
  check (status in ('draft', 'finalized', 'deleted'));
update public.keepsakes set status = 'deleted' where deleted_at is not null;

-- Enforce the two-person rule even if a future RPC forgets to count members.
create or replace function public.enforce_couple_member_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform 1 from public.couples where id = new.couple_id for update;
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception using message = '[SPACE_FULL] This couple space already has two people';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_couple_member_limit on public.couple_members;
create trigger enforce_couple_member_limit
  before insert on public.couple_members
  for each row execute function public.enforce_couple_member_limit();

create or replace function public.prepare_room_domain_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.host_user_id := coalesce(new.host_user_id, new.created_by);
  if new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active') then
    new.started_at := coalesce(new.started_at, now());
  end if;
  if new.status in ('completed', 'expired', 'cancelled') then
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_room_domain_fields on public.rooms;
create trigger prepare_room_domain_fields
  before insert or update of status, host_user_id on public.rooms
  for each row execute function public.prepare_room_domain_fields();

create or replace function public.sync_couple_current_room()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status in ('lobby', 'active', 'paused') and new.expires_at > now() then
    update public.couples
      set current_room_id = new.id, active_room_code = new.code, updated_at = now()
      where id = new.couple_id;
  elsif new.status in ('completed', 'expired', 'cancelled') then
    update public.couples
      set current_room_id = null, active_room_code = null, updated_at = now()
      where id = new.couple_id and current_room_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_couple_current_room on public.rooms;
create trigger sync_couple_current_room
  after insert or update of code, status, expires_at on public.rooms
  for each row execute function public.sync_couple_current_room();

with candidates as (
  select distinct on (r.couple_id) r.couple_id, r.id, r.code
  from public.rooms r
  where r.status in ('lobby', 'active', 'paused') and r.expires_at > now()
  order by r.couple_id, r.last_activity_at desc
)
update public.couples c
set current_room_id = candidate.id, active_room_code = candidate.code, updated_at = now()
from candidates candidate
where c.id = candidate.couple_id and c.current_room_id is null;

create or replace function public.get_my_space()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_couple public.couples; result jsonb;
begin
  if auth.uid() is null then raise exception using message = '[AUTH_REQUIRED] Sign in to open your space'; end if;
  select c.* into selected_couple
  from public.couples c join public.couple_members cm on cm.couple_id = c.id
  where cm.user_id = auth.uid() limit 1;
  if selected_couple.id is null then return null; end if;

  select jsonb_build_object(
    'id', selected_couple.id,
    'name', selected_couple.name,
    'createdBy', selected_couple.created_by,
    'createdAt', selected_couple.created_at,
    'activeRoomCode', selected_couple.active_room_code,
    'currentRoomId', selected_couple.current_room_id,
    'relationshipMetadata', selected_couple.relationship_metadata,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'displayName', p.display_name, 'city', p.city,
        'timezone', p.timezone, 'avatarUrl', p.avatar_url, 'role', cm.role
      ) order by cm.joined_at)
      from public.couple_members cm join public.profiles p on p.id = cm.user_id
      where cm.couple_id = selected_couple.id
    ), '[]'::jsonb),
    'invite', (
      select jsonb_build_object(
        'code', ci.code, 'status', ci.status, 'expiresAt', ci.expires_at,
        'acceptedAt', ci.accepted_at, 'revokedAt', ci.revoked_at
      )
      from public.couple_invites ci
      where ci.couple_id = selected_couple.id and ci.status = 'active'
        and ci.accepted_at is null and ci.revoked_at is null and ci.expires_at > now()
      order by ci.created_at desc limit 1
    )
  ) into result;
  return result;
end;
$$;

create or replace function public.room_view(target_room_id uuid)
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id, 'code', r.code, 'coupleId', r.couple_id,
    'hostUserId', coalesce(r.host_user_id, r.created_by), 'status', r.status,
    'currentSessionId', r.current_session_id, 'createdAt', r.created_at,
    'startedAt', r.started_at, 'completedAt', r.completed_at,
    'expiresAt', r.expires_at, 'lastActivityAt', r.last_activity_at,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', rm.user_id, 'displayName', p.display_name,
        'avatarUrl', p.avatar_url, 'ready', rm.ready_at is not null and rm.left_at is null
      ) order by rm.joined_at)
      from public.room_members rm join public.profiles p on p.id = rm.user_id
      where rm.room_id = r.id and rm.left_at is null
    ), '[]'::jsonb)
  )
  from public.rooms r
  where r.id = target_room_id and public.room_is_mine(r.id);
$$;

create or replace function public.get_session_recovery(target_session_id uuid, after_sequence bigint default 0)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare selected_session public.activity_sessions; result jsonb;
begin
  select * into selected_session from public.activity_sessions where id = target_session_id;
  if selected_session.id is null or not public.room_is_mine(selected_session.room_id) then
    raise exception using message = '[SESSION_UNAVAILABLE] Session unavailable';
  end if;
  select jsonb_build_object(
    'sessionId', selected_session.id, 'activityType', selected_session.activity_type,
    'schemaVersion', selected_session.schema_version, 'status', selected_session.status,
    'roundNumber', selected_session.round_number, 'snapshot', selected_session.snapshot,
    'resultSummary', selected_session.result_summary, 'revision', selected_session.revision,
    'lastSequence', selected_session.last_event_sequence, 'startedAt', selected_session.started_at,
    'pausedAt', selected_session.paused_at, 'resumedAt', selected_session.resumed_at,
    'completedAt', selected_session.completed_at,
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'id', e.id, 'sequence', e.sequence, 'schemaVersion', e.schema_version,
      'senderId', e.sender_id, 'type', e.event_type, 'payload', e.payload,
      'clientCreatedAt', e.client_created_at, 'createdAt', e.created_at
    ) order by e.sequence) from (
      select * from public.room_events
      where session_id = selected_session.id and sequence > greatest(after_sequence, 0)
      order by sequence asc limit 500
    ) e), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.set_activity_paused(target_session_id uuid, is_paused boolean)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_session public.activity_sessions;
begin
  select * into selected_session from public.activity_sessions
  where id = target_session_id for update;
  if selected_session.id is null or not public.room_is_mine(selected_session.room_id) then
    raise exception using message = '[SESSION_UNAVAILABLE] Session unavailable';
  end if;
  if selected_session.status in ('completed', 'abandoned') then
    raise exception using message = '[SESSION_CLOSED] Session is already closed';
  end if;
  update public.activity_sessions set
    status = case when is_paused then 'paused' else 'active' end,
    paused_at = case when is_paused then now() else paused_at end,
    resumed_at = case when is_paused then resumed_at else now() end,
    revision = revision + 1, updated_at = now()
  where id = target_session_id;
  update public.rooms set status = case when is_paused then 'paused' else 'active' end,
    last_activity_at = now() where id = selected_session.room_id;
  return public.get_session_recovery(target_session_id, selected_session.last_event_sequence);
end;
$$;

create or replace function public.complete_activity(target_session_id uuid, result_snapshot jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_room_id uuid;
begin
  select room_id into selected_room_id from public.activity_sessions
  where id = target_session_id and public.session_is_mine(id) limit 1 for update;
  if selected_room_id is null then raise exception using message = '[SESSION_UNAVAILABLE] Session unavailable'; end if;
  if pg_column_size(coalesce(result_snapshot, '{}'::jsonb)) > 262144 then
    raise exception using message = '[RESULT_TOO_LARGE] Activity result is too large';
  end if;
  update public.activity_sessions set status = 'completed',
    result_summary = coalesce(result_snapshot, '{}'::jsonb), completed_at = now(),
    updated_at = now(), revision = revision + 1
  where id = target_session_id;
  update public.rooms set status = 'lobby', current_session_id = null, last_activity_at = now()
  where id = selected_room_id;
  return jsonb_build_object('completed', true, 'room', public.room_view(selected_room_id));
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
  where id = target_keepsake_id and public.is_couple_member(couple_id) for update;
  if selected_keepsake.id is null then
    raise exception using message = '[KEEPSAKE_UNAVAILABLE] Keepsake unavailable';
  end if;
  update public.keepsakes set status = 'deleted', deleted_at = now() where id = target_keepsake_id;
  if selected_keepsake.storage_bucket is not null and selected_keepsake.storage_path is not null then
    delete from storage.objects
    where bucket_id = selected_keepsake.storage_bucket and name = selected_keepsake.storage_path;
  end if;
  return jsonb_build_object('deleted', true, 'id', target_keepsake_id);
end;
$$;

drop policy if exists "keepsakes_select_couple" on public.keepsakes;
create policy "keepsakes_select_couple" on public.keepsakes for select to authenticated
using (status = 'finalized' and deleted_at is null and public.is_couple_member(couple_id));

revoke all on function public.enforce_couple_member_limit() from public, anon, authenticated;
revoke all on function public.prepare_room_domain_fields() from public, anon, authenticated;
revoke all on function public.sync_couple_current_room() from public, anon, authenticated;
revoke all on function public.set_activity_paused(uuid, boolean) from public, anon;
grant execute on function public.set_activity_paused(uuid, boolean) to authenticated;

commit;

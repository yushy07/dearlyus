-- Dearly Us: couple-authorized realtime rooms, activity sessions, private answers,
-- keepsake storage, milestones, and shared preferences.

alter table public.rooms add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.rooms add column if not exists expires_at timestamptz not null default (now() + interval '12 hours');
alter table public.rooms add column if not exists status text not null default 'lobby';
alter table public.rooms add column if not exists last_activity_at timestamptz not null default now();
alter table public.rooms add column if not exists completed_at timestamptz;
alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms add constraint rooms_status_check check (status in ('lobby', 'active', 'paused', 'completed', 'expired', 'cancelled'));
create index if not exists rooms_couple_status_idx on public.rooms(couple_id, status, last_activity_at desc);

alter table public.room_members add column if not exists last_seen_at timestamptz not null default now();
alter table public.room_members add column if not exists display_name text;
alter table public.room_members add column if not exists ready_at timestamptz;
alter table public.room_members add column if not exists left_at timestamptz;
create unique index if not exists room_members_room_user_idx on public.room_members(room_id, user_id);

create table if not exists public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  activity_type text not null,
  schema_version integer not null default 1 check (schema_version > 0),
  status text not null default 'preparing' check (status in ('preparing', 'active', 'waiting', 'revealing', 'completed', 'abandoned')),
  round_number integer not null default 0 check (round_number >= 0),
  snapshot jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  last_event_sequence bigint not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists activity_sessions_room_updated_idx on public.activity_sessions(room_id, updated_at desc);

alter table public.rooms add column if not exists current_session_id uuid references public.activity_sessions(id) on delete set null;

alter table public.room_events add column if not exists session_id uuid references public.activity_sessions(id) on delete cascade;
alter table public.room_events add column if not exists sequence bigint;
alter table public.room_events add column if not exists client_created_at timestamptz;
create unique index if not exists room_events_session_sequence_idx on public.room_events(session_id, sequence) where session_id is not null and sequence is not null;
create index if not exists room_events_session_created_idx on public.room_events(session_id, created_at);

create table if not exists public.private_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.activity_sessions(id) on delete cascade,
  round_number integer not null check (round_number >= 0),
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer jsonb not null,
  locked_at timestamptz,
  revealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, round_number, user_id)
);

create table if not exists public.relationship_milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  kind text not null,
  title text not null,
  keepsake_id uuid references public.keepsakes(id) on delete set null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists relationship_milestones_couple_idx on public.relationship_milestones(couple_id, occurred_at desc);

create table if not exists public.shared_preferences (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  preferred_mood text,
  default_duration_minutes integer check (default_duration_minutes between 5 and 240),
  ambient_audio_enabled boolean not null default false,
  reduced_motion boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.keepsakes add column if not exists session_id uuid references public.activity_sessions(id) on delete set null;
alter table public.keepsakes add column if not exists caption text;
alter table public.keepsakes add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.keepsakes add column if not exists created_by uuid references public.profiles(id) on delete set null;

create or replace function public.room_is_mine(target_room_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    join public.couple_members cm on cm.couple_id = r.couple_id
    where r.id = target_room_id and cm.user_id = auth.uid()
  );
$$;

create or replace function public.session_is_mine(target_session_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.activity_sessions s
    where s.id = target_session_id and public.room_is_mine(s.room_id)
  );
$$;

create or replace function public.get_couple_invite_preview(invite_code text)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare selected_invite public.couple_invites; inviter_name text; couple_name text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into selected_invite from public.couple_invites
  where code = upper(trim(invite_code)) and accepted_at is null and expires_at > now()
  limit 1;
  if selected_invite.id is null then raise exception 'Invitation unavailable'; end if;
  select display_name into inviter_name from public.profiles where id = selected_invite.created_by;
  select name into couple_name from public.couples where id = selected_invite.couple_id;
  return jsonb_build_object(
    'code', selected_invite.code,
    'coupleName', couple_name,
    'inviterName', coalesce(inviter_name, 'Your person'),
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
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then raise exception 'You already belong to a space'; end if;
  select * into selected_invite from public.couple_invites
  where code = upper(trim(invite_code)) and accepted_at is null and expires_at > now()
  for update;
  if selected_invite.id is null then raise exception 'That invite is invalid or expired'; end if;
  if selected_invite.created_by = auth.uid() then raise exception 'You cannot accept your own invitation'; end if;
  if (select count(*) from public.couple_members where couple_id = selected_invite.couple_id) >= 2 then raise exception 'That space already has two people'; end if;
  insert into public.couple_members (couple_id, user_id, role) values (selected_invite.couple_id, auth.uid(), 'partner');
  update public.couple_invites set accepted_at = now(), accepted_by = auth.uid() where id = selected_invite.id;
  return public.get_my_space();
end;
$$;

create or replace function public.room_view(target_room_id uuid)
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id,
    'code', r.code,
    'coupleId', r.couple_id,
    'status', r.status,
    'currentSessionId', r.current_session_id,
    'expiresAt', r.expires_at,
    'lastActivityAt', r.last_activity_at,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', rm.user_id,
        'displayName', p.display_name,
        'avatarUrl', p.avatar_url,
        'ready', rm.ready_at is not null and rm.left_at is null
      ) order by rm.joined_at)
      from public.room_members rm
      join public.profiles p on p.id = rm.user_id
      where rm.room_id = r.id and rm.left_at is null
    ), '[]'::jsonb)
  )
  from public.rooms r
  where r.id = target_room_id and public.room_is_mine(r.id);
$$;

create or replace function public.create_date_room()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  selected_couple_id uuid;
  selected_room_id uuid;
  new_code text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then raise exception 'Connect your partner first'; end if;

  select id into selected_room_id
  from public.rooms
  where couple_id = selected_couple_id
    and status in ('lobby', 'active', 'paused')
    and expires_at > now()
  order by created_at desc limit 1
  for update;

  if selected_room_id is null then
    loop
      new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit when not exists (select 1 from public.rooms where code = new_code and expires_at > now());
    end loop;
    insert into public.rooms (code, couple_id, created_by, status, expires_at, last_activity_at)
    values (new_code, selected_couple_id, auth.uid(), 'lobby', now() + interval '12 hours', now())
    returning id into selected_room_id;
  end if;

  insert into public.room_members (room_id, user_id, display_name, joined_at, last_seen_at, left_at)
  select selected_room_id, cm.user_id, coalesce(p.display_name, 'Partner'), now(), now(), null
  from public.couple_members cm join public.profiles p on p.id = cm.user_id
  where cm.couple_id = selected_couple_id
  on conflict (room_id, user_id) do update set display_name = excluded.display_name, last_seen_at = now(), left_at = null;

  update public.couples set active_room_code = (select code from public.rooms where id = selected_room_id), updated_at = now() where id = selected_couple_id;
  return public.room_view(selected_room_id);
end;
$$;

create or replace function public.join_date_room(room_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  selected_room public.rooms;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select r.* into selected_room from public.rooms r
  where r.code = upper(trim(room_code)) and r.status in ('lobby', 'active', 'paused') and r.expires_at > now()
  limit 1;
  if selected_room.id is null then raise exception 'Room unavailable'; end if;
  if not public.is_couple_member(selected_room.couple_id) then raise exception 'Room unavailable'; end if;

  insert into public.room_members (room_id, user_id, display_name, joined_at, last_seen_at, left_at)
  select selected_room.id, p.id, coalesce(p.display_name, 'Partner'), now(), now(), null from public.profiles p where p.id = auth.uid()
  on conflict (room_id, user_id) do update set display_name = excluded.display_name, last_seen_at = now(), left_at = null;
  update public.rooms set last_activity_at = now() where id = selected_room.id;
  return public.room_view(selected_room.id);
end;
$$;

create or replace function public.set_room_ready(room_code text, is_ready boolean)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_room_id uuid;
begin
  select r.id into selected_room_id from public.rooms r
  where r.code = upper(trim(room_code)) and public.room_is_mine(r.id) and r.status = 'lobby' and r.expires_at > now()
  limit 1;
  if selected_room_id is null then raise exception 'Room unavailable'; end if;
  update public.room_members set ready_at = case when is_ready then now() else null end, last_seen_at = now(), left_at = null
  where room_id = selected_room_id and user_id = auth.uid();
  return public.room_view(selected_room_id);
end;
$$;

create or replace function public.leave_date_room(room_code text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare selected_room_id uuid;
begin
  select id into selected_room_id from public.rooms where code = upper(trim(room_code)) and public.room_is_mine(id) limit 1;
  if selected_room_id is null then return; end if;
  update public.room_members set left_at = now(), ready_at = null, last_seen_at = now() where room_id = selected_room_id and user_id = auth.uid();
end;
$$;

create or replace function public.rotate_date_room_code(room_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_room_id uuid; new_code text;
begin
  select id into selected_room_id from public.rooms where code = upper(trim(room_code)) and public.room_is_mine(id) limit 1 for update;
  if selected_room_id is null then raise exception 'Room unavailable'; end if;
  loop
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.rooms where code = new_code and expires_at > now());
  end loop;
  update public.rooms set code = new_code, last_activity_at = now() where id = selected_room_id;
  update public.couples c set active_room_code = new_code, updated_at = now()
  from public.rooms r where r.id = selected_room_id and c.id = r.couple_id;
  return public.room_view(selected_room_id);
end;
$$;

create or replace function public.start_activity(room_code text, selected_activity text, initial_snapshot jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_room public.rooms; selected_session_id uuid; clean_activity text; existing_activity text; existing_revision bigint;
begin
  clean_activity := lower(trim(selected_activity));
  if clean_activity not in ('quiz','draw','cards','host','match','debate','court','dare','photobooth','passport','scrapbook') then
    raise exception 'Unsupported activity';
  end if;
  select r.* into selected_room from public.rooms r
  where r.code = upper(trim(room_code)) and public.room_is_mine(r.id) and r.status in ('lobby','paused','active') and r.expires_at > now()
  limit 1 for update;
  if selected_room.id is null then raise exception 'Room unavailable'; end if;
  if selected_room.current_session_id is not null then
    select activity_type, revision into existing_activity, existing_revision from public.activity_sessions
    where id = selected_room.current_session_id and status not in ('completed','abandoned');
    if existing_activity is not null then
      return jsonb_build_object('room', public.room_view(selected_room.id), 'sessionId', selected_room.current_session_id, 'activityType', existing_activity, 'revision', existing_revision);
    end if;
  end if;
  insert into public.activity_sessions (room_id, activity_type, status, snapshot, started_at)
  values (selected_room.id, clean_activity, 'active', coalesce(initial_snapshot, '{}'::jsonb), now())
  returning id into selected_session_id;
  update public.rooms set status = 'active', current_session_id = selected_session_id, last_activity_at = now() where id = selected_room.id;
  insert into public.room_events (room_id, session_id, sender_id, event_type, payload, sequence, created_at)
  values (selected_room.id, selected_session_id, auth.uid(), 'activity_started', jsonb_build_object('activityType', clean_activity), 1, now());
  update public.activity_sessions set last_event_sequence = 1, revision = 1 where id = selected_session_id;
  return jsonb_build_object('room', public.room_view(selected_room.id), 'sessionId', selected_session_id, 'activityType', clean_activity, 'revision', 1);
end;
$$;

create or replace function public.append_activity_event(
  target_session_id uuid,
  event_id uuid,
  event_name text,
  event_payload jsonb default '{}'::jsonb,
  expected_revision bigint default null,
  client_time timestamptz default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_session public.activity_sessions; next_sequence bigint; next_revision bigint;
begin
  if length(event_name) > 80 or event_name !~ '^[a-z][a-z0-9_]*$' then raise exception 'Invalid event'; end if;
  if pg_column_size(coalesce(event_payload, '{}'::jsonb)) > 65536 then raise exception 'Event too large'; end if;
  select * into selected_session from public.activity_sessions where id = target_session_id for update;
  if selected_session.id is null or not public.room_is_mine(selected_session.room_id) then raise exception 'Session unavailable'; end if;
  if selected_session.status in ('completed','abandoned') then raise exception 'Session closed'; end if;
  if event_name not like selected_session.activity_type || '\_%' escape '\' then raise exception 'Event does not belong to this activity'; end if;
  if expected_revision is not null and expected_revision <> selected_session.revision then
    return jsonb_build_object('accepted', false, 'reason', 'revision_conflict', 'revision', selected_session.revision, 'sequence', selected_session.last_event_sequence);
  end if;
  if exists (select 1 from public.room_events where session_id = target_session_id and id = event_id) then
    select sequence into next_sequence from public.room_events where session_id = target_session_id and id = event_id;
    return jsonb_build_object('accepted', true, 'duplicate', true, 'revision', selected_session.revision, 'sequence', next_sequence);
  end if;
  next_sequence := selected_session.last_event_sequence + 1;
  next_revision := selected_session.revision + 1;
  insert into public.room_events (id, room_id, session_id, sender_id, event_type, payload, sequence, client_created_at, created_at)
  values (event_id, selected_session.room_id, target_session_id, auth.uid(), event_name, coalesce(event_payload, '{}'::jsonb), next_sequence, client_time, now());
  update public.activity_sessions set last_event_sequence = next_sequence, revision = next_revision, updated_at = now() where id = target_session_id;
  update public.rooms set last_activity_at = now() where id = selected_session.room_id;
  return jsonb_build_object('accepted', true, 'duplicate', false, 'revision', next_revision, 'sequence', next_sequence);
end;
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
  if selected_session.id is null or not public.room_is_mine(selected_session.room_id) then raise exception 'Session unavailable'; end if;
  select jsonb_build_object(
    'sessionId', selected_session.id,
    'activityType', selected_session.activity_type,
    'status', selected_session.status,
    'roundNumber', selected_session.round_number,
    'snapshot', selected_session.snapshot,
    'revision', selected_session.revision,
    'lastSequence', selected_session.last_event_sequence,
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'id', e.id, 'sequence', e.sequence, 'senderId', e.sender_id, 'type', e.event_type,
      'payload', e.payload, 'createdAt', e.created_at
    ) order by e.sequence) from (
      select * from public.room_events
      where session_id = selected_session.id and sequence > greatest(after_sequence, 0)
      order by sequence asc limit 500
    ) e), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.lock_private_answer(target_session_id uuid, target_round integer, answer_payload jsonb)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare member_count integer; locked_count integer;
begin
  if not public.session_is_mine(target_session_id) then raise exception 'Session unavailable'; end if;
  if target_round < 0 or pg_column_size(answer_payload) > 16384 then raise exception 'Invalid answer'; end if;
  insert into public.private_answers (session_id, round_number, user_id, answer, locked_at, updated_at)
  values (target_session_id, target_round, auth.uid(), answer_payload, now(), now())
  on conflict (session_id, round_number, user_id) do update
    set answer = excluded.answer, locked_at = now(), updated_at = now()
    where public.private_answers.revealed_at is null;
  select count(*) into member_count from public.room_members rm join public.activity_sessions s on s.room_id = rm.room_id
  where s.id = target_session_id and rm.left_at is null;
  select count(*) into locked_count from public.private_answers where session_id = target_session_id and round_number = target_round and locked_at is not null;
  return jsonb_build_object('locked', true, 'bothLocked', member_count >= 2 and locked_count >= 2, 'lockedCount', locked_count);
end;
$$;

create or replace function public.reveal_private_answers(target_session_id uuid, target_round integer)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare member_count integer; locked_count integer; result jsonb;
begin
  if not public.session_is_mine(target_session_id) then raise exception 'Session unavailable'; end if;
  select count(*) into member_count from public.room_members rm join public.activity_sessions s on s.room_id = rm.room_id
  where s.id = target_session_id and rm.left_at is null;
  select count(*) into locked_count from public.private_answers where session_id = target_session_id and round_number = target_round and locked_at is not null;
  if member_count < 2 or locked_count < 2 then raise exception 'Both partners must lock answers first'; end if;
  update public.private_answers set revealed_at = coalesce(revealed_at, now()), updated_at = now()
  where session_id = target_session_id and round_number = target_round;
  select jsonb_build_object('roundNumber', target_round, 'answers', jsonb_agg(jsonb_build_object(
    'userId', pa.user_id, 'answer', pa.answer, 'lockedAt', pa.locked_at
  ) order by pa.created_at)) into result
  from public.private_answers pa where pa.session_id = target_session_id and pa.round_number = target_round;
  return result;
end;
$$;

create or replace function public.complete_activity(target_session_id uuid, result_snapshot jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare selected_room_id uuid;
begin
  select room_id into selected_room_id from public.activity_sessions where id = target_session_id and public.session_is_mine(id) limit 1 for update;
  if selected_room_id is null then raise exception 'Session unavailable'; end if;
  update public.activity_sessions set status = 'completed', snapshot = coalesce(result_snapshot, snapshot), completed_at = now(), updated_at = now(), revision = revision + 1
  where id = target_session_id;
  update public.rooms set status = 'lobby', current_session_id = null, last_activity_at = now() where id = selected_room_id;
  return jsonb_build_object('completed', true, 'room', public.room_view(selected_room_id));
end;
$$;

alter table public.activity_sessions enable row level security;
alter table public.private_answers enable row level security;
alter table public.relationship_milestones enable row level security;
alter table public.shared_preferences enable row level security;

drop policy if exists "members read rooms" on public.rooms;
drop policy if exists "users create rooms" on public.rooms;
drop policy if exists "members read room members" on public.room_members;
drop policy if exists "members read room events" on public.room_events;
drop policy if exists "members send room events" on public.room_events;

drop policy if exists "couple members read rooms" on public.rooms;
create policy "couple members read rooms" on public.rooms for select to authenticated using (public.is_couple_member(couple_id));
drop policy if exists "couple members read room members" on public.room_members;
create policy "couple members read room members" on public.room_members for select to authenticated using (public.room_is_mine(room_id));
drop policy if exists "couple members read room events" on public.room_events;
create policy "couple members read room events" on public.room_events for select to authenticated using (public.room_is_mine(room_id));
drop policy if exists "couple members read sessions" on public.activity_sessions;
create policy "couple members read sessions" on public.activity_sessions for select to authenticated using (public.room_is_mine(room_id));
drop policy if exists "users read own private answers" on public.private_answers;
create policy "users read own private answers" on public.private_answers for select to authenticated
using (user_id = auth.uid() or (revealed_at is not null and public.session_is_mine(session_id)));
drop policy if exists "couple members read milestones" on public.relationship_milestones;
create policy "couple members read milestones" on public.relationship_milestones for select to authenticated using (public.is_couple_member(couple_id));
drop policy if exists "couple members read preferences" on public.shared_preferences;
create policy "couple members read preferences" on public.shared_preferences for select to authenticated using (public.is_couple_member(couple_id));

revoke all on table public.rooms, public.room_members, public.room_events, public.activity_sessions, public.private_answers, public.relationship_milestones, public.shared_preferences from public, anon, authenticated;
grant select on table public.rooms, public.room_members, public.room_events, public.activity_sessions, public.private_answers, public.relationship_milestones, public.shared_preferences to authenticated;

-- Retire the original public room RPCs. New rooms must pass couple-membership checks.
do $$ begin
  revoke all on function public.create_room(text) from public, anon, authenticated;
exception when undefined_function then null; end $$;
do $$ begin
  revoke all on function public.join_room_by_code(text) from public, anon, authenticated;
exception when undefined_function then null; end $$;

revoke all on function public.room_is_mine(uuid) from public, anon;
revoke all on function public.session_is_mine(uuid) from public, anon;
revoke all on function public.room_view(uuid) from public, anon;
revoke all on function public.get_couple_invite_preview(text) from public, anon;
revoke all on function public.join_couple_by_invite(text) from public, anon;
revoke all on function public.create_date_room() from public, anon;
revoke all on function public.join_date_room(text) from public, anon;
revoke all on function public.set_room_ready(text, boolean) from public, anon;
revoke all on function public.leave_date_room(text) from public, anon;
revoke all on function public.rotate_date_room_code(text) from public, anon;
revoke all on function public.start_activity(text, text, jsonb) from public, anon;
revoke all on function public.append_activity_event(uuid, uuid, text, jsonb, bigint, timestamptz) from public, anon;
revoke all on function public.get_session_recovery(uuid, bigint) from public, anon;
revoke all on function public.lock_private_answer(uuid, integer, jsonb) from public, anon;
revoke all on function public.reveal_private_answers(uuid, integer) from public, anon;
revoke all on function public.complete_activity(uuid, jsonb) from public, anon;

grant execute on function public.room_is_mine(uuid) to authenticated;
grant execute on function public.session_is_mine(uuid) to authenticated;
grant execute on function public.room_view(uuid) to authenticated;
grant execute on function public.get_couple_invite_preview(text) to authenticated;
grant execute on function public.join_couple_by_invite(text) to authenticated;
grant execute on function public.create_date_room() to authenticated;
grant execute on function public.join_date_room(text) to authenticated;
grant execute on function public.set_room_ready(text, boolean) to authenticated;
grant execute on function public.leave_date_room(text) to authenticated;
grant execute on function public.rotate_date_room_code(text) to authenticated;
grant execute on function public.start_activity(text, text, jsonb) to authenticated;
grant execute on function public.append_activity_event(uuid, uuid, text, jsonb, bigint, timestamptz) to authenticated;
grant execute on function public.get_session_recovery(uuid, bigint) to authenticated;
grant execute on function public.lock_private_answer(uuid, integer, jsonb) to authenticated;
grant execute on function public.reveal_private_answers(uuid, integer) to authenticated;
grant execute on function public.complete_activity(uuid, jsonb) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_members;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_events;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.activity_sessions;
exception when duplicate_object then null; end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('couple-keepsakes', 'couple-keepsakes', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('couple-drawings', 'couple-drawings', false, 10485760, array['image/png','image/webp']),
  ('couple-photostrips', 'couple-photostrips', false, 15728640, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "couple members read private memories" on storage.objects;
create policy "couple members read private memories" on storage.objects for select to authenticated
using (
  bucket_id in ('couple-keepsakes','couple-drawings','couple-photostrips')
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "couple members upload private memories" on storage.objects;
create policy "couple members upload private memories" on storage.objects for insert to authenticated
with check (
  bucket_id in ('couple-keepsakes','couple-drawings','couple-photostrips')
  and owner_id = auth.uid()::text
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "owners update private memories" on storage.objects;
create policy "owners update private memories" on storage.objects for update to authenticated
using (owner_id = auth.uid()::text) with check (owner_id = auth.uid()::text);
drop policy if exists "owners delete private memories" on storage.objects;
create policy "owners delete private memories" on storage.objects for delete to authenticated
using (owner_id = auth.uid()::text);

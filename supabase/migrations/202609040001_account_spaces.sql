create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  city text not null default '',
  timezone text not null default '',
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists timezone text not null default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  active_room_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couples add column if not exists active_room_code text;
alter table public.couples add column if not exists updated_at timestamptz not null default now();

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id)
);

create table if not exists public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists couple_invites_couple_idx on public.couple_invites(couple_id);
create index if not exists couple_invites_code_idx on public.couple_invites(code);

create table if not exists public.keepsakes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('photostrip', 'passport', 'receipt', 'letter', 'scrapbook', 'activity')),
  title text not null,
  preview_url text,
  activity_path text,
  created_at timestamptz not null default now()
);

create index if not exists keepsakes_couple_created_idx on public.keepsakes(couple_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_couple_member(target_couple_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = target_couple_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_couple_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.keepsakes enable row level security;

drop policy if exists "profiles_select_connected" on public.profiles;
create policy "profiles_select_connected" on public.profiles for select to authenticated
using (
  id = auth.uid() or exists (
    select 1 from public.couple_members mine
    join public.couple_members theirs on theirs.couple_id = mine.couple_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "couples_select_members" on public.couples;
create policy "couples_select_members" on public.couples for select to authenticated
using (public.is_couple_member(id));

drop policy if exists "members_select_couple" on public.couple_members;
create policy "members_select_couple" on public.couple_members for select to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "invites_select_couple" on public.couple_invites;
create policy "invites_select_couple" on public.couple_invites for select to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "keepsakes_select_couple" on public.keepsakes;
create policy "keepsakes_select_couple" on public.keepsakes for select to authenticated
using (public.is_couple_member(couple_id));

grant select on table public.keepsakes to authenticated;

create or replace function public.get_my_space()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  selected_couple public.couples;
  result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select c.* into selected_couple
  from public.couples c
  join public.couple_members cm on cm.couple_id = c.id
  where cm.user_id = auth.uid()
  limit 1;

  if selected_couple.id is null then return null; end if;

  select jsonb_build_object(
    'id', selected_couple.id,
    'name', selected_couple.name,
    'createdBy', selected_couple.created_by,
    'activeRoomCode', selected_couple.active_room_code,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'displayName', p.display_name,
        'city', p.city,
        'timezone', p.timezone,
        'avatarUrl', p.avatar_url,
        'role', cm.role
      ) order by cm.joined_at)
      from public.couple_members cm
      join public.profiles p on p.id = cm.user_id
      where cm.couple_id = selected_couple.id
    ), '[]'::jsonb),
    'invite', (
      select jsonb_build_object('code', ci.code, 'expiresAt', ci.expires_at)
      from public.couple_invites ci
      where ci.couple_id = selected_couple.id
        and ci.accepted_at is null and ci.expires_at > now()
      order by ci.created_at desc limit 1
    )
  ) into result;
  return result;
end;
$$;

create or replace function public.create_couple_space(space_name text default null)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  new_couple_id uuid;
  new_code text;
  owner_name text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'You already belong to a space';
  end if;

  select nullif(trim(display_name), '') into owner_name from public.profiles where id = auth.uid();
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.couples (name, created_by, active_room_code)
  values (coalesce(nullif(trim(space_name), ''), coalesce(owner_name, 'Our') || '''s Space'), auth.uid(), upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)))
  returning id into new_couple_id;

  insert into public.couple_members (couple_id, user_id, role) values (new_couple_id, auth.uid(), 'owner');
  insert into public.couple_invites (couple_id, code, created_by) values (new_couple_id, new_code, auth.uid());
  return public.get_my_space();
end;
$$;

create or replace function public.regenerate_couple_invite()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  selected_couple_id uuid;
  new_code text;
begin
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then raise exception 'Create a space first'; end if;
  if (select count(*) from public.couple_members where couple_id = selected_couple_id) >= 2 then
    raise exception 'Your partner is already connected';
  end if;
  update public.couple_invites set expires_at = now() where couple_id = selected_couple_id and accepted_at is null;
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.couple_invites (couple_id, code, created_by) values (selected_couple_id, new_code, auth.uid());
  return public.get_my_space();
end;
$$;

create or replace function public.join_couple_by_invite(invite_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  selected_invite public.couple_invites;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'You already belong to a space';
  end if;

  select * into selected_invite from public.couple_invites
  where code = upper(trim(invite_code)) and accepted_at is null and expires_at > now()
  for update;
  if selected_invite.id is null then raise exception 'That invite is invalid or expired'; end if;
  if (select count(*) from public.couple_members where couple_id = selected_invite.couple_id) >= 2 then
    raise exception 'That space already has two people';
  end if;

  insert into public.couple_members (couple_id, user_id, role) values (selected_invite.couple_id, auth.uid(), 'partner');
  update public.couple_invites set accepted_at = now(), accepted_by = auth.uid() where id = selected_invite.id;
  return public.get_my_space();
end;
$$;

create or replace function public.rotate_couple_room()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  selected_couple_id uuid;
  new_room text;
begin
  select couple_id into selected_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if selected_couple_id is null then raise exception 'Create or join a space first'; end if;
  new_room := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  update public.couples set active_room_code = new_room, updated_at = now() where id = selected_couple_id;
  return public.get_my_space();
end;
$$;

revoke all on function public.is_couple_member(uuid) from public, anon;
revoke all on function public.get_my_space() from public, anon;
revoke all on function public.create_couple_space(text) from public, anon;
revoke all on function public.regenerate_couple_invite() from public, anon;
revoke all on function public.join_couple_by_invite(text) from public, anon;
revoke all on function public.rotate_couple_room() from public, anon;

grant execute on function public.is_couple_member(uuid) to authenticated;
grant execute on function public.get_my_space() to authenticated;
grant execute on function public.create_couple_space(text) to authenticated;
grant execute on function public.regenerate_couple_invite() to authenticated;
grant execute on function public.join_couple_by_invite(text) to authenticated;
grant execute on function public.rotate_couple_room() to authenticated;

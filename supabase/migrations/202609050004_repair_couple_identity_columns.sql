-- Repair legacy couple tables that existed before the account-space migration.
-- CREATE TABLE IF NOT EXISTS does not add missing columns to an existing table.

begin;

alter table public.couples
  add column if not exists name text;

update public.couples c
set name = coalesce(
  nullif(trim(p.display_name), '') || '''s Space',
  'Our Space'
)
from public.profiles p
where p.id = c.created_by
  and nullif(trim(c.name), '') is null;

update public.couples
set name = 'Our Space'
where nullif(trim(name), '') is null;

alter table public.couples
  alter column name set not null;

alter table public.couple_members
  add column if not exists role text;

update public.couple_members cm
set role = case
  when c.created_by = cm.user_id then 'owner'
  else 'partner'
end
from public.couples c
where c.id = cm.couple_id
  and (cm.role is null or cm.role not in ('owner', 'partner'));

update public.couple_members
set role = 'partner'
where role is null or role not in ('owner', 'partner');

alter table public.couple_members
  alter column role set default 'partner',
  alter column role set not null;

alter table public.couple_members
  drop constraint if exists couple_members_role_check;

alter table public.couple_members
  add constraint couple_members_role_check
  check (role in ('owner', 'partner'));

commit;

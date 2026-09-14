begin;

alter table public.plans_and_milestones
  add column if not exists revision bigint not null default 1;

alter table public.plans_and_milestones
  drop constraint if exists plans_and_milestones_record_kind_check;
alter table public.plans_and_milestones
  add constraint plans_and_milestones_record_kind_check check (
    record_kind in ('future_plan','reunion','bucket_date','date_plan','ritual','forecast','lab_session','love_match','date_night_capsule','birthday_gift','passport','cupidot_home')
  );

create or replace function public.upsert_shared_activity_record(
  target_couple_id uuid,
  target_kind text,
  target_key text,
  target_title text,
  target_payload jsonb,
  target_status text default 'active',
  target_at timestamptz default null,
  expected_revision bigint default null
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); saved public.plans_and_milestones;
begin
  if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
  if target_kind not in ('future_plan','reunion','bucket_date','date_plan','ritual','forecast','lab_session','love_match','date_night_capsule','birthday_gift','passport','cupidot_home') then raise exception 'INVALID_KIND'; end if;
  if target_key !~ '^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$' then raise exception 'INVALID_KEY'; end if;
  if char_length(coalesce(target_title,'')) not between 1 and 120 or pg_column_size(coalesce(target_payload,'{}'::jsonb))>65536 then raise exception 'INVALID_RECORD'; end if;

  select * into saved from public.plans_and_milestones
    where couple_id=target_couple_id and record_kind=target_kind and record_key=target_key
    for update;

  if saved.id is null then
    if expected_revision is not null and expected_revision<>0 then raise exception 'STALE_RECORD'; end if;
    insert into public.plans_and_milestones(couple_id,record_kind,record_key,title,payload,status,target_at,created_by,updated_by,revision)
    values(target_couple_id,target_kind,target_key,target_title,target_payload,target_status,target_at,actor,actor,1)
    returning * into saved;
  else
    if expected_revision is not null and saved.revision<>expected_revision then raise exception 'STALE_RECORD'; end if;
    update public.plans_and_milestones set title=target_title,payload=target_payload,status=target_status,target_at=target_at,
      updated_by=actor,updated_at=now(),revision=revision+1 where id=saved.id returning * into saved;
  end if;
  return to_jsonb(saved);
end $$;

revoke all on function public.upsert_shared_activity_record(uuid,text,text,text,jsonb,text,timestamptz,bigint) from public,anon;
grant execute on function public.upsert_shared_activity_record(uuid,text,text,text,jsonb,text,timestamptz,bigint) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.plans_and_milestones;
exception when duplicate_object then null;
end $$;

commit;

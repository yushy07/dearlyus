begin;

alter table public.profiles add column if not exists latitude double precision;
alter table public.profiles add column if not exists longitude double precision;
alter table public.profiles drop constraint if exists profiles_latitude_check;
alter table public.profiles add constraint profiles_latitude_check check (latitude is null or latitude between -90 and 90);
alter table public.profiles drop constraint if exists profiles_longitude_check;
alter table public.profiles add constraint profiles_longitude_check check (longitude is null or longitude between -180 and 180);

drop function if exists public.save_my_profile(text,text,text,text);
create function public.save_my_profile(
  profile_display_name text,
  profile_city text,
  profile_timezone text,
  profile_avatar_url text default null,
  profile_latitude double precision default null,
  profile_longitude double precision default null
)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); saved public.profiles;
begin
  if actor is null then raise exception 'You must be signed in to save a profile.' using errcode='42501'; end if;
  if char_length(btrim(coalesce(profile_display_name,''))) not between 1 and 60 then raise exception 'Display name must be between 1 and 60 characters.' using errcode='22023'; end if;
  if char_length(btrim(coalesce(profile_city,''))) not between 1 and 80 then raise exception 'City must be between 1 and 80 characters.' using errcode='22023'; end if;
  if char_length(btrim(coalesce(profile_timezone,''))) not between 1 and 80 then raise exception 'Timezone must be between 1 and 80 characters.' using errcode='22023'; end if;
  if profile_latitude is not null and profile_latitude not between -90 and 90 then raise exception 'Invalid latitude.' using errcode='22023'; end if;
  if profile_longitude is not null and profile_longitude not between -180 and 180 then raise exception 'Invalid longitude.' using errcode='22023'; end if;
  insert into public.profiles(id,display_name,city,timezone,avatar_url,latitude,longitude,onboarding_completed,account_status,updated_at)
  values(actor,btrim(profile_display_name),btrim(profile_city),btrim(profile_timezone),nullif(btrim(coalesce(profile_avatar_url,'')),''),profile_latitude,profile_longitude,true,'active',now())
  on conflict(id) do update set display_name=excluded.display_name,city=excluded.city,timezone=excluded.timezone,
    avatar_url=coalesce(excluded.avatar_url,public.profiles.avatar_url),latitude=excluded.latitude,longitude=excluded.longitude,
    onboarding_completed=true,updated_at=now()
  returning * into saved;
  return saved;
end $$;
revoke all on function public.save_my_profile(text,text,text,text,double precision,double precision) from public,anon;
grant execute on function public.save_my_profile(text,text,text,text,double precision,double precision) to authenticated;

create or replace function public.upsert_shared_activity_record(target_couple_id uuid,target_kind text,target_key text,target_title text,target_payload jsonb,target_status text default 'active',target_timestamp timestamptz default null,expected_revision bigint default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); saved public.plans_and_milestones;
begin
  if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
  if target_kind not in ('future_plan','reunion','bucket_date','date_plan','ritual','forecast','lab_session','love_match','date_night_capsule','birthday_gift','passport','cupidot_home','room_rules') then raise exception 'INVALID_KIND'; end if;
  if target_key !~ '^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$' then raise exception 'INVALID_KEY'; end if;
  if char_length(coalesce(target_title,'')) not between 1 and 120 or pg_column_size(coalesce(target_payload,'{}'::jsonb))>65536 then raise exception 'INVALID_RECORD'; end if;
  select * into saved from public.plans_and_milestones p where p.couple_id=target_couple_id and p.record_kind=target_kind and p.record_key=target_key for update;
  if saved.id is null then
    if expected_revision is not null and expected_revision<>0 then raise exception 'STALE_RECORD'; end if;
    insert into public.plans_and_milestones(couple_id,record_kind,record_key,title,payload,status,target_at,created_by,updated_by,revision)
      values(target_couple_id,target_kind,target_key,target_title,target_payload,target_status,target_timestamp,actor,actor,1) returning * into saved;
  else
    if expected_revision is not null and saved.revision<>expected_revision then raise exception 'STALE_RECORD'; end if;
    update public.plans_and_milestones p set title=target_title,payload=target_payload,status=target_status,target_at=target_timestamp,updated_by=actor,updated_at=now(),revision=p.revision+1 where p.id=saved.id returning * into saved;
  end if;
  return to_jsonb(saved);
end $$;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

commit;

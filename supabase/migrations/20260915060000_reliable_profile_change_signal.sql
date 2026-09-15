begin;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='couples') then
    alter publication supabase_realtime add table public.couples;
  end if;
end $$;

create or replace function public.save_my_profile(
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
  update public.couples c set updated_at=now()
    where exists(select 1 from public.couple_members cm where cm.couple_id=c.id and cm.user_id=actor);
  return saved;
end $$;

commit;

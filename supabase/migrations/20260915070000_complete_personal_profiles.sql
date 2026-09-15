begin;

alter table public.profiles add column if not exists pronouns text;
alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists personal_note text;
alter table public.profiles drop constraint if exists profiles_pronouns_length_check;
alter table public.profiles add constraint profiles_pronouns_length_check check (pronouns is null or char_length(pronouns) <= 40);
alter table public.profiles drop constraint if exists profiles_personal_note_length_check;
alter table public.profiles add constraint profiles_personal_note_length_check check (personal_note is null or char_length(personal_note) <= 180);

drop function if exists public.save_my_profile(text,text,text,text,double precision,double precision);
create function public.save_my_profile(
  profile_display_name text,
  profile_city text,
  profile_timezone text,
  profile_avatar_url text default null,
  profile_latitude double precision default null,
  profile_longitude double precision default null,
  profile_pronouns text default null,
  profile_birthday date default null,
  profile_personal_note text default null
)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); saved public.profiles;
begin
  if actor is null then raise exception 'You must be signed in to save a profile.' using errcode='42501'; end if;
  if char_length(btrim(coalesce(profile_display_name,''))) not between 1 and 60 then raise exception 'Display name must be between 1 and 60 characters.' using errcode='22023'; end if;
  if char_length(btrim(coalesce(profile_city,''))) not between 1 and 80 then raise exception 'City must be between 1 and 80 characters.' using errcode='22023'; end if;
  if char_length(btrim(coalesce(profile_timezone,''))) not between 1 and 80 then raise exception 'Timezone must be between 1 and 80 characters.' using errcode='22023'; end if;
  if char_length(btrim(coalesce(profile_pronouns,''))) > 40 then raise exception 'Pronouns must be 40 characters or fewer.' using errcode='22023'; end if;
  if char_length(btrim(coalesce(profile_personal_note,''))) > 180 then raise exception 'Personal note must be 180 characters or fewer.' using errcode='22023'; end if;
  if profile_birthday is not null and profile_birthday > current_date then raise exception 'Birthday cannot be in the future.' using errcode='22023'; end if;
  if profile_latitude is not null and profile_latitude not between -90 and 90 then raise exception 'Invalid latitude.' using errcode='22023'; end if;
  if profile_longitude is not null and profile_longitude not between -180 and 180 then raise exception 'Invalid longitude.' using errcode='22023'; end if;
  insert into public.profiles(id,display_name,city,timezone,avatar_url,latitude,longitude,pronouns,birthday,personal_note,onboarding_completed,account_status,updated_at)
  values(actor,btrim(profile_display_name),btrim(profile_city),btrim(profile_timezone),nullif(btrim(coalesce(profile_avatar_url,'')),''),profile_latitude,profile_longitude,nullif(btrim(coalesce(profile_pronouns,'')),''),profile_birthday,nullif(btrim(coalesce(profile_personal_note,'')),''),true,'active',now())
  on conflict(id) do update set display_name=excluded.display_name,city=excluded.city,timezone=excluded.timezone,
    avatar_url=coalesce(excluded.avatar_url,public.profiles.avatar_url),latitude=excluded.latitude,longitude=excluded.longitude,
    pronouns=excluded.pronouns,birthday=excluded.birthday,personal_note=excluded.personal_note,onboarding_completed=true,updated_at=now()
  returning * into saved;
  update public.couples c set updated_at=now()
    where exists(select 1 from public.couple_members cm where cm.couple_id=c.id and cm.user_id=actor);
  return saved;
end $$;
revoke all on function public.save_my_profile(text,text,text,text,double precision,double precision,text,date,text) from public,anon;
grant execute on function public.save_my_profile(text,text,text,text,double precision,double precision,text,date,text) to authenticated;

commit;

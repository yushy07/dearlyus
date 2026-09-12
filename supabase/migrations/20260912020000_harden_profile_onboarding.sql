begin;

create or replace function public.save_my_profile(
  profile_display_name text,
  profile_city text,
  profile_timezone text,
  profile_avatar_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_profile public.profiles;
  clean_name text := btrim(coalesce(profile_display_name, ''));
  clean_city text := btrim(coalesce(profile_city, ''));
  clean_timezone text := btrim(coalesce(profile_timezone, ''));
begin
  if current_user_id is null then
    raise exception 'You must be signed in to save a profile.' using errcode = '42501';
  end if;

  if char_length(clean_name) < 1 or char_length(clean_name) > 60 then
    raise exception 'Display name must be between 1 and 60 characters.' using errcode = '22023';
  end if;

  if char_length(clean_city) < 1 or char_length(clean_city) > 80 then
    raise exception 'City must be between 1 and 80 characters.' using errcode = '22023';
  end if;

  if char_length(clean_timezone) < 1 or char_length(clean_timezone) > 80 then
    raise exception 'Timezone must be between 1 and 80 characters.' using errcode = '22023';
  end if;

  insert into public.profiles (
    id,
    display_name,
    city,
    timezone,
    avatar_url,
    onboarding_completed,
    account_status,
    updated_at
  )
  values (
    current_user_id,
    clean_name,
    clean_city,
    clean_timezone,
    nullif(btrim(coalesce(profile_avatar_url, '')), ''),
    true,
    'active',
    now()
  )
  on conflict (id) do update
  set display_name = excluded.display_name,
      city = excluded.city,
      timezone = excluded.timezone,
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      onboarding_completed = true,
      updated_at = now()
  returning * into saved_profile;

  return saved_profile;
end;
$$;

revoke all on function public.save_my_profile(text, text, text, text) from public;
revoke all on function public.save_my_profile(text, text, text, text) from anon;
grant execute on function public.save_my_profile(text, text, text, text) to authenticated;

commit;

-- Dearly Us roadmap sections 9, 10, 11, 12: Relationship continuity,
-- date night capsules, guilt-free shared rituals, timezone scheduling, and safe keepsakes.

begin;

-- Ensure shared_preferences has rituals and capsule fields in metadata default
update public.shared_preferences
set metadata = jsonb_build_object(
  'capsules', coalesce(metadata->'capsules', '[]'::jsonb),
  'rituals', coalesce(metadata->'rituals', '{}'::jsonb),
  'mood_history', coalesce(metadata->'mood_history', '[]'::jsonb),
  'next_date_night', coalesce(metadata->'next_date_night', 'null'::jsonb)
) || metadata
where metadata is not null;

-- RPC: save date night capsule as a finalized keepsake and record session mood
create or replace function public.save_date_night_capsule(
  target_couple_id uuid,
  capsule_payload jsonb
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  new_keepsake_id uuid;
  capsule_title text;
  capsule_mood text;
  created_keepsake public.keepsakes;
begin
  if not public.is_couple_member(target_couple_id) then
    raise exception using message = '[FORBIDDEN] You do not belong to this couple space';
  end if;

  capsule_title := coalesce(capsule_payload->>'title', 'Date Night Capsule');
  capsule_mood := coalesce(capsule_payload->>'mood', 'romantic');

  -- 1. Insert into public.keepsakes
  insert into public.keepsakes (
    couple_id,
    created_by,
    kind,
    title,
    caption,
    metadata,
    status,
    finalized_at
  )
  values (
    target_couple_id,
    auth.uid(),
    'activity',
    capsule_title,
    coalesce(capsule_payload->>'favoriteMoment', 'A cherished moment sealed in our capsule.'),
    capsule_payload || jsonb_build_object('isCapsule', true, 'sealedAt', now()),
    'finalized',
    now()
  )
  returning * into created_keepsake;

  new_keepsake_id := created_keepsake.id;

  -- 2. Record relationship milestone if milestone count is low (e.g. first date night capsule)
  insert into public.relationship_milestones (
    couple_id,
    kind,
    title,
    keepsake_id,
    occurred_at,
    metadata
  )
  values (
    target_couple_id,
    'date_night_capsule',
    capsule_title,
    new_keepsake_id,
    now(),
    jsonb_build_object('capsuleId', new_keepsake_id, 'mood', capsule_mood)
  );

  -- 3. Update mood history in shared_preferences for Memory Weather
  insert into public.shared_preferences (couple_id, preferred_mood, metadata)
  values (
    target_couple_id,
    capsule_mood,
    jsonb_build_object('mood_history', jsonb_build_array(jsonb_build_object('mood', capsule_mood, 'date', now())))
  )
  on conflict (couple_id) do update
  set
    preferred_mood = excluded.preferred_mood,
    metadata = jsonb_set(
      coalesce(public.shared_preferences.metadata, '{}'::jsonb),
      '{mood_history}',
      coalesce(public.shared_preferences.metadata->'mood_history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('mood', capsule_mood, 'date', now()))
    ),
    updated_at = now();

  return jsonb_build_object('success', true, 'keepsake', row_to_json(created_keepsake));
end;
$$;

-- RPC: record a guilt-free shared ritual entry
create or replace function public.record_ritual_entry(
  target_couple_id uuid,
  ritual_key text,
  entry_payload jsonb
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  updated_prefs public.shared_preferences;
  existing_entries jsonb;
begin
  if not public.is_couple_member(target_couple_id) then
    raise exception using message = '[FORBIDDEN] You do not belong to this couple space';
  end if;

  -- Read existing entries
  select * into updated_prefs from public.shared_preferences where couple_id = target_couple_id for update;
  
  if updated_prefs.couple_id is null then
    insert into public.shared_preferences (couple_id, metadata)
    values (target_couple_id, jsonb_build_object('rituals', jsonb_build_object(ritual_key, jsonb_build_array(entry_payload || jsonb_build_object('recordedAt', now(), 'recordedBy', auth.uid())))))
    returning * into updated_prefs;
  else
    existing_entries := coalesce(updated_prefs.metadata->'rituals'->ritual_key, '[]'::jsonb);
    update public.shared_preferences
    set
      metadata = jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        array['rituals', ritual_key],
        existing_entries || jsonb_build_array(entry_payload || jsonb_build_object('recordedAt', now(), 'recordedBy', auth.uid()))
      ),
      updated_at = now()
    where couple_id = target_couple_id;
  end if;

  return jsonb_build_object('success', true, 'ritualKey', ritual_key);
end;
$$;

-- RPC: save next scheduled date night metadata for Timezone Bridge
create or replace function public.save_scheduled_date(
  target_couple_id uuid,
  scheduled_date timestamptz,
  title text default 'Our Next Date Night'
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_couple_member(target_couple_id) then
    raise exception using message = '[FORBIDDEN] You do not belong to this couple space';
  end if;

  insert into public.shared_preferences (couple_id, metadata)
  values (
    target_couple_id,
    jsonb_build_object('next_date_night', jsonb_build_object('scheduledAt', scheduled_date, 'title', title, 'setAt', now()))
  )
  on conflict (couple_id) do update
  set
    metadata = jsonb_set(
      coalesce(public.shared_preferences.metadata, '{}'::jsonb),
      '{next_date_night}',
      jsonb_build_object('scheduledAt', scheduled_date, 'title', title, 'setAt', now())
    ),
    updated_at = now();

  return jsonb_build_object('success', true, 'scheduledAt', scheduled_date, 'title', title);
end;
$$;

revoke all on function public.save_date_night_capsule(uuid, jsonb) from public, anon;
grant execute on function public.save_date_night_capsule(uuid, jsonb) to authenticated;

revoke all on function public.record_ritual_entry(uuid, text, jsonb) from public, anon;
grant execute on function public.record_ritual_entry(uuid, text, jsonb) to authenticated;

revoke all on function public.save_scheduled_date(uuid, timestamptz, text) from public, anon;
grant execute on function public.save_scheduled_date(uuid, timestamptz, text) to authenticated;

commit;

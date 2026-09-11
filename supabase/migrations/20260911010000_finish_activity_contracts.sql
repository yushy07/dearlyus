-- Complete the contracts consumed by the refined desktop activity flows.

insert into public.activity_event_contracts(activity_type,event_name,max_payload_bytes) values
  ('host','answer_locked',4096),
  ('host','answers_revealed',4096),
  ('host','gentle_skip',4096),
  ('shirts','shirts_design_update',16384),
  ('shirts','shirts_approve',4096)
on conflict(activity_type,event_name) do update
set max_payload_bytes=excluded.max_payload_bytes;

create or replace function public.list_recoverable_activity_sessions()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'sessionId',s.id,
    'activityType',s.activity_type,
    'updatedAt',s.updated_at,
    'expiresAt',s.expires_at,
    'revision',s.revision
  ) order by s.updated_at desc),'[]'::jsonb)
  from public.activity_sessions s
  where s.status not in ('completed','abandoned')
    and coalesce(s.expires_at,now()+interval '1 minute')>now()
    and public.room_is_mine(s.room_id);
$$;

revoke all on function public.list_recoverable_activity_sessions() from public,anon;
grant execute on function public.list_recoverable_activity_sessions() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('letter-assets','letter-assets',false,12582912,array['audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "letter audio upload by couple member" on storage.objects;
create policy "letter audio upload by couple member" on storage.objects
for insert to authenticated with check(
  bucket_id='letter-assets'
  and public.is_couple_member((storage.foldername(name))[1]::uuid)
  and (storage.foldername(name))[2]=auth.uid()::text
);

drop policy if exists "unlocked letter audio read" on storage.objects;
create policy "unlocked letter audio read" on storage.objects
for select to authenticated using(
  bucket_id='letter-assets'
  and exists(
    select 1 from public.sealed_letter_capsules letter
    where letter.couple_id=(storage.foldername(name))[1]::uuid
      and public.is_couple_member(letter.couple_id)
      and letter.unlock_at<=now()
      and letter.style->>'voicePath'=name
  )
);

drop policy if exists "unsealed letter audio delete" on storage.objects;
create policy "unsealed letter audio delete" on storage.objects
for delete to authenticated using(
  bucket_id='letter-assets'
  and (storage.foldername(name))[2]=auth.uid()::text
  and not exists(
    select 1 from public.sealed_letter_capsules letter
    where letter.style->>'voicePath'=name
  )
);

create or replace function public.list_sealed_letters(target_couple_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
  if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'title',title,'author',author_name,'unlockDate',unlock_at,
    'content',case when unlock_at<=now() then content else null end,
    'stamp',style->>'stamp','waxColor',style->>'waxColor',
    'voiceDurationSec',style->'voiceDurationSec',
    'voiceNotePath',case when unlock_at<=now() then style->>'voicePath' else null end
  ) order by unlock_at desc),'[]'::jsonb) into result
  from public.sealed_letter_capsules where couple_id=target_couple_id;
  return result;
end $$;

revoke all on function public.list_sealed_letters(uuid) from public,anon;
grant execute on function public.list_sealed_letters(uuid) to authenticated;

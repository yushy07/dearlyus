-- Additive completion patch for the existing live Dearly Us activity backend.
-- It extends the production couples/rooms/sessions contract; it does not create
-- duplicate room, couple, session, event, answer, or keepsake models.
begin;

alter table public.room_members
  add column if not exists activity_role text,
  add column if not exists last_ack_revision bigint not null default 0,
  add column if not exists reconnect_metadata jsonb not null default '{}'::jsonb;
alter table public.room_members drop constraint if exists room_members_activity_role_check;
alter table public.room_members add constraint room_members_activity_role_check
  check (activity_role is null or activity_role in ('host','partner','collaborator','spectator'));

create table if not exists public.plans_and_milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  record_kind text not null check (record_kind in ('future_plan','reunion','bucket_date','date_plan','ritual','forecast','lab_session','love_match','date_night_capsule')),
  record_key text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb check (pg_column_size(payload) <= 65536),
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  target_at timestamptz,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, record_kind, record_key)
);
create index if not exists plans_and_milestones_couple_updated_idx on public.plans_and_milestones(couple_id,updated_at desc);

create table if not exists public.temporary_assets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  session_id uuid references public.activity_sessions(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  storage_bucket text not null default 'activity-assets',
  storage_path text not null,
  media_kind text not null check (media_kind in ('image','audio')),
  mime_type text not null,
  byte_size bigint not null check (byte_size between 1 and 12582912),
  approval_state jsonb not null default '{}'::jsonb check (pg_column_size(approval_state) <= 8192),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  unique (storage_bucket,storage_path)
);
create index if not exists temporary_assets_expiry_idx on public.temporary_assets(expires_at);
create index if not exists temporary_assets_couple_idx on public.temporary_assets(couple_id,created_at desc);

alter table public.plans_and_milestones enable row level security;
alter table public.temporary_assets enable row level security;
drop policy if exists plans_member_read on public.plans_and_milestones;
create policy plans_member_read on public.plans_and_milestones for select to authenticated using (public.is_couple_member(couple_id));
drop policy if exists plans_member_insert on public.plans_and_milestones;
create policy plans_member_insert on public.plans_and_milestones for insert to authenticated with check (public.is_couple_member(couple_id) and created_by=auth.uid() and updated_by=auth.uid());
drop policy if exists plans_member_update on public.plans_and_milestones;
create policy plans_member_update on public.plans_and_milestones for update to authenticated using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id) and updated_by=auth.uid());
drop policy if exists plans_member_delete on public.plans_and_milestones;
create policy plans_member_delete on public.plans_and_milestones for delete to authenticated using (public.is_couple_member(couple_id));
drop policy if exists temporary_assets_member_read on public.temporary_assets;
create policy temporary_assets_member_read on public.temporary_assets for select to authenticated using (public.is_couple_member(couple_id));
drop policy if exists temporary_assets_owner_insert on public.temporary_assets;
create policy temporary_assets_owner_insert on public.temporary_assets for insert to authenticated with check (owner_id=auth.uid() and public.is_couple_member(couple_id));
drop policy if exists temporary_assets_member_update on public.temporary_assets;
create policy temporary_assets_member_update on public.temporary_assets for update to authenticated using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
drop policy if exists temporary_assets_owner_delete on public.temporary_assets;
create policy temporary_assets_owner_delete on public.temporary_assets for delete to authenticated using (owner_id=auth.uid() and public.is_couple_member(couple_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('activity-assets','activity-assets',false,12582912,array['image/jpeg','image/png','image/webp','audio/webm','audio/ogg','audio/mpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists activity_assets_member_read on storage.objects;
create policy activity_assets_member_read on storage.objects for select to authenticated using (bucket_id='activity-assets' and public.is_couple_member(((storage.foldername(name))[1])::uuid));
drop policy if exists activity_assets_owner_insert on storage.objects;
create policy activity_assets_owner_insert on storage.objects for insert to authenticated with check (bucket_id='activity-assets' and public.is_couple_member(((storage.foldername(name))[1])::uuid) and (storage.foldername(name))[2]=auth.uid()::text);
drop policy if exists activity_assets_owner_update on storage.objects;
create policy activity_assets_owner_update on storage.objects for update to authenticated using (bucket_id='activity-assets' and owner_id=auth.uid()::text) with check (bucket_id='activity-assets' and owner_id=auth.uid()::text and public.is_couple_member(((storage.foldername(name))[1])::uuid));
drop policy if exists activity_assets_owner_delete on storage.objects;
create policy activity_assets_owner_delete on storage.objects for delete to authenticated using (bucket_id='activity-assets' and owner_id=auth.uid()::text);

create or replace function public.save_date_night_capsule(target_couple_id uuid,capsule_payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); p public.plans_and_milestones; k public.keepsakes; plan_key text;
begin
 if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
 if pg_column_size(coalesce(capsule_payload,'{}'::jsonb))>65536 then raise exception 'PAYLOAD_TOO_LARGE'; end if;
 plan_key:=coalesce(nullif(capsule_payload->>'id',''),gen_random_uuid()::text);
 insert into public.plans_and_milestones(couple_id,record_kind,record_key,title,payload,status,created_by,updated_by)
 values(target_couple_id,'date_night_capsule',plan_key,coalesce(nullif(capsule_payload->>'title',''),'Our Date Night'),coalesce(capsule_payload,'{}'::jsonb),'completed',actor,actor) returning * into p;
 insert into public.keepsakes(couple_id,created_by,kind,title,caption,activity_path,metadata,status,finalized_at)
 values(target_couple_id,actor,'activity',p.title,nullif(capsule_payload->>'caption',''),'/date-planner',jsonb_build_object('planId',p.id,'recordKind',p.record_kind),'finalized',now()) returning * into k;
 return jsonb_build_object('success',true,'keepsake',to_jsonb(k),'planId',p.id);
end $$;

create or replace function public.record_ritual_entry(target_couple_id uuid,ritual_key text,entry_payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); day_key text;
begin
 if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
 if ritual_key !~ '^[a-z0-9][a-z0-9_-]{0,63}$' then raise exception 'INVALID_RITUAL_KEY'; end if;
 if pg_column_size(coalesce(entry_payload,'{}'::jsonb))>65536 then raise exception 'PAYLOAD_TOO_LARGE'; end if;
 day_key:=ritual_key||':'||current_date::text;
 insert into public.plans_and_milestones(couple_id,record_kind,record_key,title,payload,created_by,updated_by)
 values(target_couple_id,'ritual',day_key,ritual_key,coalesce(entry_payload,'{}'::jsonb),actor,actor)
 on conflict(couple_id,record_kind,record_key) do update set payload=excluded.payload,updated_by=actor,updated_at=now();
 return jsonb_build_object('success',true,'ritualKey',ritual_key,'recordKey',day_key);
end $$;

create or replace function public.save_scheduled_date(target_couple_id uuid,scheduled_date timestamptz,title text default 'Our Next Date Night') returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); p public.plans_and_milestones;
begin
 if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
 if scheduled_date is null then raise exception 'INVALID_DATE'; end if;
 if char_length(coalesce(title,'')) not between 1 and 120 then raise exception 'INVALID_TITLE'; end if;
 insert into public.plans_and_milestones(couple_id,record_kind,record_key,title,target_at,payload,created_by,updated_by)
 values(target_couple_id,'date_plan',gen_random_uuid()::text,title,scheduled_date,jsonb_build_object('scheduledAt',scheduled_date),actor,actor) returning * into p;
 insert into public.relationship_milestones(couple_id,kind,title,occurred_at,metadata) values(target_couple_id,'planned_date',title,scheduled_date,jsonb_build_object('planId',p.id));
 return jsonb_build_object('success',true,'scheduledAt',scheduled_date,'title',title,'planId',p.id);
end $$;

create or replace function public.register_temporary_activity_asset(target_couple_id uuid,target_session_id uuid,target_path text,target_media_kind text,target_mime_type text,target_byte_size bigint) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); saved public.temporary_assets;
begin
 if actor is null or not public.is_couple_member(target_couple_id) then raise exception 'FORBIDDEN'; end if;
 if target_session_id is not null and not exists(select 1 from public.activity_sessions s where s.id=target_session_id and public.is_room_member(s.room_id)) then raise exception 'FORBIDDEN'; end if;
 if (storage.foldername(target_path))[1]<>target_couple_id::text or (storage.foldername(target_path))[2]<>actor::text then raise exception 'INVALID_PATH'; end if;
 insert into public.temporary_assets(couple_id,session_id,owner_id,storage_path,media_kind,mime_type,byte_size)
 values(target_couple_id,target_session_id,actor,target_path,target_media_kind,target_mime_type,target_byte_size) returning * into saved;
 return to_jsonb(saved);
end $$;

create or replace function public.acknowledge_activity_revision(target_session_id uuid,acknowledged_revision bigint,participant_role text default null,reconnect_info jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); target_room uuid;
begin
 select room_id into target_room from public.activity_sessions where id=target_session_id;
 if actor is null or target_room is null or not public.is_room_member(target_room) then raise exception 'FORBIDDEN'; end if;
 if acknowledged_revision<0 or pg_column_size(coalesce(reconnect_info,'{}'::jsonb))>8192 then raise exception 'INVALID_ACK'; end if;
 update public.room_members set last_ack_revision=greatest(last_ack_revision,acknowledged_revision),activity_role=coalesce(participant_role,activity_role),reconnect_metadata=coalesce(reconnect_info,'{}'::jsonb),last_seen_at=now(),left_at=null where room_id=target_room and user_id=actor;
 return jsonb_build_object('acknowledged',true,'revision',acknowledged_revision);
end $$;

revoke all on function public.save_date_night_capsule(uuid,jsonb) from public,anon;
revoke all on function public.record_ritual_entry(uuid,text,jsonb) from public,anon;
revoke all on function public.save_scheduled_date(uuid,timestamptz,text) from public,anon;
revoke all on function public.register_temporary_activity_asset(uuid,uuid,text,text,text,bigint) from public,anon;
revoke all on function public.acknowledge_activity_revision(uuid,bigint,text,jsonb) from public,anon;
grant execute on function public.save_date_night_capsule(uuid,jsonb),public.record_ritual_entry(uuid,text,jsonb),public.save_scheduled_date(uuid,timestamptz,text),public.register_temporary_activity_asset(uuid,uuid,text,text,text,bigint),public.acknowledge_activity_revision(uuid,bigint,text,jsonb) to authenticated;
revoke all on public.plans_and_milestones,public.temporary_assets from anon;
grant select,insert,update,delete on public.plans_and_milestones,public.temporary_assets to authenticated;
commit;

-- Final activity backend completion: all catalogue activities, strict event
-- contracts, host/ready lifecycle, expiry, replay, host transfer, and cleanup.
begin;

alter table public.activity_sessions
  add column if not exists host_user_id uuid references auth.users(id),
  add column if not exists current_phase text not null default 'ready',
  add column if not exists expires_at timestamptz;
update public.activity_sessions s set
  host_user_id=coalesce(s.host_user_id,r.host_user_id),
  expires_at=coalesce(s.expires_at,r.expires_at)
from public.rooms r where r.id=s.room_id and (s.host_user_id is null or s.expires_at is null);
alter table public.activity_sessions alter column expires_at set default (now()+interval '24 hours');
alter table public.activity_sessions drop constraint if exists activity_sessions_phase_check;
alter table public.activity_sessions add constraint activity_sessions_phase_check
  check(current_phase in ('invite','ready','play','remember','closed'));
create index if not exists activity_sessions_expiry_idx on public.activity_sessions(expires_at) where status not in ('completed','abandoned');

create table if not exists public.activity_event_contracts(
  activity_type text not null,
  event_name text not null,
  max_payload_bytes integer not null default 65536 check(max_payload_bytes between 256 and 65536),
  primary key(activity_type,event_name)
);
revoke all on public.activity_event_contracts from public,anon,authenticated;

insert into public.activity_event_contracts(activity_type,event_name) values
('quiz','quiz_start'),('quiz','answer_locked'),('quiz','reveal_ready'),('quiz','answers_revealed'),('quiz','quiz_next'),('quiz','gentle_skip'),('quiz','reaction_sent'),
('draw','draw_batch'),('draw','draw_clear'),('draw','draw_checkpoint'),('draw','draw_complete'),
('cards','cards_draw'),('cards','cards_flip'),('cards','cards_next'),('cards','cards_scratch'),('cards','gentle_skip'),
('host','host_prompt_change'),('host','host_speaker_switch'),('host','host_commentary'),('host','host_steer_signal'),('host','host_tone_change'),('host','host_finish'),
('match','match_select'),('match','match_reveal'),('match','match_next'),
('court','court_case_change'),('court','court_consent'),('court','court_plea'),('court','court_argument'),('court','court_objection'),('court','court_verdict'),('court','court_close'),
('dare','dare_accept'),('dare','dare_complete'),('dare','dare_reroll'),('dare','dare_finish'),
('photobooth','photo_start_countdown'),('photobooth','photo_tick'),('photobooth','photo_shutter'),('photobooth','photo_filter'),('photobooth','photo_finish'),
('passport','passport_stamp_add'),('passport','scrapbook_entry_add'),('passport','page_turn'),
('letter','letter_mode_select'),('letter','letter_progress_update'),('letter','letter_seal_propose'),('letter','letter_seal_confirm'),('letter','letter_unseal'),
('arcade','arcade_game_select'),('arcade','arcade_round_start'),('arcade','arcade_score_update'),('arcade','arcade_round_end'),('arcade','arcade_rematch'),
('scrapbook','scrapbook_element_add'),('scrapbook','scrapbook_element_update'),('scrapbook','scrapbook_element_remove'),('scrapbook','scrapbook_theme_select'),('scrapbook','scrapbook_clear'),
('iq','iq_category_select'),('iq','iq_answer_lock'),('iq','iq_round_reveal'),('iq','iq_next_question'),
('riddle','riddle_case_select'),('riddle','riddle_clue_unlock'),('riddle','riddle_note_add'),('riddle','riddle_hint_request'),('riddle','riddle_answer_submit'),
('lab','lab_preset_select'),('lab','lab_start'),('lab','lab_pause'),('lab','lab_resume'),('lab','lab_task_update'),('lab','lab_block_complete'),
('debate','debate_topic_select'),('debate','debate_phase_next'),('debate','debate_vote_submit'),('debate','debate_finish'),
('hunt','hunt_prompt_start'),('hunt','hunt_proof_submit'),('hunt','hunt_proof_reveal'),('hunt','hunt_react'),('hunt','hunt_next_round'),
('future','future_dream_add'),('future','future_dream_move'),('future','future_dream_update'),('future','future_dream_archive'),
('birthday','birthday_template_select'),('birthday','birthday_section_update'),('birthday','birthday_reveal'),
('fashion','fashion_brief_start'),('fashion','fashion_look_lock'),('fashion','fashion_reveal'),('fashion','fashion_vote'),('fashion','fashion_next_round'),
('shirts','shirts_motif_select'),('shirts','shirts_text_update'),('shirts','shirts_color_update'),('shirts','shirts_view_switch'),
('forecast','forecast_checkin_submit'),('forecast','forecast_reveal'),
('timezone','timezone_city_update'),('timezone','timezone_reunion_set'),('timezone','timezone_packing_toggle'),('timezone','timezone_packing_add'),
('bucket','bucket_status_change'),('bucket','bucket_scratch_reveal'),
('date','date_itinerary_build'),('date','date_itinerary_reorder'),('date','date_step_start'),('date','date_step_complete'),('date','date_finish')
on conflict(activity_type,event_name) do update set max_payload_bytes=excluded.max_payload_bytes;

create or replace function public.start_activity(room_code text,selected_activity text,initial_snapshot jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare selected_room public.rooms; selected_session_id uuid; clean_activity text; existing_activity text; existing_revision bigint; active_count int; ready_count int;
begin
 clean_activity:=lower(trim(selected_activity));
 if not exists(select 1 from public.activity_event_contracts where activity_type=clean_activity) then raise exception 'Unsupported activity'; end if;
 if pg_column_size(coalesce(initial_snapshot,'{}'::jsonb))>65536 then raise exception 'Initial snapshot too large'; end if;
 select r.* into selected_room from public.rooms r where r.code=upper(trim(room_code)) and public.room_is_mine(r.id) and r.status in ('lobby','paused','active') and r.expires_at>now() limit 1 for update;
 if selected_room.id is null then raise exception 'Room unavailable'; end if;
 if selected_room.host_user_id<>auth.uid() then raise exception 'Only the room host can start'; end if;
 select count(*),count(*) filter(where ready_at is not null) into active_count,ready_count from public.room_members where room_id=selected_room.id and left_at is null;
 if active_count<2 or ready_count<active_count then raise exception 'Both partners must be ready'; end if;
 if selected_room.current_session_id is not null then
  select activity_type,revision into existing_activity,existing_revision from public.activity_sessions where id=selected_room.current_session_id and status not in ('completed','abandoned');
  if existing_activity is not null then return jsonb_build_object('room',public.room_view(selected_room.id),'sessionId',selected_room.current_session_id,'activityType',existing_activity,'revision',existing_revision); end if;
 end if;
 insert into public.activity_sessions(room_id,activity_type,status,current_phase,snapshot,host_user_id,expires_at,started_at)
 values(selected_room.id,clean_activity,'active','play',coalesce(initial_snapshot,'{}'::jsonb),auth.uid(),least(selected_room.expires_at,now()+interval '24 hours'),now()) returning id into selected_session_id;
 update public.rooms set status='active',current_session_id=selected_session_id,last_activity_at=now() where id=selected_room.id;
 insert into public.room_events(room_id,session_id,sender_id,event_type,payload,sequence,created_at) values(selected_room.id,selected_session_id,auth.uid(),'activity_started',jsonb_build_object('activityType',clean_activity),1,now());
 update public.activity_sessions set last_event_sequence=1,revision=1 where id=selected_session_id;
 return jsonb_build_object('room',public.room_view(selected_room.id),'sessionId',selected_session_id,'activityType',clean_activity,'revision',1);
end $$;

create or replace function public.append_activity_event(target_session_id uuid,event_id uuid,event_name text,event_payload jsonb default '{}'::jsonb,expected_revision bigint default null,client_time timestamptz default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.activity_sessions; next_sequence bigint; next_revision bigint; payload_limit int;
begin
 if auth.uid() is null or event_id is null or length(event_name)>80 or event_name!~'^[a-z][a-z0-9_]*$' then raise exception 'Invalid event'; end if;
 select * into s from public.activity_sessions where id=target_session_id for update;
 if s.id is null or not public.room_is_mine(s.room_id) then raise exception 'Session unavailable'; end if;
 if s.status in ('completed','abandoned') or coalesce(s.expires_at,'infinity')<=now() then raise exception 'Session closed'; end if;
 select max_payload_bytes into payload_limit from public.activity_event_contracts where activity_type=s.activity_type and activity_event_contracts.event_name=append_activity_event.event_name;
 if payload_limit is null then raise exception 'Event does not belong to this activity'; end if;
 if pg_column_size(coalesce(event_payload,'{}'::jsonb))>payload_limit then raise exception 'Event too large'; end if;
 if exists(select 1 from public.room_events where session_id=target_session_id and id=event_id) then
  select sequence into next_sequence from public.room_events where session_id=target_session_id and id=event_id;
  return jsonb_build_object('accepted',true,'duplicate',true,'revision',s.revision,'sequence',next_sequence);
 end if;
 if expected_revision is not null and expected_revision<>s.revision then return jsonb_build_object('accepted',false,'reason','revision_conflict','revision',s.revision,'sequence',s.last_event_sequence); end if;
 next_sequence:=s.last_event_sequence+1; next_revision:=s.revision+1;
 insert into public.room_events(id,room_id,session_id,sender_id,event_type,payload,sequence,client_created_at,created_at) values(event_id,s.room_id,target_session_id,auth.uid(),event_name,coalesce(event_payload,'{}'::jsonb),next_sequence,client_time,now());
 update public.activity_sessions set last_event_sequence=next_sequence,revision=next_revision,updated_at=now() where id=target_session_id;
 update public.rooms set last_activity_at=now() where id=s.room_id;
 return jsonb_build_object('accepted',true,'duplicate',false,'revision',next_revision,'sequence',next_sequence);
end $$;

create or replace function public.transfer_activity_host(target_session_id uuid,new_host_user_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.activity_sessions;
begin
 select * into s from public.activity_sessions where id=target_session_id for update;
 if s.id is null or not public.room_is_mine(s.room_id) or s.host_user_id<>auth.uid() then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.room_members where room_id=s.room_id and user_id=new_host_user_id and left_at is null) then raise exception 'NEW_HOST_UNAVAILABLE'; end if;
 update public.activity_sessions set host_user_id=new_host_user_id,revision=revision+1,updated_at=now() where id=s.id;
 update public.rooms set host_user_id=new_host_user_id,last_activity_at=now() where id=s.room_id;
 return jsonb_build_object('transferred',true,'hostUserId',new_host_user_id);
end $$;

create or replace function public.close_activity_session(target_session_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.activity_sessions;
begin
 select * into s from public.activity_sessions where id=target_session_id for update;
 if s.id is null or not public.room_is_mine(s.room_id) or s.host_user_id<>auth.uid() then raise exception 'FORBIDDEN'; end if;
 update public.activity_sessions set status='abandoned',current_phase='closed',updated_at=now(),revision=revision+1 where id=s.id and status not in('completed','abandoned');
 update public.rooms set status='lobby',current_session_id=null,last_activity_at=now() where id=s.room_id and current_session_id=s.id;
 return jsonb_build_object('closed',true,'room',public.room_view(s.room_id));
end $$;

create or replace function public.touch_activity_session(target_session_id uuid,acknowledged_revision bigint default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.activity_sessions; new_expiry timestamptz;
begin
 select * into s from public.activity_sessions where id=target_session_id for update;
 if s.id is null or not public.room_is_mine(s.room_id) or s.status in('completed','abandoned') then raise exception 'SESSION_UNAVAILABLE'; end if;
 new_expiry:=least((select expires_at from public.rooms where id=s.room_id),now()+interval '24 hours');
 update public.activity_sessions set expires_at=new_expiry,updated_at=now() where id=s.id;
 update public.room_members set last_seen_at=now(),left_at=null,last_ack_revision=greatest(last_ack_revision,coalesce(acknowledged_revision,last_ack_revision)) where room_id=s.room_id and user_id=auth.uid();
 return jsonb_build_object('active',true,'expiresAt',new_expiry,'revision',s.revision);
end $$;

create or replace function public.cleanup_expired_activity_data() returns jsonb language plpgsql security definer set search_path=public,storage as $$
declare assets_deleted int; sessions_expired int;
begin
 delete from storage.objects o using public.temporary_assets a where a.storage_bucket=o.bucket_id and a.storage_path=o.name and a.expires_at<=now();
 delete from public.temporary_assets where expires_at<=now(); get diagnostics assets_deleted=row_count;
 update public.activity_sessions s set status='abandoned',current_phase='closed',updated_at=now() where s.status not in('completed','abandoned') and s.expires_at<=now(); get diagnostics sessions_expired=row_count;
 update public.rooms r set status='expired',current_session_id=null where r.expires_at<=now() and r.status not in('completed','expired','cancelled');
 return jsonb_build_object('assetsDeleted',assets_deleted,'sessionsExpired',sessions_expired);
end $$;

revoke all on function public.start_activity(text,text,jsonb),public.append_activity_event(uuid,uuid,text,jsonb,bigint,timestamptz),public.transfer_activity_host(uuid,uuid),public.close_activity_session(uuid),public.touch_activity_session(uuid,bigint),public.cleanup_expired_activity_data() from public,anon;
grant execute on function public.start_activity(text,text,jsonb),public.append_activity_event(uuid,uuid,text,jsonb,bigint,timestamptz),public.transfer_activity_host(uuid,uuid),public.close_activity_session(uuid),public.touch_activity_session(uuid,bigint) to authenticated;
revoke all on function public.cleanup_expired_activity_data() from authenticated;
grant execute on function public.cleanup_expired_activity_data() to service_role;

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='plans_and_milestones') then alter publication supabase_realtime add table public.plans_and_milestones; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='temporary_assets') then alter publication supabase_realtime add table public.temporary_assets; end if;
end $$;
commit;

create extension if not exists pg_cron with schema pg_catalog;
do $$ begin
 if exists(select 1 from cron.job where jobname='dearly-us-activity-cleanup') then perform cron.unschedule('dearly-us-activity-cleanup'); end if;
 perform cron.schedule('dearly-us-activity-cleanup','17 * * * *','select public.cleanup_expired_activity_data()');
end $$;

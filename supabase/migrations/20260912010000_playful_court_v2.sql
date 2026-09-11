-- Playful Couples Court v2: authoritative turns, private-input markers and
-- revision-bound Judge Cupidot generations. No media storage is introduced.
begin;

insert into public.activity_event_contracts(activity_type,event_name,max_payload_bytes) values
  ('court','court_topic_selected',4096),
  ('court','court_statement_locked',1024),
  ('court','court_statements_revealed',8192),
  ('court','court_question_created',8192),
  ('court','court_followup_locked',1024),
  ('court','court_followups_revealed',8192),
  ('court','court_objection_used',2048),
  ('court','court_twist_started',4096),
  ('court','court_twist_completed',4096),
  ('court','court_deliberation_started',1024),
  ('court','court_verdict_created',12288),
  ('court','court_verdict_accepted',1024),
  ('court','court_sentence_softened',4096),
  ('court','court_round_finished',1024),
  ('court','court_rematch_started',1024)
on conflict(activity_type,event_name) do update
set max_payload_bytes=excluded.max_payload_bytes;

create table if not exists public.court_judge_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.activity_sessions(id) on delete cascade,
  session_revision bigint not null,
  mode text not null check(mode in ('reaction','verdict','soften')),
  input_hash text not null,
  output jsonb not null check(pg_column_size(output)<=16384),
  source text not null check(source in ('generated','fallback')),
  created_at timestamptz not null default now(),
  unique(session_id,session_revision,mode)
);
create index if not exists court_judge_runs_session_idx
  on public.court_judge_runs(session_id,created_at desc);
alter table public.court_judge_runs enable row level security;
revoke all on public.court_judge_runs from public,anon,authenticated;
grant select,insert,update,delete on public.court_judge_runs to service_role;

create or replace function public.submit_court_action(
  target_session_id uuid,
  action_name text,
  action_payload jsonb default '{}'::jsonb,
  expected_revision bigint default null
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  actor uuid:=auth.uid();
  s public.activity_sessions;
  next_snapshot jsonb;
  stage text;
  next_stage text;
  next_sequence bigint;
  next_revision bigint;
  other_actor uuid;
  first_actor uuid;
  second_actor uuid;
  locks jsonb;
  accepts jsonb;
  event_id uuid:=gen_random_uuid();
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.activity_sessions where id=target_session_id for update;
  if s.id is null or s.activity_type<>'court' then raise exception 'SESSION_UNAVAILABLE'; end if;
  if not public.is_room_member(s.room_id) then raise exception 'FORBIDDEN'; end if;
  if s.status in ('completed','abandoned') then raise exception 'SESSION_CLOSED'; end if;
  if expected_revision is not null and s.revision<>expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  if not exists(select 1 from public.activity_event_contracts where activity_type='court' and event_name=action_name) then raise exception 'INVALID_EVENT'; end if;
  if pg_column_size(coalesce(action_payload,'{}'::jsonb))>16384 then raise exception 'PAYLOAD_TOO_LARGE'; end if;

  next_snapshot:=coalesce(s.snapshot,'{}'::jsonb);
  stage:=coalesce(next_snapshot->>'stage','welcome');
  if stage in ('filing','consent','arguments') then stage:='choose_topic'; end if;
  next_stage:=stage;
  select rm.user_id into other_actor from public.room_members rm
    where rm.room_id=s.room_id and rm.user_id<>s.host_user_id and rm.left_at is null limit 1;

  case action_name
    when 'court_topic_selected' then
      if stage not in ('welcome','choose_topic','finished') then raise exception 'INVALID_TRANSITION'; end if;
      if actor<>s.host_user_id then raise exception 'HOST_REQUIRED'; end if;
      if char_length(trim(coalesce(action_payload->>'topic',''))) not between 1 and 280 then raise exception 'INVALID_TOPIC'; end if;
      if coalesce((next_snapshot->>'rematchCount')::int,0)%2=0 then first_actor:=s.host_user_id; second_actor:=other_actor;
      else first_actor:=other_actor; second_actor:=s.host_user_id; end if;
      next_snapshot:=jsonb_build_object(
        'activityType','court','schemaVersion',2,'status','active','stage','statement_one',
        'roundId',gen_random_uuid(),'topicKey',coalesce(action_payload->>'topicKey','custom'),
        'topic',trim(action_payload->>'topic'),'firstSpeakerId',first_actor,'secondSpeakerId',second_actor,
        'statementOneLocked',false,'statementTwoLocked',false,'followupLockedBy','[]'::jsonb,
        'objectionsUsed','[]'::jsonb,'acceptedBy','[]'::jsonb,
        'rematchCount',coalesce((next_snapshot->>'rematchCount')::int,0),
        'deadlineAt',now()+interval '90 seconds','completed',false
      );
      next_stage:='statement_one';
    when 'court_statement_locked' then
      first_actor:=(next_snapshot->>'firstSpeakerId')::uuid;
      second_actor:=(next_snapshot->>'secondSpeakerId')::uuid;
      if stage='statement_one' and actor=first_actor then
        next_snapshot:=next_snapshot||jsonb_build_object('statementOneLocked',true,'stage','statement_two','deadlineAt',now()+interval '90 seconds');
        next_stage:='statement_two';
      elsif stage='statement_two' and actor=second_actor then
        next_snapshot:=next_snapshot||jsonb_build_object('statementTwoLocked',true,'stage','reveal','deadlineAt',null);
        next_stage:='reveal';
      else raise exception 'NOT_YOUR_TURN'; end if;
    when 'court_statements_revealed' then
      if stage<>'reveal' or not coalesce((next_snapshot->>'statementOneLocked')::boolean,false) or not coalesce((next_snapshot->>'statementTwoLocked')::boolean,false) then raise exception 'REVEAL_NOT_READY'; end if;
      if char_length(coalesce(action_payload->>'statementOne',''))>280 or char_length(coalesce(action_payload->>'statementTwo',''))>280 then raise exception 'INVALID_STATEMENT'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('statements',jsonb_build_object('one',action_payload->>'statementOne','two',action_payload->>'statementTwo'),'stage','reveal');
    when 'court_followup_locked' then
      if stage<>'judge_question' then raise exception 'INVALID_TRANSITION'; end if;
      locks:=coalesce(next_snapshot->'followupLockedBy','[]'::jsonb);
      if locks @> jsonb_build_array(actor::text) then raise exception 'ANSWER_ALREADY_LOCKED'; end if;
      locks:=locks||jsonb_build_array(actor::text);
      next_snapshot:=jsonb_set(next_snapshot,'{followupLockedBy}',locks,true);
    when 'court_followups_revealed' then
      if stage<>'judge_question' or jsonb_array_length(coalesce(next_snapshot->'followupLockedBy','[]'::jsonb))<2 then raise exception 'REVEAL_NOT_READY'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('followups',coalesce(action_payload->'answers','[]'::jsonb),'stage',case when coalesce((action_payload->>'hasTwist')::boolean,false) then 'judge_twist' else 'deliberating' end);
      next_stage:=next_snapshot->>'stage';
    when 'court_objection_used' then
      if stage not in ('reveal','judge_question','judge_twist') then raise exception 'INVALID_TRANSITION'; end if;
      locks:=coalesce(next_snapshot->'objectionsUsed','[]'::jsonb);
      if locks @> jsonb_build_array(actor::text) then raise exception 'OBJECTION_ALREADY_USED'; end if;
      next_snapshot:=jsonb_set(next_snapshot,'{objectionsUsed}',locks||jsonb_build_array(actor::text),true);
    when 'court_twist_started' then
      if stage not in ('judge_question','judge_twist') then raise exception 'INVALID_TRANSITION'; end if;
      if actor<>s.host_user_id then raise exception 'HOST_REQUIRED'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','judge_twist','twist',coalesce(action_payload,'{}'::jsonb),'deadlineAt',now()+interval '30 seconds');
      next_stage:='judge_twist';
    when 'court_twist_completed' then
      if stage<>'judge_twist' then raise exception 'INVALID_TRANSITION'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('twistResult',coalesce(action_payload,'{}'::jsonb),'stage','deliberating','deadlineAt',null);
      next_stage:='deliberating';
    when 'court_deliberation_started' then
      if stage not in ('reveal','judge_question','judge_twist','deliberating') then raise exception 'INVALID_TRANSITION'; end if;
      if actor<>s.host_user_id then raise exception 'HOST_REQUIRED'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','deliberating','deadlineAt',null);
      next_stage:='deliberating';
    when 'court_verdict_accepted' then
      if stage<>'verdict' then raise exception 'INVALID_TRANSITION'; end if;
      accepts:=coalesce(next_snapshot->'acceptedBy','[]'::jsonb);
      if not (accepts @> jsonb_build_array(actor::text)) then accepts:=accepts||jsonb_build_array(actor::text); end if;
      next_snapshot:=jsonb_set(next_snapshot,'{acceptedBy}',accepts,true);
      if jsonb_array_length(accepts)>=2 then next_snapshot:=next_snapshot||jsonb_build_object('stage','finished','completed',true,'status','completed'); next_stage:='finished'; end if;
    when 'court_round_finished' then
      if stage not in ('verdict','finished') or actor<>s.host_user_id then raise exception 'INVALID_TRANSITION'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','finished','completed',true,'status','completed');
      next_stage:='finished';
    when 'court_rematch_started' then
      if stage<>'finished' or actor<>s.host_user_id then raise exception 'INVALID_TRANSITION'; end if;
      next_snapshot:=jsonb_build_object('activityType','court','schemaVersion',2,'status','active','stage','choose_topic','rematchCount',coalesce((next_snapshot->>'rematchCount')::int,0)+1,'completed',false);
      next_stage:='choose_topic';
    else
      raise exception 'SERVER_ACTION_REQUIRED';
  end case;

  next_sequence:=coalesce(s.last_event_sequence,0)+1;
  next_revision:=coalesce(s.revision,0)+1;
  insert into public.room_events(id,room_id,session_id,sender_id,event_type,payload,sequence,client_created_at,created_at)
    values(event_id,s.room_id,s.id,actor,action_name,coalesce(action_payload,'{}'::jsonb),next_sequence,now(),now());
  update public.activity_sessions set snapshot=next_snapshot,last_event_sequence=next_sequence,revision=next_revision,
    current_phase=case when next_stage in ('welcome','choose_topic') then 'ready' when next_stage in ('verdict','finished') then 'remember' else 'play' end,
    status=case when next_stage='finished' then 'completed' else 'active' end,updated_at=now()
    where id=s.id;
  return jsonb_build_object('accepted',true,'revision',next_revision,'sequence',next_sequence,'snapshot',next_snapshot);
end $$;

create or replace function public.get_court_judge_context(target_session_id uuid,requested_mode text,expected_revision bigint)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare actor uuid:=auth.uid(); s public.activity_sessions; cached public.court_judge_runs;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.activity_sessions where id=target_session_id and activity_type='court';
  if s.id is null or not public.is_room_member(s.room_id) then raise exception 'FORBIDDEN'; end if;
  if requested_mode not in ('reaction','verdict','soften') then raise exception 'INVALID_MODE'; end if;
  if s.revision<>expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  select * into cached from public.court_judge_runs where session_id=s.id and session_revision=s.revision and mode=requested_mode;
  return jsonb_build_object('sessionId',s.id,'revision',s.revision,'mode',requested_mode,'snapshot',s.snapshot,
    'cached',case when cached.id is null then null else jsonb_build_object('output',cached.output,'source',cached.source) end);
end $$;

create or replace function public.record_court_judge_result(target_session_id uuid,expected_revision bigint,requested_mode text,input_hash text,result_payload jsonb,result_source text,actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.activity_sessions; saved public.court_judge_runs; next_snapshot jsonb; next_sequence bigint; next_revision bigint; event_name text;
begin
  if auth.role()<>'service_role' then raise exception 'FORBIDDEN'; end if;
  if requested_mode not in ('reaction','verdict','soften') or result_source not in ('generated','fallback') then raise exception 'INVALID_RESULT'; end if;
  if pg_column_size(coalesce(result_payload,'{}'::jsonb))>16384 then raise exception 'PAYLOAD_TOO_LARGE'; end if;
  select * into s from public.activity_sessions where id=target_session_id and activity_type='court' for update;
  if s.id is null or not exists(select 1 from public.room_members where room_id=s.room_id and user_id=actor_id) then raise exception 'FORBIDDEN'; end if;
  select * into saved from public.court_judge_runs where session_id=s.id and session_revision=expected_revision and mode=requested_mode;
  if saved.id is not null then return jsonb_build_object('cached',true,'output',saved.output,'source',saved.source,'revision',s.revision); end if;
  if s.revision<>expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  insert into public.court_judge_runs(session_id,session_revision,mode,input_hash,output,source)
    values(s.id,s.revision,requested_mode,left(input_hash,128),result_payload,result_source) returning * into saved;
  next_snapshot:=coalesce(s.snapshot,'{}'::jsonb);
  if requested_mode='reaction' then
    event_name:='court_question_created';
    next_snapshot:=next_snapshot||jsonb_build_object('judgeReaction',result_payload,'stage','judge_question','deadlineAt',now()+interval '60 seconds');
  elsif requested_mode='soften' then
    event_name:='court_sentence_softened';
    next_snapshot:=jsonb_set(next_snapshot,'{verdict,playfulSentence}',to_jsonb(result_payload->>'playfulSentence'),true);
  else
    event_name:='court_verdict_created';
    next_snapshot:=next_snapshot||jsonb_build_object('verdict',result_payload,'stage','verdict','acceptedBy','[]'::jsonb,'deadlineAt',null);
  end if;
  next_sequence:=coalesce(s.last_event_sequence,0)+1; next_revision:=s.revision+1;
  insert into public.room_events(id,room_id,session_id,sender_id,event_type,payload,sequence,client_created_at,created_at)
    values(gen_random_uuid(),s.room_id,s.id,actor_id,event_name,result_payload,next_sequence,now(),now());
  update public.activity_sessions set snapshot=next_snapshot,last_event_sequence=next_sequence,revision=next_revision,
    current_phase=case when requested_mode='reaction' then 'play' else 'remember' end,updated_at=now() where id=s.id;
  return jsonb_build_object('cached',false,'output',result_payload,'source',result_source,'revision',next_revision,'snapshot',next_snapshot);
end $$;

revoke all on function public.submit_court_action(uuid,text,jsonb,bigint) from public,anon;
revoke all on function public.get_court_judge_context(uuid,text,bigint) from public,anon;
revoke all on function public.record_court_judge_result(uuid,bigint,text,text,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_court_action(uuid,text,jsonb,bigint),public.get_court_judge_context(uuid,text,bigint) to authenticated;
grant execute on function public.record_court_judge_result(uuid,bigint,text,text,jsonb,text,uuid) to service_role;

commit;

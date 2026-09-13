-- Truth or Dare v2: authoritative turns, deterministic bottle spins,
-- mutual spicy consent, reconnect-safe rounds, and private truth answers.
begin;

insert into public.activity_event_contracts(activity_type,event_name,max_payload_bytes) values
  ('dare','dare_deck_selected',2048),
  ('dare','dare_spicy_consent_set',1024),
  ('dare','dare_spin_requested',1024),
  ('dare','dare_spin_resolved',1024),
  ('dare','dare_type_selected',1024),
  ('dare','dare_prompt_drawn',2048),
  ('dare','dare_answer_locked',1024),
  ('dare','dare_answer_revealed',1024),
  ('dare','dare_challenge_completed',1024),
  ('dare','dare_challenge_confirmed',1024),
  ('dare','dare_prompt_rerolled',1024),
  ('dare','dare_prompt_passed',1024),
  ('dare','dare_partner_reacted',1024),
  ('dare','dare_round_completed',1024),
  ('dare','dare_next_round_started',1024),
  ('dare','dare_session_finished',1024),
  ('dare','dare_rematch_started',1024)
on conflict(activity_type,event_name) do update
set max_payload_bytes=excluded.max_payload_bytes;

create or replace function public.apply_dare_action(
  target_session_id uuid,
  action_id uuid,
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
  partner uuid;
  host_id uuid;
  participants uuid[];
  selected_player uuid;
  spin_seed bigint;
  spin_turns int;
  target_angle int;
  catalog_size int;
  prompt_index int;
  reroll_count int;
  consented jsonb;
  history jsonb;
  reaction text;
  existing_event public.room_events;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if action_id is null then raise exception 'ACTION_ID_REQUIRED'; end if;

  select * into s from public.activity_sessions where id=target_session_id for update;
  if s.id is null or s.activity_type<>'dare' then raise exception 'SESSION_UNAVAILABLE'; end if;
  if not public.is_room_member(s.room_id) then raise exception 'FORBIDDEN'; end if;

  select * into existing_event from public.room_events where id=action_id;
  if existing_event.id is not null then
    if existing_event.session_id<>s.id or existing_event.sender_id<>actor then raise exception 'ACTION_ID_CONFLICT'; end if;
    return jsonb_build_object('accepted',true,'duplicate',true,'revision',s.revision,
      'sequence',s.last_event_sequence,'snapshot',s.snapshot);
  end if;

  if s.status in ('completed','abandoned') and action_name<>'dare_rematch_started' then raise exception 'SESSION_CLOSED'; end if;
  if expected_revision is not null and s.revision<>expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  if not exists(select 1 from public.activity_event_contracts where activity_type='dare' and event_name=action_name) then raise exception 'INVALID_EVENT'; end if;
  if pg_column_size(coalesce(action_payload,'{}'::jsonb))>4096 then raise exception 'PAYLOAD_TOO_LARGE'; end if;
  if action_payload ?| array['answer','answerText','text','privateAnswer'] then raise exception 'PRIVATE_TEXT_NOT_ALLOWED'; end if;

  host_id:=s.host_user_id;
  select array_agg(rm.user_id order by case when rm.user_id=host_id then 0 else 1 end,rm.joined_at)
    into participants from public.room_members rm where rm.room_id=s.room_id and rm.left_at is null;
  if coalesce(array_length(participants,1),0)>2 then participants:=participants[1:2]; end if;
  select rm.user_id into partner from public.room_members rm
    where rm.room_id=s.room_id and rm.user_id<>actor and rm.left_at is null order by rm.joined_at limit 1;

  next_snapshot:=coalesce(s.snapshot,'{}'::jsonb);
  stage:=coalesce(next_snapshot->>'stage','welcome');
  next_stage:=stage;

  case action_name
    when 'dare_deck_selected' then
      if stage not in ('welcome','choose_deck','finished') then raise exception 'INVALID_TRANSITION'; end if;
      if coalesce(action_payload->>'deck','') not in ('playful','romantic','deep','chaotic','spicy') then raise exception 'INVALID_DECK'; end if;
      if action_payload->>'deck'='spicy' then
        consented:=jsonb_build_array(actor::text);
        next_snapshot:=jsonb_build_object('activityType','dare','schemaVersion',2,'status','active',
          'stage','choose_deck','requestedDeck','spicy','spicyConsentedBy',consented,'roundNumber',1,
          'roundId',gen_random_uuid(),'history','[]'::jsonb,'completedTruths',0,'completedDares',0,
          'rematchCount',coalesce((next_snapshot->>'rematchCount')::int,0),'completed',false);
        next_stage:='choose_deck';
      else
        next_snapshot:=jsonb_build_object('activityType','dare','schemaVersion',2,'status','active',
          'stage','ready_to_spin','selectedDeck',action_payload->>'deck','spicyConsentedBy','[]'::jsonb,
          'roundNumber',1,'roundId',gen_random_uuid(),'history','[]'::jsonb,'completedTruths',0,
          'completedDares',0,'rematchCount',coalesce((next_snapshot->>'rematchCount')::int,0),
          'completed',false);
        next_stage:='ready_to_spin';
      end if;

    when 'dare_spicy_consent_set' then
      if stage<>'choose_deck' or next_snapshot->>'requestedDeck'<>'spicy' then raise exception 'INVALID_TRANSITION'; end if;
      consented:=coalesce(next_snapshot->'spicyConsentedBy','[]'::jsonb);
      if coalesce((action_payload->>'accepted')::boolean,false) then
        if not (consented @> jsonb_build_array(actor::text)) then consented:=consented||jsonb_build_array(actor::text); end if;
        next_snapshot:=jsonb_set(next_snapshot,'{spicyConsentedBy}',consented,true);
        if jsonb_array_length(consented)>=2 then
          next_snapshot:=(next_snapshot-'requestedDeck')||jsonb_build_object('selectedDeck','spicy','stage','ready_to_spin');
          next_stage:='ready_to_spin';
        end if;
      else
        next_snapshot:=(next_snapshot-'requestedDeck')||jsonb_build_object('stage','choose_deck','spicyConsentedBy','[]'::jsonb);
      end if;

    when 'dare_spin_requested' then
      if stage<>'ready_to_spin' then raise exception 'INVALID_TRANSITION'; end if;
      if coalesce(array_length(participants,1),0)<2 then raise exception 'PARTNER_REQUIRED'; end if;
      spin_seed:=floor(random()*2147483646)::bigint+1;
      selected_player:=participants[1+(spin_seed%2)::int];
      spin_turns:=4+(spin_seed%3)::int;
      target_angle:=case when selected_player=participants[1] then 0 else 180 end;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','spinning','bottleSpin',jsonb_build_object(
        'spinId',action_id,'roundId',next_snapshot->>'roundId','initiatorId',actor,'seed',spin_seed,
        'selectedPlayerId',selected_player,'startedAt',now(),'settlesAt',now()+interval '4.2 seconds',
        'finalRotationDegrees',spin_turns*360+target_angle));
      next_stage:='spinning';

    when 'dare_spin_resolved' then
      if stage<>'spinning' then raise exception 'INVALID_TRANSITION'; end if;
      selected_player:=(next_snapshot#>>'{bottleSpin,selectedPlayerId}')::uuid;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','choose_truth_or_dare','activePlayerId',selected_player);
      next_stage:='choose_truth_or_dare';

    when 'dare_type_selected' then
      if stage<>'choose_truth_or_dare' or actor<>(next_snapshot->>'activePlayerId')::uuid then raise exception 'NOT_YOUR_TURN'; end if;
      if action_payload->>'type' not in ('truth','dare') then raise exception 'INVALID_TYPE'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','prompt_reveal','promptType',action_payload->>'type',
        'prompt',null,'rerollCount',0,'answerLocked',false,'challengeCompleted',false,'reaction',null);
      next_stage:='prompt_reveal';

    when 'dare_prompt_drawn' then
      if stage<>'prompt_reveal' or actor<>(next_snapshot->>'activePlayerId')::uuid then raise exception 'NOT_YOUR_TURN'; end if;
      catalog_size:=coalesce((action_payload->>'catalogSize')::int,0);
      if catalog_size<1 or catalog_size>200 then raise exception 'INVALID_CATALOG'; end if;
      spin_seed:=coalesce((next_snapshot#>>'{bottleSpin,seed}')::bigint,1);
      reroll_count:=coalesce((next_snapshot->>'rerollCount')::int,0);
      prompt_index:=((spin_seed+coalesce((next_snapshot->>'roundNumber')::int,1)*17+reroll_count*31)%catalog_size)::int;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','answering','prompt',jsonb_build_object(
        'index',prompt_index,'catalogSize',catalog_size,'catalogVersion',left(coalesce(action_payload->>'catalogVersion','v1'),32),
        'id',concat(next_snapshot->>'selectedDeck',':',next_snapshot->>'promptType',':',prompt_index)));
      next_stage:='answering';

    when 'dare_answer_locked' then
      if stage<>'answering' or next_snapshot->>'promptType'<>'truth' or actor<>(next_snapshot->>'activePlayerId')::uuid then raise exception 'NOT_YOUR_TURN'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('answerLocked',true);

    when 'dare_answer_revealed' then
      if stage<>'answering' or next_snapshot->>'promptType'<>'truth' or actor<>(next_snapshot->>'activePlayerId')::uuid or not coalesce((next_snapshot->>'answerLocked')::boolean,false) then raise exception 'INVALID_TRANSITION'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','partner_reaction','answerRevealed',true);
      next_stage:='partner_reaction';

    when 'dare_challenge_completed' then
      if stage<>'answering' or next_snapshot->>'promptType'<>'dare' or actor<>(next_snapshot->>'activePlayerId')::uuid then raise exception 'NOT_YOUR_TURN'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','partner_reaction','challengeCompleted',true);
      next_stage:='partner_reaction';

    when 'dare_partner_reacted' then
      if stage<>'partner_reaction' or actor=(next_snapshot->>'activePlayerId')::uuid then raise exception 'PARTNER_REQUIRED'; end if;
      reaction:=coalesce(action_payload->>'reaction','');
      if reaction not in ('loved_it','made_me_blush','too_funny','well_played') then raise exception 'INVALID_REACTION'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('reaction',reaction);

    when 'dare_challenge_confirmed','dare_round_completed' then
      if stage<>'partner_reaction' or actor=(next_snapshot->>'activePlayerId')::uuid then raise exception 'PARTNER_REQUIRED'; end if;
      history:=coalesce(next_snapshot->'history','[]'::jsonb)||jsonb_build_array(jsonb_build_object(
        'roundNumber',next_snapshot->>'roundNumber','roundId',next_snapshot->>'roundId',
        'selectedPlayerId',next_snapshot->>'activePlayerId','type',next_snapshot->>'promptType',
        'promptId',next_snapshot#>>'{prompt,id}','reaction',next_snapshot->>'reaction','passed',false));
      if jsonb_array_length(history)>12 then history:=jsonb_path_query_array(history,'$[last - 11 to last]'); end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','round_complete','history',history,
        'completedTruths',coalesce((next_snapshot->>'completedTruths')::int,0)+case when next_snapshot->>'promptType'='truth' then 1 else 0 end,
        'completedDares',coalesce((next_snapshot->>'completedDares')::int,0)+case when next_snapshot->>'promptType'='dare' then 1 else 0 end);
      next_stage:='round_complete';

    when 'dare_prompt_rerolled' then
      if stage<>'answering' or actor<>(next_snapshot->>'activePlayerId')::uuid then raise exception 'NOT_YOUR_TURN'; end if;
      if coalesce((next_snapshot->>'rerollCount')::int,0)>=1 then raise exception 'REROLL_ALREADY_USED'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','prompt_reveal','prompt',null,'rerollCount',1,'answerLocked',false);
      next_stage:='prompt_reveal';

    when 'dare_prompt_passed' then
      if stage not in ('prompt_reveal','answering') or actor<>(next_snapshot->>'activePlayerId')::uuid then raise exception 'NOT_YOUR_TURN'; end if;
      history:=coalesce(next_snapshot->'history','[]'::jsonb)||jsonb_build_array(jsonb_build_object(
        'roundNumber',next_snapshot->>'roundNumber','roundId',next_snapshot->>'roundId',
        'selectedPlayerId',next_snapshot->>'activePlayerId','type',next_snapshot->>'promptType',
        'promptId',next_snapshot#>>'{prompt,id}','passed',true));
      next_snapshot:=next_snapshot||jsonb_build_object('stage','round_complete','history',history);
      next_stage:='round_complete';

    when 'dare_next_round_started' then
      if stage<>'round_complete' then raise exception 'INVALID_TRANSITION'; end if;
      next_snapshot:=(next_snapshot-'bottleSpin'-'activePlayerId'-'promptType'-'prompt'-'reaction'-'answerLocked'-'answerRevealed'-'challengeCompleted')
        ||jsonb_build_object('stage','ready_to_spin','roundNumber',coalesce((next_snapshot->>'roundNumber')::int,1)+1,
          'roundId',gen_random_uuid());
      next_stage:='ready_to_spin';

    when 'dare_session_finished' then
      if stage not in ('ready_to_spin','round_complete') then raise exception 'INVALID_TRANSITION'; end if;
      next_snapshot:=next_snapshot||jsonb_build_object('stage','finished','status','completed','completed',true);
      next_stage:='finished';

    when 'dare_rematch_started' then
      if stage<>'finished' then raise exception 'INVALID_TRANSITION'; end if;
      next_snapshot:=jsonb_build_object('activityType','dare','schemaVersion',2,'status','active','stage','choose_deck',
        'roundNumber',1,'roundId',gen_random_uuid(),'history','[]'::jsonb,'completedTruths',0,'completedDares',0,
        'rematchCount',coalesce((next_snapshot->>'rematchCount')::int,0)+1,'completed',false);
      next_stage:='choose_deck';

    else raise exception 'INVALID_EVENT';
  end case;

  next_sequence:=coalesce(s.last_event_sequence,0)+1;
  next_revision:=coalesce(s.revision,0)+1;
  insert into public.room_events(id,room_id,session_id,sender_id,event_type,payload,sequence,client_created_at,created_at)
    values(action_id,s.room_id,s.id,actor,action_name,coalesce(action_payload,'{}'::jsonb),next_sequence,now(),now());
  update public.activity_sessions set snapshot=next_snapshot,last_event_sequence=next_sequence,revision=next_revision,
    current_phase=case when next_stage in ('welcome','choose_deck','ready_to_spin') then 'ready'
      when next_stage in ('round_complete','finished') then 'remember' else 'play' end,
    status=case when next_stage='finished' then 'completed' else 'active' end,updated_at=now()
    where id=s.id;
  return jsonb_build_object('accepted',true,'duplicate',false,'revision',next_revision,
    'sequence',next_sequence,'snapshot',next_snapshot);
end $$;

revoke all on function public.apply_dare_action(uuid,uuid,text,jsonb,bigint) from public,anon;
grant execute on function public.apply_dare_action(uuid,uuid,text,jsonb,bigint) to authenticated;

commit;

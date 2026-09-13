-- A Truth or Dare round has one selected answerer, unlike activities where
-- both partners lock an answer. Keep the truth private until that player reveals it.
begin;

create table if not exists public.dare_private_truths (
  session_id uuid not null references public.activity_sessions(id) on delete cascade,
  round_id uuid not null,
  answerer_id uuid not null references auth.users(id) on delete cascade,
  answer_payload jsonb not null check(pg_column_size(answer_payload)<=4096),
  locked_at timestamptz not null default now(),
  revealed_at timestamptz,
  primary key(session_id,round_id)
);
alter table public.dare_private_truths enable row level security;
revoke all on public.dare_private_truths from public,anon,authenticated;
grant select,insert,update,delete on public.dare_private_truths to service_role;

create or replace function public.lock_dare_truth_answer(target_session_id uuid,answer_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); s public.activity_sessions; round_id uuid;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.activity_sessions where id=target_session_id and activity_type='dare' for update;
  if s.id is null or not public.is_room_member(s.room_id) then raise exception 'FORBIDDEN'; end if;
  if s.snapshot->>'stage'<>'answering' or s.snapshot->>'promptType'<>'truth'
    or (s.snapshot->>'activePlayerId')::uuid<>actor then raise exception 'NOT_YOUR_TURN'; end if;
  if pg_column_size(coalesce(answer_payload,'{}'::jsonb))>4096
    or char_length(trim(coalesce(answer_payload->>'answer',''))) not between 1 and 280 then raise exception 'INVALID_ANSWER'; end if;
  round_id:=(s.snapshot->>'roundId')::uuid;
  if exists(select 1 from public.dare_private_truths where session_id=s.id and round_id=round_id) then raise exception 'ANSWER_ALREADY_LOCKED'; end if;
  insert into public.dare_private_truths(session_id,round_id,answerer_id,answer_payload)
    values(s.id,round_id,actor,answer_payload);
  return jsonb_build_object('locked',true,'roundId',round_id);
end $$;

create or replace function public.reveal_dare_truth_answer(target_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); s public.activity_sessions; saved public.dare_private_truths;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.activity_sessions where id=target_session_id and activity_type='dare';
  if s.id is null or not public.is_room_member(s.room_id) then raise exception 'FORBIDDEN'; end if;
  if not coalesce((s.snapshot->>'answerLocked')::boolean,false) then raise exception 'REVEAL_NOT_READY'; end if;
  select * into saved from public.dare_private_truths where session_id=s.id and round_id=(s.snapshot->>'roundId')::uuid;
  if saved.session_id is null then raise exception 'ANSWER_UNAVAILABLE'; end if;
  update public.dare_private_truths set revealed_at=coalesce(revealed_at,now()) where session_id=saved.session_id and round_id=saved.round_id;
  return jsonb_build_object('roundId',saved.round_id,'answererId',saved.answerer_id,'answer',saved.answer_payload,'revealedAt',coalesce(saved.revealed_at,now()));
end $$;

revoke all on function public.lock_dare_truth_answer(uuid,jsonb),public.reveal_dare_truth_answer(uuid) from public,anon;
grant execute on function public.lock_dare_truth_answer(uuid,jsonb),public.reveal_dare_truth_answer(uuid) to authenticated;

commit;

-- ============================================================================
-- Dearly Us — Core Activities Revamp Database Schema & Authoritative Contracts
-- Migration: 20260910000000_activities_revamp_core.sql
-- ============================================================================

-- 1. Couple Spaces Table
CREATE TABLE IF NOT EXISTS public.couple_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_b_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'archived')),
  anniversary_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Date Rooms Table
CREATE TABLE IF NOT EXISTS public.date_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed', 'expired')),
  active_activity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- 3. Activity Sessions Table
CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.date_rooms(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting', 'active', 'locked', 'revealed', 'paused', 'completed', 'expired')),
  round_number INT NOT NULL DEFAULT 0,
  revision INT NOT NULL DEFAULT 0,
  last_sequence INT NOT NULL DEFAULT 0,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. Room Events Table (Sequential Event Stream)
CREATE TABLE IF NOT EXISTS public.room_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.activity_sessions(id) ON DELETE CASCADE,
  sequence INT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_room_events_session_sequence UNIQUE (session_id, sequence)
);

-- 5. Private Answers Table (Zero-Leak Answer Vault)
CREATE TABLE IF NOT EXISTS public.private_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.activity_sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_payload JSONB NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at TIMESTAMPTZ,
  CONSTRAINT uq_private_answers_session_round_user UNIQUE (session_id, round_number, user_id)
);

-- 6. Keepsakes Table (Memories & Artifacts)
CREATE TABLE IF NOT EXISTS public.keepsakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('activity', 'photo', 'note', 'milestone')),
  title TEXT NOT NULL,
  caption TEXT,
  media_url TEXT,
  activity_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Plans and Milestones Table
CREATE TABLE IF NOT EXISTS public.plans_and_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g. 'future', 'timezone', 'bucket', 'date_planner'
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'someday' CHECK (status IN ('someday', 'exploring', 'planning', 'done', 'favourite', 'archived')),
  target_date DATE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Temporary Assets Table (Private photos, audio clips with TTL)
CREATE TABLE IF NOT EXISTS public.temporary_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Row Level Security (RLS) Configuration
-- ============================================================================

ALTER TABLE public.couple_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keepsakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans_and_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_assets ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check couple space membership
CREATE OR REPLACE FUNCTION public.is_couple_member(space_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_spaces
    WHERE id = space_id
      AND (partner_a_id = user_id OR partner_b_id = user_id)
  );
$$;

-- Helper Function: Check session belongs to user's couple
CREATE OR REPLACE FUNCTION public.is_session_couple_member(target_session_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.activity_sessions s
    JOIN public.date_rooms r ON r.id = s.room_id
    JOIN public.couple_spaces c ON c.id = r.couple_id
    WHERE s.id = target_session_id
      AND (c.partner_a_id = user_id OR c.partner_b_id = user_id)
  );
$$;

-- RLS: couple_spaces
CREATE POLICY couple_spaces_members_read ON public.couple_spaces
  FOR SELECT TO authenticated
  USING (partner_a_id = auth.uid() OR partner_b_id = auth.uid());

CREATE POLICY couple_spaces_partner_update ON public.couple_spaces
  FOR UPDATE TO authenticated
  USING (partner_a_id = auth.uid() OR partner_b_id = auth.uid());

-- RLS: date_rooms
CREATE POLICY date_rooms_couple_access ON public.date_rooms
  FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()));

-- RLS: activity_sessions
CREATE POLICY activity_sessions_access ON public.activity_sessions
  FOR ALL TO authenticated
  USING (public.is_session_couple_member(id, auth.uid()));

-- RLS: room_events
CREATE POLICY room_events_read ON public.room_events
  FOR SELECT TO authenticated
  USING (public.is_session_couple_member(session_id, auth.uid()));

-- room_events: direct inserts are prohibited, must use append_activity_event RPC
CREATE POLICY room_events_insert_denial ON public.room_events
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- RLS: private_answers (Zero-Leak Answer Vault)
CREATE POLICY private_answers_select ON public.private_answers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (revealed_at IS NOT NULL AND public.is_session_couple_member(session_id, auth.uid()))
  );

-- private_answers: direct inserts prohibited, must use lock_private_answer RPC
CREATE POLICY private_answers_insert_denial ON public.private_answers
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- RLS: keepsakes
CREATE POLICY keepsakes_access ON public.keepsakes
  FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()));

-- RLS: plans_and_milestones
CREATE POLICY plans_and_milestones_access ON public.plans_and_milestones
  FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()));

-- RLS: temporary_assets
CREATE POLICY temporary_assets_access ON public.temporary_assets
  FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()));

-- ============================================================================
-- Authoritative RPC Functions (SECURITY DEFINER)
-- ============================================================================

-- 1. append_activity_event
CREATE OR REPLACE FUNCTION public.append_activity_event(
  target_session_id UUID,
  event_id UUID,
  event_name TEXT,
  event_payload JSONB DEFAULT '{}'::jsonb,
  expected_revision INT DEFAULT NULL,
  client_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_next_sequence INT;
  v_next_revision INT;
BEGIN
  -- Validate caller membership
  IF NOT public.is_session_couple_member(target_session_id, auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller is not a member of this date session';
  END IF;

  -- Lock session for atomic sequence and revision increment
  SELECT id, status, revision, last_sequence
  INTO v_session
  FROM public.activity_sessions
  WHERE id = target_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_UNAVAILABLE: Session % not found', target_session_id;
  END IF;

  IF v_session.status IN ('completed', 'expired') THEN
    RAISE EXCEPTION 'SESSION_CLOSED: Session % is already %', target_session_id, v_session.status;
  END IF;

  IF expected_revision IS NOT NULL AND expected_revision <> v_session.revision THEN
    RETURN jsonb_build_object(
      'accepted', false,
      'reason', 'REVISION_CONFLICT',
      'current_revision', v_session.revision
    );
  END IF;

  -- Check if event_id already appended (idempotency)
  IF EXISTS (SELECT 1 FROM public.room_events WHERE id = event_id) THEN
    RETURN jsonb_build_object(
      'accepted', true,
      'duplicate', true,
      'revision', v_session.revision,
      'sequence', v_session.last_sequence
    );
  END IF;

  v_next_sequence := v_session.last_sequence + 1;
  v_next_revision := v_session.revision + 1;

  INSERT INTO public.room_events (
    id, session_id, sequence, schema_version, sender_id, event_name, event_payload, client_time
  ) VALUES (
    event_id, target_session_id, v_next_sequence, 1, auth.uid(), event_name, event_payload, COALESCE(client_time, now())
  );

  UPDATE public.activity_sessions
  SET last_sequence = v_next_sequence,
      revision = v_next_revision
  WHERE id = target_session_id;

  RETURN jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'revision', v_next_revision,
    'sequence', v_next_sequence
  );
END;
$$;

-- 2. lock_private_answer
CREATE OR REPLACE FUNCTION public.lock_private_answer(
  target_session_id UUID,
  target_round INT,
  answer_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_count INT;
BEGIN
  IF NOT public.is_session_couple_member(target_session_id, auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller is not a member of this date session';
  END IF;

  INSERT INTO public.private_answers (
    session_id, round_number, user_id, answer_payload, locked_at
  ) VALUES (
    target_session_id, target_round, auth.uid(), answer_payload, now()
  )
  ON CONFLICT (session_id, round_number, user_id)
  DO UPDATE SET answer_payload = EXCLUDED.answer_payload, locked_at = now();

  SELECT count(*)
  INTO v_locked_count
  FROM public.private_answers
  WHERE session_id = target_session_id
    AND round_number = target_round;

  RETURN jsonb_build_object(
    'locked', true,
    'bothLocked', (v_locked_count >= 2),
    'lockedCount', v_locked_count
  );
END;
$$;

-- 3. reveal_private_answers
CREATE OR REPLACE FUNCTION public.reveal_private_answers(
  target_session_id UUID,
  target_round INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_count INT;
  v_answers JSONB;
BEGIN
  IF NOT public.is_session_couple_member(target_session_id, auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller is not a member of this date session';
  END IF;

  SELECT count(*)
  INTO v_locked_count
  FROM public.private_answers
  WHERE session_id = target_session_id
    AND round_number = target_round;

  -- Mark revealed
  UPDATE public.private_answers
  SET revealed_at = now()
  WHERE session_id = target_session_id
    AND round_number = target_round
    AND revealed_at IS NULL;

  SELECT jsonb_agg(
    jsonb_build_object(
      'userId', user_id,
      'answer', answer_payload,
      'lockedAt', locked_at
    )
  )
  INTO v_answers
  FROM public.private_answers
  WHERE session_id = target_session_id
    AND round_number = target_round;

  RETURN jsonb_build_object(
    'roundNumber', target_round,
    'answers', COALESCE(v_answers, '[]'::jsonb)
  );
END;
$$;

-- 4. get_session_recovery
CREATE OR REPLACE FUNCTION public.get_session_recovery(
  target_session_id UUID,
  after_sequence INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_events JSONB;
BEGIN
  IF NOT public.is_session_couple_member(target_session_id, auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller is not a member of this date session';
  END IF;

  SELECT id, activity_type, schema_version, status, round_number, revision, last_sequence, snapshot, result_summary
  INTO v_session
  FROM public.activity_sessions
  WHERE id = target_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_UNAVAILABLE: Session % not found', target_session_id;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'sequence', sequence,
      'schemaVersion', schema_version,
      'senderId', sender_id,
      'type', event_name,
      'payload', event_payload,
      'clientCreatedAt', client_time,
      'createdAt', created_at
    ) ORDER BY sequence ASC
  )
  INTO v_events
  FROM public.room_events
  WHERE session_id = target_session_id
    AND sequence > after_sequence;

  RETURN jsonb_build_object(
    'sessionId', v_session.id,
    'activityType', v_session.activity_type,
    'schemaVersion', v_session.schema_version,
    'status', v_session.status,
    'roundNumber', v_session.round_number,
    'revision', v_session.revision,
    'lastSequence', v_session.last_sequence,
    'snapshot', v_session.snapshot,
    'resultSummary', v_session.result_summary,
    'events', COALESCE(v_events, '[]'::jsonb)
  );
END;
$$;

-- 5. complete_activity
CREATE OR REPLACE FUNCTION public.complete_activity(
  target_session_id UUID,
  result_snapshot JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_session_couple_member(target_session_id, auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller is not a member of this date session';
  END IF;

  UPDATE public.activity_sessions
  SET status = 'completed',
      snapshot = snapshot || result_snapshot,
      result_summary = result_snapshot,
      completed_at = now()
  WHERE id = target_session_id;

  RETURN jsonb_build_object('completed', true);
END;
$$;

-- 6. set_activity_paused
CREATE OR REPLACE FUNCTION public.set_activity_paused(
  target_session_id UUID,
  is_paused BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_session_couple_member(target_session_id, auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller is not a member of this date session';
  END IF;

  UPDATE public.activity_sessions
  SET status = CASE WHEN is_paused THEN 'paused' ELSE 'active' END
  WHERE id = target_session_id;

  RETURN public.get_session_recovery(target_session_id, 0);
END;
$$;

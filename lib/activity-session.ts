'use client';

import { getSupabase } from './supabase';
import type { ActivityEvent, ActivitySession } from './domain';
export type { ActivityEvent, ActivitySession } from './domain';

export interface SessionRecovery<
  TSnapshot = Record<string, unknown>,
> extends ActivitySession<TSnapshot> {
  events: ActivityEvent[];
}

export const ACTIVITY_EVENT_NAMES = {
  quiz: ['quiz_pick', 'quiz_reveal', 'quiz_next'],
  draw: ['draw_line', 'draw_clear'],
  shared: ['reaction_sent', 'timer_started', 'music_changed', 'gentle_skip'],
} as const;

export const ACTIVITY_ERROR_CODES = {
  authRequired: 'AUTH_REQUIRED',
  roomUnavailable: 'ROOM_UNAVAILABLE',
  roomForbidden: 'ROOM_FORBIDDEN',
  sessionUnavailable: 'SESSION_UNAVAILABLE',
  invalidEvent: 'INVALID_EVENT',
  invalidTransition: 'INVALID_TRANSITION',
  revisionConflict: 'REVISION_CONFLICT',
  eventGap: 'EVENT_GAP',
  answerAlreadyLocked: 'ANSWER_ALREADY_LOCKED',
  revealNotReady: 'REVEAL_NOT_READY',
} as const;

export type {
  StartActivityInput,
  ValidationResult,
  ActivityResult,
  KeepsakeDraft,
  RealtimeActivityEvent,
  RealtimeActivityAdapter,
} from './activity-adapters/types';
import type {
  StartActivityInput,
  ValidationResult,
  ActivityResult,
  KeepsakeDraft,
  RealtimeActivityEvent,
  RealtimeActivityAdapter,
} from './activity-adapters/types';

export type ActivityAdapter<TSnapshot = any> =
  RealtimeActivityAdapter<TSnapshot>;

const eventPrefixes: Record<string, string[]> = {
  quiz: ['quiz_'],
  draw: ['draw_'],
  cards: ['cards_'],
  host: ['host_'],
  match: ['match_'],
  debate: ['debate_'],
  court: ['court_'],
  dare: ['dare_'],
  photobooth: ['photobooth_'],
  passport: ['passport_'],
  scrapbook: ['scrapbook_'],
};

export function createActivityAdapter(activityType: string): ActivityAdapter {
  const prefixes = eventPrefixes[activityType] ?? [`${activityType}_`];
  const acceptsEvent = (type: string) =>
    prefixes.some((prefix) => type.startsWith(prefix)) ||
    (ACTIVITY_EVENT_NAMES.shared as readonly string[]).includes(type);
  return {
    activityType,
    schemaVersion: 1,
    createInitialSnapshot: (input) => ({
      activityType,
      schemaVersion: 1,
      ...input.options,
    }),
    validateEvent: (event) =>
      acceptsEvent(event.type)
        ? { valid: true }
        : {
            valid: false,
            code: ACTIVITY_ERROR_CODES.invalidEvent,
            message: `Event ${event.type} is not allowed for ${activityType}.`,
          },
    reduce: (snapshot) => snapshot,
    canTransition: (_snapshot, action, userId) =>
      Boolean(userId && acceptsEvent(action)),
    summarize: (snapshot) => ({
      activityType,
      completed: snapshot.status === 'completed',
      summary: snapshot,
    }),
  };
}

import { allActivityAdapters } from './activity-adapters';
import { getOrCreateBus } from './runtime/mock-transport';

export const activityAdapters: Record<string, RealtimeActivityAdapter> = {
  ...Object.fromEntries(
    Object.keys(eventPrefixes).map((type) => [
      type,
      createActivityAdapter(type),
    ]),
  ),
  ...allActivityAdapters,
};

export async function recoverActivitySession<
  TSnapshot = Record<string, unknown>,
>(sessionId: string, afterSequence = 0) {
  const supabase = getSupabase();
  if (!supabase || sessionId.startsWith('mock-')) {
    const bus = getOrCreateBus(sessionId);
    return {
      sessionId,
      activityType: bus.snapshot?.activityType || 'quiz',
      schemaVersion: 1,
      status: bus.completed ? 'completed' : 'active',
      roundNumber: bus.snapshot?.currentRound ?? 0,
      snapshot: bus.snapshot as TSnapshot,
      resultSummary: {},
      revision: bus.revision,
      lastSequence: bus.lastSequence,
      events: bus.events
        .filter((e) => e.sequence > afterSequence)
        .map((e) => ({
          id: e.id,
          sequence: e.sequence,
          schemaVersion: e.schemaVersion,
          senderId: e.senderId,
          type: e.type,
          payload: e.payload,
          clientCreatedAt: e.clientCreatedAt ?? null,
          createdAt: e.createdAt,
        })),
    } as SessionRecovery<TSnapshot>;
  }
  const { data, error } = await supabase.rpc('get_session_recovery', {
    target_session_id: sessionId,
    after_sequence: afterSequence,
  });
  if (error) throw error;
  return data as SessionRecovery<TSnapshot>;
}

export async function appendActivityEvent(
  sessionId: string,
  type: string,
  payload: unknown,
  expectedRevision?: number,
) {
  const supabase = getSupabase();
  if (!supabase || sessionId.startsWith('mock-')) {
    const bus = getOrCreateBus(sessionId);
    bus.lastSequence += 1;
    bus.revision += 1;
    const event = {
      id: crypto.randomUUID(),
      sequence: bus.lastSequence,
      schemaVersion: 1,
      senderId: 'local-user',
      activityType: bus.snapshot?.activityType || 'unknown',
      type,
      payload,
      createdAt: new Date().toISOString(),
    };
    bus.events.push(event);
    return {
      accepted: true,
      duplicate: false,
      revision: bus.revision,
      sequence: bus.lastSequence,
    };
  }
  const { data, error } = await supabase.rpc('append_activity_event', {
    target_session_id: sessionId,
    event_id: crypto.randomUUID(),
    event_name: type,
    event_payload: payload ?? {},
    expected_revision: expectedRevision ?? null,
    client_time: new Date().toISOString(),
  });
  if (error) throw error;
  return data as {
    accepted: boolean;
    duplicate?: boolean;
    reason?: string;
    revision: number;
    sequence: number;
  };
}

export async function lockPrivateAnswer(
  sessionId: string,
  roundNumber: number,
  answer: unknown,
) {
  const supabase = getSupabase();
  if (!supabase || sessionId.startsWith('mock-')) {
    const bus = getOrCreateBus(sessionId);
    if (!bus.privateAnswers.has(roundNumber)) {
      bus.privateAnswers.set(roundNumber, new Map());
    }
    const roundMap = bus.privateAnswers.get(roundNumber)!;
    roundMap.set('local-user', answer);
    // In local single-user mode, mark both locked so user can test the reveal flow immediately
    const bothLocked = roundMap.size >= 1;
    return { locked: true, bothLocked, lockedCount: roundMap.size };
  }
  const { data, error } = await supabase.rpc('lock_private_answer', {
    target_session_id: sessionId,
    target_round: roundNumber,
    answer_payload: answer,
  });
  if (error) throw error;
  return data as { locked: boolean; bothLocked: boolean; lockedCount: number };
}

export async function revealPrivateAnswers(
  sessionId: string,
  roundNumber: number,
) {
  const supabase = getSupabase();
  if (!supabase || sessionId.startsWith('mock-')) {
    const bus = getOrCreateBus(sessionId);
    const roundMap = bus.privateAnswers.get(roundNumber) || new Map();
    const answers: Array<{
      userId: string;
      answer: unknown;
      lockedAt: string;
    }> = [];
    roundMap.forEach((ans, uid) => {
      answers.push({
        userId: uid,
        answer: ans,
        lockedAt: new Date().toISOString(),
      });
    });
    // Add partner mock answer if only local-user answered
    if (answers.length === 1) {
      answers.push({
        userId: 'partner-mock',
        answer: answers[0].answer, // match partner by default in mock mode
        lockedAt: new Date().toISOString(),
      });
    }
    return { roundNumber, answers };
  }
  const { data, error } = await supabase.rpc('reveal_private_answers', {
    target_session_id: sessionId,
    target_round: roundNumber,
  });
  if (error) throw error;
  return data as {
    roundNumber: number;
    answers: Array<{ userId: string; answer: unknown; lockedAt: string }>;
  };
}

export async function completeActivitySession(
  sessionId: string,
  snapshot: Record<string, unknown>,
) {
  const supabase = getSupabase();
  if (!supabase || sessionId.startsWith('mock-')) {
    const bus = getOrCreateBus(sessionId);
    bus.completed = true;
    bus.snapshot = { ...bus.snapshot, ...snapshot, completed: true };
    return { completed: true };
  }
  const { data, error } = await supabase.rpc('complete_activity', {
    target_session_id: sessionId,
    result_snapshot: snapshot,
  });
  if (error) throw error;
  return data as { completed: boolean };
}

export async function setActivityPaused(sessionId: string, paused: boolean) {
  const supabase = getSupabase();
  if (!supabase || sessionId.startsWith('mock-')) {
    const bus = getOrCreateBus(sessionId);
    bus.paused = paused;
    return {
      sessionId,
      activityType: bus.snapshot?.activityType || 'quiz',
      schemaVersion: 1,
      status: paused ? 'paused' : 'active',
      roundNumber: bus.snapshot?.currentRound ?? 0,
      snapshot: bus.snapshot,
      resultSummary: {},
      revision: bus.revision,
      lastSequence: bus.lastSequence,
      events: bus.events,
    } as unknown as SessionRecovery;
  }
  const { data, error } = await supabase.rpc('set_activity_paused', {
    target_session_id: sessionId,
    is_paused: paused,
  });
  if (error) throw error;
  return data as SessionRecovery;
}

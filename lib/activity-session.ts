'use client';

import { getSupabase } from './supabase';
import type { ActivityEvent, ActivitySession } from './domain';
export type { ActivityEvent, ActivitySession } from './domain';

export interface SessionRecovery<TSnapshot = Record<string, unknown>> extends ActivitySession<TSnapshot> {
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

export type ActivityAdapter<TSnapshot = any> = RealtimeActivityAdapter<TSnapshot>;

const eventPrefixes: Record<string, string[]> = {
  quiz: ['quiz_'], draw: ['draw_'], cards: ['cards_'], host: ['host_'], match: ['match_'],
  debate: ['debate_'], court: ['court_'], dare: ['dare_'], photobooth: ['photobooth_'],
  passport: ['passport_'], scrapbook: ['scrapbook_'],
};

export function createActivityAdapter(activityType: string): ActivityAdapter {
  const prefixes = eventPrefixes[activityType] ?? [`${activityType}_`];
  const acceptsEvent = (type: string) => prefixes.some((prefix) => type.startsWith(prefix)) || (ACTIVITY_EVENT_NAMES.shared as readonly string[]).includes(type);
  return {
    activityType,
    schemaVersion: 1,
    createInitialSnapshot: (input) => ({ activityType, schemaVersion: 1, ...input.options }),
    validateEvent: (event) => acceptsEvent(event.type)
      ? { valid: true }
      : { valid: false, code: ACTIVITY_ERROR_CODES.invalidEvent, message: `Event ${event.type} is not allowed for ${activityType}.` },
    reduce: (snapshot) => snapshot,
    canTransition: (_snapshot, action, userId) => Boolean(userId && acceptsEvent(action)),
    summarize: (snapshot) => ({ activityType, completed: snapshot.status === 'completed', summary: snapshot }),
  };
}

import { allActivityAdapters } from './activity-adapters';

export const activityAdapters: Record<string, RealtimeActivityAdapter> = {
  ...Object.fromEntries(Object.keys(eventPrefixes).map((type) => [type, createActivityAdapter(type)])),
  ...allActivityAdapters,
};

export async function recoverActivitySession<TSnapshot extends Record<string, unknown>>(sessionId: string, afterSequence = 0) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('get_session_recovery', { target_session_id: sessionId, after_sequence: afterSequence });
  if (error) throw error;
  return data as SessionRecovery<TSnapshot>;
}

export async function appendActivityEvent(sessionId: string, type: string, payload: unknown, expectedRevision?: number) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('append_activity_event', {
    target_session_id: sessionId,
    event_id: crypto.randomUUID(),
    event_name: type,
    event_payload: payload ?? {},
    expected_revision: expectedRevision ?? null,
    client_time: new Date().toISOString(),
  });
  if (error) throw error;
  return data as { accepted: boolean; duplicate?: boolean; reason?: string; revision: number; sequence: number };
}

export async function lockPrivateAnswer(sessionId: string, roundNumber: number, answer: unknown) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('lock_private_answer', {
    target_session_id: sessionId,
    target_round: roundNumber,
    answer_payload: answer,
  });
  if (error) throw error;
  return data as { locked: boolean; bothLocked: boolean; lockedCount: number };
}

export async function revealPrivateAnswers(sessionId: string, roundNumber: number) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('reveal_private_answers', { target_session_id: sessionId, target_round: roundNumber });
  if (error) throw error;
  return data as { roundNumber: number; answers: Array<{ userId: string; answer: unknown; lockedAt: string }> };
}

export async function completeActivitySession(sessionId: string, snapshot: Record<string, unknown>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('complete_activity', { target_session_id: sessionId, result_snapshot: snapshot });
  if (error) throw error;
  return data as { completed: boolean };
}

export async function setActivityPaused(sessionId: string, paused: boolean) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('set_activity_paused', {
    target_session_id: sessionId,
    is_paused: paused,
  });
  if (error) throw error;
  return data as SessionRecovery;
}

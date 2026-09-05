'use client';

import { getSupabase } from './supabase';
import type { ActivityEvent, ActivitySession } from './domain';
export type { ActivityEvent, ActivitySession } from './domain';

export interface SessionRecovery<TSnapshot = Record<string, unknown>> extends ActivitySession<TSnapshot> {
  events: ActivityEvent[];
}

export interface ActivityAdapter<TSnapshot extends Record<string, unknown> = Record<string, unknown>> {
  activityType: string;
  schemaVersion: number;
  createInitialSnapshot(options?: Record<string, unknown>): TSnapshot;
  acceptsEvent(type: string): boolean;
}

const eventPrefixes: Record<string, string[]> = {
  quiz: ['quiz_'], draw: ['draw_'], cards: ['cards_'], host: ['host_'], match: ['match_'],
  debate: ['debate_'], court: ['court_'], dare: ['dare_'], photobooth: ['photobooth_'],
  passport: ['passport_'], scrapbook: ['scrapbook_'],
};

export function createActivityAdapter(activityType: string): ActivityAdapter {
  const prefixes = eventPrefixes[activityType] ?? [`${activityType}_`];
  return {
    activityType,
    schemaVersion: 1,
    createInitialSnapshot: (options = {}) => ({ activityType, schemaVersion: 1, ...options }),
    acceptsEvent: (type) => prefixes.some((prefix) => type.startsWith(prefix)) || ['reaction_sent', 'timer_started', 'music_changed', 'gentle_skip'].includes(type),
  };
}

export const activityAdapters = Object.fromEntries(Object.keys(eventPrefixes).map((type) => [type, createActivityAdapter(type)]));

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

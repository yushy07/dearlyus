'use client';

import { getSupabase } from './supabase';
import type { CourtReaction, CourtVerdict } from './court';

export async function submitCourtAction(
  sessionId: string,
  revision: number,
  actionName: string,
  payload: Record<string, unknown> = {},
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('The shared Court is unavailable.');
  const { data, error } = await supabase.rpc('submit_court_action', {
    target_session_id: sessionId,
    action_name: actionName,
    action_payload: payload,
    expected_revision: revision,
  });
  if (error) throw error;
  return data as {
    accepted: boolean;
    revision: number;
    snapshot: Record<string, unknown>;
  };
}

export async function askCourtJudge(
  sessionId: string,
  revision: number,
  mode: 'reaction',
): Promise<CourtReaction & { revision?: number }>;
export async function askCourtJudge(
  sessionId: string,
  revision: number,
  mode: 'verdict' | 'soften',
): Promise<CourtVerdict & { revision?: number }>;
export async function askCourtJudge(
  sessionId: string,
  revision: number,
  mode: 'reaction' | 'verdict' | 'soften',
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Judge Cupidot is offline.');
  const { data, error } = await supabase.functions.invoke('court-judge', {
    body: { sessionId, revision, mode },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object')
    throw new Error('Judge Cupidot returned an empty note.');
  return data;
}

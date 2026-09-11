'use client';

import { getSupabase } from './supabase';

export interface SealedLetterRecord {
  id: string;
  title: string;
  author: string;
  unlockDate: string;
  content: string | null;
  stamp: string;
  waxColor: string;
  voiceDurationSec?: number;
  voiceNoteUrl?: string;
}

export async function loadSealedLetters(coupleId: string): Promise<SealedLetterRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('list_sealed_letters', { target_couple_id: coupleId });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map((row: any) => ({
    id: String(row.id),
    title: String(row.title),
    author: String(row.author),
    unlockDate: String(row.unlockDate),
    content: typeof row.content === 'string' ? row.content : null,
    stamp: String(row.stamp || '💌'),
    waxColor: String(row.waxColor || '#E11D48'),
    voiceDurationSec: typeof row.voiceDurationSec === 'number' ? row.voiceDurationSec : undefined,
    voiceNoteUrl: typeof row.voiceNoteUrl === 'string' ? row.voiceNoteUrl : undefined,
  }));
}

export async function sealLetter(input: {
  coupleId: string;
  title: string;
  author: string;
  unlockDate: string;
  content: string;
  stamp: string;
  waxColor: string;
  voiceDurationSec?: number;
  voiceNoteUrl?: string;
}): Promise<SealedLetterRecord> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('seal_future_letter', {
    target_couple_id: input.coupleId,
    letter_title: input.title,
    letter_author: input.author,
    unlock_time: new Date(`${input.unlockDate}T12:00:00`).toISOString(),
    letter_content: input.content,
    letter_style: {
      stamp: input.stamp,
      waxColor: input.waxColor,
      voiceDurationSec: input.voiceDurationSec || null,
      voiceNoteUrl: input.voiceNoteUrl || null,
    },
  });
  if (error) throw error;
  return {
    id: String(data.id), title: String(data.title), author: String(data.author),
    unlockDate: String(data.unlockDate), content: null,
    stamp: String(data.stamp || input.stamp), waxColor: String(data.waxColor || input.waxColor),
    voiceDurationSec: input.voiceDurationSec,
    voiceNoteUrl: input.voiceNoteUrl,
  };
}

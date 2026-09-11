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
  voiceNotePath?: string;
}

export async function uploadSealedLetterAudio(coupleId: string, file: Blob) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Voice note must be 12 MB or smaller.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError || new Error('Sign in to seal a voice note.');
  const extension = file.type.includes('ogg') ? 'ogg' : file.type.includes('mpeg') ? 'mp3' : 'webm';
  const path = `${coupleId}/${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('letter-assets').upload(path, file, {
    contentType: file.type || 'audio/webm',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function loadSealedLetters(coupleId: string): Promise<SealedLetterRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('list_sealed_letters', { target_couple_id: coupleId });
  if (error) throw error;
  return Promise.all((Array.isArray(data) ? data : []).map(async (row: any) => {
    const voiceNotePath = typeof row.voiceNotePath === 'string' ? row.voiceNotePath : undefined;
    let voiceNoteUrl: string | undefined;
    if (voiceNotePath) {
      const { data: signed } = await supabase.storage.from('letter-assets').createSignedUrl(voiceNotePath, 3600);
      voiceNoteUrl = signed?.signedUrl;
    }
    return {
      id: String(row.id), title: String(row.title), author: String(row.author),
      unlockDate: String(row.unlockDate), content: typeof row.content === 'string' ? row.content : null,
      stamp: String(row.stamp || '💌'), waxColor: String(row.waxColor || '#E11D48'),
      voiceDurationSec: typeof row.voiceDurationSec === 'number' ? row.voiceDurationSec : undefined,
      voiceNotePath, voiceNoteUrl,
    };
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
  voiceNotePath?: string;
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
      voicePath: input.voiceNotePath || null,
    },
  });
  if (error) throw error;
  return {
    id: String(data.id), title: String(data.title), author: String(data.author),
    unlockDate: String(data.unlockDate), content: null,
    stamp: String(data.stamp || input.stamp), waxColor: String(data.waxColor || input.waxColor),
    voiceDurationSec: input.voiceDurationSec,
    voiceNotePath: input.voiceNotePath,
  };
}

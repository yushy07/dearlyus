'use client';

import { getSupabase } from './supabase';

export type ActivityRecordKind =
  | 'future_plan'
  | 'reunion'
  | 'bucket_date'
  | 'date_plan'
  | 'ritual'
  | 'forecast'
  | 'lab_session'
  | 'love_match'
  | 'date_night_capsule';

export interface CoupleActivityRecord<T = Record<string, unknown>> {
  id: string;
  coupleId: string;
  kind: ActivityRecordKind;
  key: string;
  title: string;
  payload: T;
  status: 'draft' | 'active' | 'completed' | 'archived';
  targetAt: string | null;
  updatedAt: string;
}

function mapRecord<T>(row: any): CoupleActivityRecord<T> {
  return {
    id: row.id,
    coupleId: row.couple_id,
    kind: row.record_kind,
    key: row.record_key,
    title: row.title,
    payload: row.payload as T,
    status: row.status,
    targetAt: row.target_at,
    updatedAt: row.updated_at,
  };
}

export async function loadActivityRecords<T>(coupleId: string, kind: ActivityRecordKind) {
  const supabase = getSupabase();
  if (!supabase) return [] as CoupleActivityRecord<T>[];
  const { data, error } = await supabase
    .from('plans_and_milestones')
    .select('id,couple_id,record_kind,record_key,title,payload,status,target_at,updated_at')
    .eq('couple_id', coupleId)
    .eq('record_kind', kind)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRecord<T>);
}

export async function upsertActivityRecord<T extends Record<string, unknown>>(input: {
  coupleId: string;
  kind: ActivityRecordKind;
  key: string;
  title: string;
  payload: T;
  status?: CoupleActivityRecord['status'];
  targetAt?: string | null;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError || new Error('Sign in to save shared activity data.');
  const { data, error } = await supabase
    .from('plans_and_milestones')
    .upsert(
      {
        couple_id: input.coupleId,
        record_kind: input.kind,
        record_key: input.key,
        title: input.title.slice(0, 120),
        payload: input.payload,
        status: input.status || 'active',
        target_at: input.targetAt || null,
        created_by: auth.user.id,
        updated_by: auth.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'couple_id,record_kind,record_key' },
    )
    .select('id,couple_id,record_kind,record_key,title,payload,status,target_at,updated_at')
    .single();
  if (error) throw error;
  return mapRecord<T>(data);
}

export async function uploadTemporaryActivityAsset(input: {
  coupleId: string;
  sessionId?: string | null;
  file: File | Blob;
  mediaKind: 'image' | 'audio';
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  if (input.file.size > 12 * 1024 * 1024) throw new Error('File must be 12 MB or smaller.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError || new Error('Sign in to upload private activity media.');
  const mime = input.file.type || (input.mediaKind === 'image' ? 'image/jpeg' : 'audio/webm');
  const extension = mime.split('/')[1]?.replace('mpeg', 'mp3') || 'bin';
  const path = `${input.coupleId}/${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('activity-assets').upload(path, input.file, {
    contentType: mime,
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.rpc('register_temporary_activity_asset', {
    target_couple_id: input.coupleId,
    target_session_id: input.sessionId || null,
    target_path: path,
    target_media_kind: input.mediaKind,
    target_mime_type: mime,
    target_byte_size: input.file.size,
  });
  if (error) {
    await supabase.storage.from('activity-assets').remove([path]);
    throw error;
  }
  const registered = data as { id: string; storage_path: string; expires_at: string };
  const { data: signed, error: signedError } = await supabase.storage
    .from('activity-assets')
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signedError) throw signedError;
  return { ...registered, signedUrl: signed.signedUrl };
}

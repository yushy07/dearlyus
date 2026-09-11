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
  | 'date_night_capsule'
  | 'birthday_gift';

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

export interface BirthdayGiftPayload {
  theme: string;
  recipient: 'A' | 'B';
  message: string;
  voucher: string;
  photoPath?: string | null;
  audioPath?: string | null;
}

export async function uploadBirthdayAsset(input: {
  coupleId: string;
  file: File;
  mediaKind: 'image' | 'audio';
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  if (input.file.size > 12 * 1024 * 1024) throw new Error('File must be 12 MB or smaller.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError || new Error('Sign in to upload birthday media.');
  const extension = input.file.type.split('/')[1]?.replace('mpeg', 'mp3') || 'bin';
  const path = `${input.coupleId}/${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('birthday-assets').upload(path, input.file, {
    contentType: input.file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data: signed, error: signedError } = await supabase.storage.from('birthday-assets').createSignedUrl(path, 3600);
  if (signedError) throw signedError;
  return { path, signedUrl: signed.signedUrl };
}

export async function loadBirthdayGift(coupleId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('birthday_gifts')
    .select('id,title,payload,status,target_at,created_by,updated_at')
    .eq('couple_id', coupleId).eq('record_key', 'current-gift').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const payload = data.payload as BirthdayGiftPayload;
  const sign = async (path?: string | null) => path
    ? (await supabase.storage.from('birthday-assets').createSignedUrl(path, 3600)).data?.signedUrl || null
    : null;
  return {
    ...data,
    payload,
    photoUrl: await sign(payload.photoPath),
    audioUrl: await sign(payload.audioPath),
  };
}

export async function saveBirthdayGift(input: {
  coupleId: string;
  title: string;
  payload: BirthdayGiftPayload;
  status: 'draft' | 'ready' | 'revealed' | 'revoked';
  targetAt?: string | null;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError || new Error('Sign in to save the birthday gift.');
  const { error } = await supabase.from('birthday_gifts').upsert({
    couple_id: input.coupleId,
    record_key: 'current-gift',
    created_by: auth.user.id,
    title: input.title.slice(0, 120),
    payload: input.payload,
    status: input.status,
    target_at: input.targetAt || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'couple_id,record_key' });
  if (error) throw error;
}

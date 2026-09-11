'use client';

import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import type {
  AccountLifecycleStatus,
  AccountProfile,
  CoupleSpace,
  DateRoom,
  Keepsake,
  KeepsakeStatus,
} from './domain';
export type {
  AccountProfile,
  CoupleInvitation,
  CoupleInvitePreview,
  CoupleSpace,
  DateRoom,
  DateRoomMember,
  Keepsake,
} from './domain';

export interface RelationshipMilestone {
  id: string;
  kind: string;
  title: string;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export interface SharedPreferences {
  preferredMood: 'playful' | 'romantic' | 'deep' | 'cozy';
  defaultDurationMinutes: 15 | 30 | 45 | 60 | 90;
  ambientAudioEnabled: boolean;
  reducedMotion: boolean;
  /** Couple-owned consent, persisted and enforced by the live backend. */
  aiConsent: boolean;
  updatedAt: string | null;
}

export function profileFromUser(user: User): AccountProfile {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    displayName: String(metadata.full_name || metadata.name || '').trim(),
    city: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    avatarUrl: (metadata.avatar_url || metadata.picture || null) as
      | string
      | null,
    onboardingCompleted: false,
    accountStatus: 'active',
  };
}

export async function loadAccount(user: User) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, display_name, city, timezone, avatar_url, onboarding_completed, account_status',
    )
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;

  const fallback = profileFromUser(user);
  const profile: AccountProfile = data
    ? {
        id: data.id,
        displayName: data.display_name || fallback.displayName,
        city: data.city || '',
        timezone: data.timezone || fallback.timezone,
        avatarUrl: data.avatar_url || fallback.avatarUrl,
        onboardingCompleted: Boolean(data.onboarding_completed),
        accountStatus: (data.account_status ||
          'active') as AccountLifecycleStatus,
      }
    : fallback;

  const { data: spaceData, error: spaceError } =
    await supabase.rpc('get_my_space');
  if (spaceError) throw spaceError;
  const space = spaceData ? (spaceData as CoupleSpace) : null;

  let keepsakes: Keepsake[] = [];
  if (space?.id) {
    const { data: keepsakeData, error: keepsakeError } = await supabase
      .from('keepsakes')
      .select(
        'id, kind, status, title, preview_url, activity_path, created_at, finalized_at, caption, storage_bucket, storage_path, metadata',
      )
      .eq('couple_id', space.id)
      .order('created_at', { ascending: false })
      .limit(12);
    if (keepsakeError) throw keepsakeError;
    keepsakes = await Promise.all(
      (keepsakeData ?? []).map(async (item) => {
        let previewUrl = item.preview_url;
        if (!previewUrl && item.storage_bucket && item.storage_path) {
          const { data: signed } = await supabase.storage
            .from(item.storage_bucket)
            .createSignedUrl(item.storage_path, 3600);
          previewUrl = signed?.signedUrl ?? null;
        }
        return {
          id: item.id,
          kind: item.kind,
          status: item.status as KeepsakeStatus,
          title: item.title,
          previewUrl,
          activityPath: item.activity_path,
          createdAt: item.created_at,
          finalizedAt: item.finalized_at,
          caption: item.caption,
          storageBucket: item.storage_bucket,
          storagePath: item.storage_path,
          metadata: item.metadata ?? {},
        };
      }),
    );
  }

  let preferences: SharedPreferences | null = null;
  let milestones: RelationshipMilestone[] = [];
  if (space?.id) {
    const [
      { data: preferenceData, error: preferenceError },
      { data: milestoneData, error: milestoneError },
    ] = await Promise.all([
      supabase.rpc('get_shared_preferences'),
      supabase
        .from('relationship_milestones')
        .select('id, kind, title, occurred_at, metadata')
        .eq('couple_id', space.id)
        .order('occurred_at', { ascending: false })
        .limit(20),
    ]);
    if (preferenceError) throw preferenceError;
    if (milestoneError) throw milestoneError;
    preferences = preferenceData as SharedPreferences | null;
    milestones = (milestoneData ?? []).map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      occurredAt: item.occurred_at,
      metadata: item.metadata ?? {},
    }));
  }

  return { profile, space, keepsakes, preferences, milestones };
}

export async function saveAccountProfile(
  user: User,
  input: Pick<AccountProfile, 'displayName' | 'city' | 'timezone'>,
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const avatarUrl = (user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null) as string | null;
  const { error } = await supabase.rpc('save_my_profile', {
    profile_display_name: input.displayName.trim(),
    profile_city: input.city.trim(),
    profile_timezone: input.timezone.trim(),
    profile_avatar_url: avatarUrl,
  });
  if (error) throw error;
}

async function runSpaceRpc(name: string, params?: Record<string, string>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return data as CoupleSpace;
}

export const createCoupleSpace = (name: string) =>
  runSpaceRpc('create_couple_space', { space_name: name });
export const joinCoupleSpace = (code: string) =>
  runSpaceRpc('join_couple_by_invite', { invite_code: code });
export const regenerateInvite = () => runSpaceRpc('regenerate_couple_invite');
export const revokeInvite = () => runSpaceRpc('revoke_couple_invite');
export const rotateRoom = () => runSpaceRpc('rotate_couple_room');

export async function saveSharedPreferences(
  preferences: Omit<SharedPreferences, 'updatedAt'>,
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('save_shared_preferences', {
    preferences,
  });
  if (error) throw error;
  return data as SharedPreferences;
}

export async function loadSharedPreferences() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('get_shared_preferences');
  if (error) throw error;
  return data as SharedPreferences | null;
}

export async function uploadKeepsake(input: {
  coupleId: string;
  kind: Keepsake['kind'];
  title: string;
  file?: File | Blob;
  activityPath?: string;
  sessionId?: string;
  caption?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  let bucket: string | null = null;
  let path: string | null = null;
  if (input.file) {
    bucket =
      input.kind === 'photostrip'
        ? 'couple-photostrips'
        : input.kind === 'activity'
          ? 'couple-drawings'
          : 'couple-keepsakes';
    const extension =
      input.file.type === 'image/webp'
        ? 'webp'
        : input.file.type === 'application/pdf'
          ? 'pdf'
          : input.file.type === 'image/jpeg'
            ? 'jpg'
            : 'png';
    path = `${input.coupleId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, input.file, {
        contentType: input.file.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;
  }
  const { data, error } = await supabase.rpc('finalize_keepsake', {
    keepsake_kind: input.kind,
    keepsake_title: input.title,
    target_bucket: bucket,
    target_path: path,
    source_activity_path: input.activityPath ?? null,
    source_session_id: input.sessionId ?? null,
    keepsake_caption: input.caption ?? null,
    keepsake_metadata: input.metadata ?? {},
  });
  if (error) {
    if (bucket && path) await supabase.storage.from(bucket).remove([path]);
    throw error;
  }
  return data as Pick<
    Keepsake,
    'id' | 'kind' | 'title' | 'activityPath' | 'createdAt'
  >;
}

export async function deleteKeepsake(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('delete_keepsake', {
    target_keepsake_id: id,
  });
  if (error) throw error;
  return data as { deleted: boolean; id: string };
}

async function runRoomRpc(name: string, params?: Record<string, unknown>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return data as DateRoom;
}

export const createDateRoom = () => runRoomRpc('create_date_room');
export const joinDateRoom = (code: string) =>
  runRoomRpc('join_date_room', { room_code: code });
export const setDateRoomReady = (code: string, ready: boolean) =>
  runRoomRpc('set_room_ready', { room_code: code, is_ready: ready });
export const leaveDateRoom = async (code: string) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.rpc('leave_date_room', { room_code: code });
  if (error) throw error;
};
export const rotateDateRoomCode = (code: string) =>
  runRoomRpc('rotate_date_room_code', { room_code: code });

export async function startDateActivity(
  code: string,
  activityType: string,
  snapshot: Record<string, unknown> = {},
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('start_activity', {
    room_code: code,
    selected_activity: activityType,
    initial_snapshot: snapshot,
  });
  if (error) throw error;
  return data as {
    room: DateRoom;
    sessionId: string;
    activityType: string;
    revision: number;
  };
}

export async function saveDateNightCapsule(
  coupleId: string,
  payload: Record<string, unknown>,
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('save_date_night_capsule', {
    target_couple_id: coupleId,
    capsule_payload: payload,
  });
  if (error) throw error;
  return data as { success: boolean; keepsake: Keepsake };
}

export async function recordRitualEntry(
  coupleId: string,
  ritualKey: string,
  payload: Record<string, unknown>,
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('record_ritual_entry', {
    target_couple_id: coupleId,
    ritual_key: ritualKey,
    entry_payload: payload,
  });
  if (error) throw error;
  return data as { success: boolean; ritualKey: string };
}

export async function saveScheduledDate(
  coupleId: string,
  scheduledDate: string,
  title = 'Our Next Date Night',
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('save_scheduled_date', {
    target_couple_id: coupleId,
    scheduled_date: scheduledDate,
    title,
  });
  if (error) throw error;
  return data as { success: boolean; scheduledAt: string; title: string };
}

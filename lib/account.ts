'use client';

import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export interface AccountProfile {
  id: string;
  displayName: string;
  city: string;
  timezone: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
}

export interface SpaceMember {
  id: string;
  displayName: string;
  city: string;
  timezone: string;
  avatarUrl: string | null;
  role: 'owner' | 'partner';
}

export interface CoupleSpace {
  id: string;
  name: string;
  createdBy: string;
  activeRoomCode: string | null;
  members: SpaceMember[];
  invite: { code: string; expiresAt: string } | null;
}

export interface Keepsake {
  id: string;
  kind: 'photostrip' | 'passport' | 'receipt' | 'letter' | 'scrapbook' | 'activity';
  title: string;
  previewUrl: string | null;
  activityPath: string | null;
  createdAt: string;
}

export function profileFromUser(user: User): AccountProfile {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    displayName: String(metadata.full_name || metadata.name || '').trim(),
    city: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    avatarUrl: (metadata.avatar_url || metadata.picture || null) as string | null,
    onboardingCompleted: false,
  };
}

export async function loadAccount(user: User) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, city, timezone, avatar_url, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;

  const fallback = profileFromUser(user);
  const profile: AccountProfile = data ? {
    id: data.id,
    displayName: data.display_name || fallback.displayName,
    city: data.city || '',
    timezone: data.timezone || fallback.timezone,
    avatarUrl: data.avatar_url || fallback.avatarUrl,
    onboardingCompleted: Boolean(data.onboarding_completed),
  } : fallback;

  const { data: spaceData, error: spaceError } = await supabase.rpc('get_my_space');
  if (spaceError) throw spaceError;
  const space = spaceData ? (spaceData as CoupleSpace) : null;

  let keepsakes: Keepsake[] = [];
  if (space?.id) {
    const { data: keepsakeData, error: keepsakeError } = await supabase
      .from('keepsakes')
      .select('id, kind, title, preview_url, activity_path, created_at')
      .eq('couple_id', space.id)
      .order('created_at', { ascending: false })
      .limit(12);
    if (keepsakeError) throw keepsakeError;
    keepsakes = (keepsakeData ?? []).map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      previewUrl: item.preview_url,
      activityPath: item.activity_path,
      createdAt: item.created_at,
    }));
  }

  return { profile, space, keepsakes };
}

export async function saveAccountProfile(user: User, input: Pick<AccountProfile, 'displayName' | 'city' | 'timezone'>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const avatarUrl = (user.user_metadata?.avatar_url || user.user_metadata?.picture || null) as string | null;
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: input.displayName.trim(),
    city: input.city.trim(),
    timezone: input.timezone,
    avatar_url: avatarUrl,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
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

export const createCoupleSpace = (name: string) => runSpaceRpc('create_couple_space', { space_name: name });
export const joinCoupleSpace = (code: string) => runSpaceRpc('join_couple_by_invite', { invite_code: code });
export const regenerateInvite = () => runSpaceRpc('regenerate_couple_invite');
export const rotateRoom = () => runSpaceRpc('rotate_couple_room');

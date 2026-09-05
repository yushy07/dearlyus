'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useSupabaseSession } from './SupabaseSessionContext';
import type { SpaceMember } from '@/lib/domain';
import {
  type AccountProfile,
  type CoupleSpace,
  type Keepsake,
  type RelationshipMilestone,
  type SharedPreferences,
  loadAccount,
  profileFromUser,
  saveAccountProfile,
  createCoupleSpace as rpcCreateCoupleSpace,
  joinCoupleSpace as rpcJoinCoupleSpace,
  regenerateInvite as rpcRegenerateInvite,
  revokeInvite as rpcRevokeInvite,
  rotateRoom as rpcRotateRoom,
  saveSharedPreferences as rpcSaveSharedPreferences,
  deleteKeepsake as rpcDeleteKeepsake,
} from '@/lib/account';
import { saveStoredCoupleProfile } from '@/lib/couple';

export interface CoupleSpaceContextValue {
  profile: AccountProfile | null;
  space: CoupleSpace | null;
  partner: SpaceMember | null;
  ownMember: SpaceMember | null;
  keepsakes: Keepsake[];
  milestones: RelationshipMilestone[];
  preferences: SharedPreferences | null;
  loading: boolean;
  error: string | null;
  partnerConnected: boolean;
  refresh: () => Promise<void>;
  saveProfile: (input: Pick<AccountProfile, 'displayName' | 'city' | 'timezone'>) => Promise<void>;
  createSpace: (name: string) => Promise<CoupleSpace>;
  joinSpace: (code: string) => Promise<CoupleSpace>;
  regenerateInvite: () => Promise<CoupleSpace>;
  revokeInvite: () => Promise<CoupleSpace>;
  rotateRoom: () => Promise<CoupleSpace>;
  savePreferences: (prefs: Omit<SharedPreferences, 'updatedAt'>) => Promise<SharedPreferences>;
  removeKeepsake: (id: string) => Promise<void>;
  exportSpaceData: () => Promise<string>;
  disconnectSpace: () => Promise<void>;
}

const CoupleSpaceContext = createContext<CoupleSpaceContextValue | null>(null);

export function CoupleSpaceProvider({ children }: { children: React.ReactNode }) {
  const { user, supabase, loading: authLoading } = useSupabaseSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [space, setSpace] = useState<CoupleSpace | null>(null);
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [milestones, setMilestones] = useState<RelationshipMilestone[]>([]);
  const [preferences, setPreferences] = useState<SharedPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncLegacyCouple = useCallback((p: AccountProfile | null, s: CoupleSpace | null) => {
    if (!p) return;
    const partnerMember = s?.members.find((m) => m.id !== p.id);
    saveStoredCoupleProfile({
      partnerA: p.displayName || 'You',
      cityA: p.city || '',
      partnerB: partnerMember?.displayName || 'Your person',
      cityB: partnerMember?.city || '',
      roomCode: s?.activeRoomCode || undefined,
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setSpace(null);
      setKeepsakes([]);
      setMilestones([]);
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const account = await loadAccount(user);
      setProfile(account.profile);
      setSpace(account.space);
      setKeepsakes(account.keepsakes);
      setMilestones(account.milestones);
      setPreferences(account.preferences);
      syncLegacyCouple(account.profile, account.space);
    } catch (err: any) {
      const fallback = profileFromUser(user);
      setProfile(fallback);
      setError(err?.message || 'Failed to load couple space.');
    } finally {
      setLoading(false);
    }
  }, [user, syncLegacyCouple]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  // Realtime subscription to couple space tables
  useEffect(() => {
    if (!supabase || !space?.id || !user) return;

    const spaceId = space.id;
    const channel = supabase
      .channel(`couple-space:${spaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${spaceId}` }, () => {
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_invites', filter: `couple_id=eq.${spaceId}` }, () => {
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'keepsakes', filter: `couple_id=eq.${spaceId}` }, () => {
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relationship_milestones', filter: `couple_id=eq.${spaceId}` }, () => {
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_preferences', filter: `couple_id=eq.${spaceId}` }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, space?.id, user, refresh]);

  const saveProfileHandler = async (input: Pick<AccountProfile, 'displayName' | 'city' | 'timezone'>) => {
    if (!user) throw new Error('You must be signed in.');
    await saveAccountProfile(user, input);
    await refresh();
  };

  const createSpaceHandler = async (name: string) => {
    const nextSpace = await rpcCreateCoupleSpace(name);
    setSpace(nextSpace);
    syncLegacyCouple(profile, nextSpace);
    return nextSpace;
  };

  const joinSpaceHandler = async (code: string) => {
    const nextSpace = await rpcJoinCoupleSpace(code);
    setSpace(nextSpace);
    syncLegacyCouple(profile, nextSpace);
    return nextSpace;
  };

  const regenerateInviteHandler = async () => {
    const nextSpace = await rpcRegenerateInvite();
    setSpace(nextSpace);
    return nextSpace;
  };

  const revokeInviteHandler = async () => {
    const nextSpace = await rpcRevokeInvite();
    setSpace(nextSpace);
    return nextSpace;
  };

  const rotateRoomHandler = async () => {
    const nextSpace = await rpcRotateRoom();
    setSpace(nextSpace);
    syncLegacyCouple(profile, nextSpace);
    return nextSpace;
  };

  const savePreferencesHandler = async (prefs: Omit<SharedPreferences, 'updatedAt'>) => {
    const saved = await rpcSaveSharedPreferences(prefs);
    setPreferences(saved);
    return saved;
  };

  const removeKeepsakeHandler = async (id: string) => {
    await rpcDeleteKeepsake(id);
    setKeepsakes((prev) => prev.filter((item) => item.id !== id));
  };

  const exportSpaceDataHandler = async () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      profile,
      space,
      milestones,
      preferences,
      keepsakes: keepsakes.map((k) => ({
        id: k.id,
        kind: k.kind,
        title: k.title,
        caption: k.caption,
        createdAt: k.createdAt,
      })),
    };
    return JSON.stringify(exportData, null, 2);
  };

  const disconnectSpaceHandler = async () => {
    if (!supabase || !space?.id) return;
    // Leave membership cleanly
    const { error: leaveErr } = await supabase.from('couple_members').delete().eq('couple_id', space.id).eq('user_id', user!.id);
    if (leaveErr) throw leaveErr;
    setSpace(null);
    await refresh();
  };

  const partner = useMemo(() => {
    if (!space || !user) return null;
    return space.members.find((m) => m.id !== user.id) ?? null;
  }, [space, user]);

  const ownMember = useMemo(() => {
    if (!space || !user) return null;
    return space.members.find((m) => m.id === user.id) ?? null;
  }, [space, user]);

  const partnerConnected = Boolean(partner);

  const value = useMemo<CoupleSpaceContextValue>(
    () => ({
      profile,
      space,
      partner,
      ownMember,
      keepsakes,
      milestones,
      preferences,
      loading: authLoading || loading,
      error,
      partnerConnected,
      refresh,
      saveProfile: saveProfileHandler,
      createSpace: createSpaceHandler,
      joinSpace: joinSpaceHandler,
      regenerateInvite: regenerateInviteHandler,
      revokeInvite: revokeInviteHandler,
      rotateRoom: rotateRoomHandler,
      savePreferences: savePreferencesHandler,
      removeKeepsake: removeKeepsakeHandler,
      exportSpaceData: exportSpaceDataHandler,
      disconnectSpace: disconnectSpaceHandler,
    }),
    [
      profile,
      space,
      partner,
      ownMember,
      keepsakes,
      milestones,
      preferences,
      authLoading,
      loading,
      error,
      partnerConnected,
      refresh,
    ]
  );

  return <CoupleSpaceContext.Provider value={value}>{children}</CoupleSpaceContext.Provider>;
}

export function useCoupleSpace() {
  const context = useContext(CoupleSpaceContext);
  if (!context) {
    throw new Error('useCoupleSpace must be used within a CoupleSpaceProvider');
  }
  return context;
}

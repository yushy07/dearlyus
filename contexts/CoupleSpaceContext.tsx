'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useSupabaseSession } from './SupabaseSessionContext';
import type { SpaceMember } from '@/lib/domain';
import {
  type AccountProfile,
  type CoupleSpace,
  type Keepsake,
  type RelationshipMilestone,
  type SharedPreferences,
  loadAccount,
  saveAccountProfile,
  createCoupleSpace as rpcCreateCoupleSpace,
  joinCoupleSpace as rpcJoinCoupleSpace,
  regenerateInvite as rpcRegenerateInvite,
  revokeInvite as rpcRevokeInvite,
  rotateRoom as rpcRotateRoom,
  saveSharedPreferences as rpcSaveSharedPreferences,
  deleteKeepsake as rpcDeleteKeepsake,
} from '@/lib/account';

export interface CoupleSpaceContextValue {
  status: 'initializing' | 'ready' | 'refreshing' | 'recoverable_error';
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
  saveProfile: (
    input: Pick<AccountProfile, 'displayName' | 'city' | 'timezone'>,
  ) => Promise<void>;
  createSpace: (name: string) => Promise<CoupleSpace>;
  joinSpace: (code: string) => Promise<CoupleSpace>;
  regenerateInvite: () => Promise<CoupleSpace>;
  revokeInvite: () => Promise<CoupleSpace>;
  rotateRoom: () => Promise<CoupleSpace>;
  savePreferences: (
    prefs: Omit<SharedPreferences, 'updatedAt'>,
  ) => Promise<SharedPreferences>;
  removeKeepsake: (id: string) => Promise<void>;
  exportSpaceData: () => Promise<string>;
}

const CoupleSpaceContext = createContext<CoupleSpaceContextValue | null>(null);

export function CoupleSpaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, supabase, loading: authLoading } = useSupabaseSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [space, setSpace] = useState<CoupleSpace | null>(null);
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [milestones, setMilestones] = useState<RelationshipMilestone[]>([]);
  const [preferences, setPreferences] = useState<SharedPreferences | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [status, setStatus] =
    useState<CoupleSpaceContextValue['status']>('initializing');
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestSequence.current;
    if (!user) {
      setProfile(null);
      setSpace(null);
      setKeepsakes([]);
      setMilestones([]);
      setPreferences(null);
      setLoading(false);
      setStatus('ready');
      return;
    }

    try {
      setStatus((current) =>
        current === 'ready' || current === 'recoverable_error'
          ? 'refreshing'
          : 'initializing',
      );
      setError(null);
      const account = await loadAccount(user);
      if (requestId !== requestSequence.current) return;
      setProfile(account.profile);
      setSpace(account.space);
      setKeepsakes(account.keepsakes);
      setMilestones(account.milestones);
      setPreferences(account.preferences);
      setStatus('ready');
    } catch (err: any) {
      if (requestId !== requestSequence.current) return;
      setError(err?.message || 'Failed to load couple space.');
      setStatus('recoverable_error');
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  // A partner can finish onboarding or edit their city in another browser.
  // Refresh when this tab returns to view, plus a light visible-only heartbeat,
  // so all names and places stay current even when profile-table realtime is
  // unavailable under row-level security.
  useEffect(() => {
    if (!user) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [user, refresh]);

  // Realtime subscription to couple space tables
  useEffect(() => {
    if (!supabase || !space?.id || !user) return;

    const spaceId = space.id;
    const channel = supabase
      .channel(`couple-space:${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_members',
          filter: `couple_id=eq.${spaceId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_invites',
          filter: `couple_id=eq.${spaceId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keepsakes',
          filter: `couple_id=eq.${spaceId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'relationship_milestones',
          filter: `couple_id=eq.${spaceId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_preferences',
          filter: `couple_id=eq.${spaceId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, space?.id, user, refresh]);

  const saveProfileHandler = async (
    input: Pick<AccountProfile, 'displayName' | 'city' | 'timezone'>,
  ) => {
    if (!user) throw new Error('You must be signed in.');
    const savedProfile = await saveAccountProfile(user, input);
    setProfile(savedProfile);
    await refresh();
  };

  const createSpaceHandler = async (name: string) => {
    const nextSpace = await rpcCreateCoupleSpace(name);
    setSpace(nextSpace);
    await refresh();
    return nextSpace;
  };

  const joinSpaceHandler = async (code: string) => {
    const nextSpace = await rpcJoinCoupleSpace(code);
    setSpace(nextSpace);
    await refresh();
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
    return nextSpace;
  };

  const savePreferencesHandler = async (
    prefs: Omit<SharedPreferences, 'updatedAt'>,
  ) => {
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
      status,
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
    }),
    [
      profile,
      status,
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
    ],
  );

  return (
    <CoupleSpaceContext.Provider value={value}>
      {children}
    </CoupleSpaceContext.Provider>
  );
}

export function useCoupleSpace() {
  const context = useContext(CoupleSpaceContext);
  if (!context) {
    throw new Error('useCoupleSpace must be used within a CoupleSpaceProvider');
  }
  return context;
}

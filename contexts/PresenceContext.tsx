'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useSupabaseSession } from './SupabaseSessionContext';
import { useActiveRoom } from './ActiveRoomContext';
import { useCoupleSpace } from './CoupleSpaceContext';
import type { PresenceState } from '@/lib/domain';

export type RoomConnectionState = 'idle' | 'connecting' | 'synchronized' | 'reconnecting' | 'unavailable';
export type InteractionType = 'idle' | 'ready' | 'choosing' | 'writing' | 'drawing';

export interface PresenceContextValue {
  connectionState: RoomConnectionState;
  partnerOnline: boolean;
  partnerPresence: PresenceState | null;
  partnerInteraction: InteractionType;
  myInteraction: InteractionType;
  setInteraction: (interaction: InteractionType) => Promise<void>;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

function getDeviceId() {
  if (typeof window === 'undefined') return 'server';
  const key = 'dearly-us-device-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user, supabase } = useSupabaseSession();
  const { room } = useActiveRoom();
  const { profile } = useCoupleSpace();

  const [connectionState, setConnectionState] = useState<RoomConnectionState>('idle');
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState<PresenceState | null>(null);
  const [myInteraction, setMyInteractionState] = useState<InteractionType>('idle');

  const tabId = useRef(crypto.randomUUID()).current;
  const channelRef = useRef<RealtimeChannel | null>(null);

  const setInteraction = useCallback(
    async (interaction: InteractionType) => {
      setMyInteractionState(interaction);
      if (!channelRef.current || !user || !room) return;

      const now = new Date().toISOString();
      await channelRef.current.track({
        userId: user.id,
        displayName: (profile?.displayName || 'Partner').slice(0, 60),
        roomId: room.id,
        deviceId: getDeviceId(),
        tabId,
        interaction,
        onlineAt: now,
        lastActiveAt: now,
      } satisfies PresenceState);
    },
    [user, room, profile, tabId]
  );

  useEffect(() => {
    if (!supabase || !room?.id || !user) {
      setConnectionState('idle');
      setPartnerOnline(false);
      setPartnerPresence(null);
      return;
    }

    let active = true;
    setConnectionState('connecting');

    const channel = supabase.channel(`presence:room:${room.id}`, {
      config: { private: true, presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        if (!active) return;
        const state = channel.presenceState() as Record<string, PresenceState[]>;
        const allPresences = Object.values(state).flat();
        const otherPresences = allPresences.filter((p) => p.userId !== user.id);

        if (otherPresences.length > 0) {
          setPartnerOnline(true);
          // Pick the most recent active presence
          setPartnerPresence(otherPresences[otherPresences.length - 1]);
        } else {
          setPartnerOnline(false);
          setPartnerPresence(null);
        }
      })
      .subscribe(async (status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          const now = new Date().toISOString();
          await channel.track({
            userId: user.id,
            displayName: (profile?.displayName || 'Partner').slice(0, 60),
            roomId: room.id,
            deviceId: getDeviceId(),
            tabId,
            interaction: myInteraction,
            onlineAt: now,
            lastActiveAt: now,
          } satisfies PresenceState);
          setConnectionState('synchronized');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionState('reconnecting');
        } else if (status === 'CLOSED') {
          setConnectionState('unavailable');
        }
      });

    return () => {
      active = false;
      channelRef.current = null;
      setConnectionState('idle');
      setPartnerOnline(false);
      setPartnerPresence(null);
      void supabase.removeChannel(channel);
    };
  }, [supabase, room?.id, user, profile?.displayName, myInteraction, tabId]);

  const partnerInteraction = useMemo<InteractionType>(() => {
    return partnerPresence?.interaction ?? 'idle';
  }, [partnerPresence]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      connectionState,
      partnerOnline,
      partnerPresence,
      partnerInteraction,
      myInteraction,
      setInteraction,
    }),
    [connectionState, partnerOnline, partnerPresence, partnerInteraction, myInteraction, setInteraction]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

const defaultPresenceValue: PresenceContextValue = {
  connectionState: 'idle',
  partnerOnline: false,
  partnerPresence: null,
  partnerInteraction: 'idle',
  myInteraction: 'idle',
  setInteraction: async () => {},
};

export function useRoomPresence() {
  const context = useContext(PresenceContext);
  return context || defaultPresenceValue;
}

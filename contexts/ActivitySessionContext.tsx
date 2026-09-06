'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSupabaseSession } from './SupabaseSessionContext';
import { useActiveRoom } from './ActiveRoomContext';
import {
  type ActivityEvent,
  type ActivitySession,
  recoverActivitySession,
  appendActivityEvent as rpcAppendActivityEvent,
  completeActivitySession as rpcCompleteActivitySession,
  setActivityPaused as rpcSetActivityPaused,
} from '@/lib/activity-session';
import { startDateActivity as rpcStartDateActivity } from '@/lib/account';

import type {
  StandardSessionState,
  StandardRecoveryState,
} from '@/lib/activity-adapters';

export interface ActivitySessionContextValue {
  session: ActivitySession | null;
  sessionId: string | null;
  activityType: string | null;
  revision: number;
  lastSequence: number;
  events: ActivityEvent[];
  lastEvent: ActivityEvent | null;
  loading: boolean;
  isReplaying: boolean;
  serverTimeOffset: number;
  sessionState: StandardSessionState;
  recoveryState: StandardRecoveryState;
  getServerNow: () => number;
  startActivity: (activityType: string, options?: Record<string, unknown>) => Promise<{ sessionId: string; activityType: string }>;
  sendEvent: (type: string, payload: unknown) => Promise<ActivityEvent | null>;
  sendTransient: (event: string, payload: unknown) => void;
  recover: (afterSequence?: number) => Promise<void>;
  completeActivity: (resultSnapshot: Record<string, unknown>) => Promise<void>;
  setPaused: (paused: boolean) => Promise<void>;
  registerEventHandler: (handler: (event: ActivityEvent) => void) => () => void;
  registerTransientHandler: (event: string, handler: (payload: any) => void) => () => void;
}

const ActivitySessionContext = createContext<ActivitySessionContextValue | null>(null);

export function ActivitySessionProvider({
  children,
  initialSessionId,
  initialActivityType,
}: {
  children: React.ReactNode;
  initialSessionId?: string;
  initialActivityType?: string;
}) {
  const { user, supabase } = useSupabaseSession();
  const { room } = useActiveRoom();

  const [session, setSession] = useState<ActivitySession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || room?.currentSessionId || null);
  const [activityType, setActivityType] = useState<string | null>(initialActivityType || null);
  const [revision, setRevision] = useState<number>(0);
  const [lastSequence, setLastSequence] = useState<number>(0);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<ActivityEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(initialSessionId || room?.currentSessionId));
  const [isReplaying, setIsReplaying] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [sessionState, setSessionState] = useState<StandardSessionState>('drafting');
  const [recoveryState, setRecoveryState] = useState<StandardRecoveryState>('idle');

  const seenEventIds = useRef<Set<string>>(new Set());
  const lastSequenceRef = useRef<number>(0);
  const eventHandlers = useRef<Set<(event: ActivityEvent) => void>>(new Set());

  // Transient channel ref and handler registry
  const transientChannelRef = useRef<any>(null);
  const transientHandlers = useRef<Map<string, Set<(payload: any) => void>>>(new Map());

  const getServerNow = useCallback(() => {
    return Date.now() + serverTimeOffset;
  }, [serverTimeOffset]);

  const registerEventHandler = useCallback((handler: (event: ActivityEvent) => void) => {
    eventHandlers.current.add(handler);
    return () => {
      eventHandlers.current.delete(handler);
    };
  }, []);

  const registerTransientHandler = useCallback((event: string, handler: (payload: any) => void) => {
    if (!transientHandlers.current.has(event)) {
      transientHandlers.current.set(event, new Set());
    }
    transientHandlers.current.get(event)!.add(handler);
    return () => {
      transientHandlers.current.get(event)?.delete(handler);
    };
  }, []);

  const sendTransient = useCallback((event: string, payload: unknown) => {
    if (transientChannelRef.current) {
      transientChannelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }, []);

  const dispatchEvent = useCallback((event: ActivityEvent) => {
    // 1. Ignore duplicate delivery
    if (!event.id || seenEventIds.current.has(event.id)) return;
    seenEventIds.current.add(event.id);

    // 2. Detect event gap and request replay
    if (event.sequence > lastSequenceRef.current + 1 && lastSequenceRef.current > 0) {
      console.warn(
        `[ActivitySession] Event gap detected: last=${lastSequenceRef.current}, incoming=${event.sequence}. Requesting replay.`
      );
      void recover(lastSequenceRef.current);
    }

    lastSequenceRef.current = Math.max(lastSequenceRef.current, event.sequence);
    setLastSequence(lastSequenceRef.current);
    setLastEvent(event);
    setEvents((prev) => [...prev, event]);

    // Update server time offset from server timestamp
    if (event.createdAt) {
      const serverMs = new Date(event.createdAt).getTime();
      if (!Number.isNaN(serverMs)) {
        setServerTimeOffset(serverMs - Date.now());
      }
    }

    eventHandlers.current.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error('Error in activity event handler:', err);
      }
    });
  }, []);

  const recover = useCallback(
    async (afterSequence = 0) => {
      const targetId = sessionId || room?.currentSessionId;
      if (!targetId || !user) return;

      setIsReplaying(true);
      try {
        const recovery = await recoverActivitySession(targetId, afterSequence);
        if (recovery) {
          setSession(recovery);
          setActivityType(recovery.activityType);
          setRevision(Number(recovery.revision ?? 0));
          const seq = Number(recovery.lastSequence ?? 0);
          lastSequenceRef.current = Math.max(lastSequenceRef.current, seq);
          setLastSequence(lastSequenceRef.current);

          if (recovery.startedAt) {
            const serverMs = new Date(recovery.startedAt).getTime();
            if (!Number.isNaN(serverMs)) {
              setServerTimeOffset(serverMs - Date.now());
            }
          }

          if (Array.isArray(recovery.events)) {
            recovery.events.forEach((evt) => {
              dispatchEvent({
                id: evt.id,
                sequence: Number(evt.sequence),
                schemaVersion: evt.schemaVersion,
                senderId: evt.senderId,
                type: evt.type,
                payload: evt.payload,
                clientCreatedAt: evt.clientCreatedAt,
                createdAt: evt.createdAt,
              });
            });
          }
        }
      } catch (err) {
        console.error('Session recovery failed:', err);
      } finally {
        setIsReplaying(false);
        setLoading(false);
      }
    },
    [sessionId, room?.currentSessionId, user, dispatchEvent]
  );

  useEffect(() => {
    const activeSessionId = initialSessionId || room?.currentSessionId || null;
    if (activeSessionId && activeSessionId !== sessionId) {
      setSessionId(activeSessionId);
      void recover(0);
    }
  }, [initialSessionId, room?.currentSessionId, sessionId, recover]);

  // Reload the latest snapshot after browser sleep, tab hidden -> visible, or reconnection
  useEffect(() => {
    const handleWakeOrOnline = () => {
      if (document.visibilityState === 'visible') {
        void recover(0);
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrOnline);
    window.addEventListener('online', handleWakeOrOnline);
    window.addEventListener('focus', handleWakeOrOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeOrOnline);
      window.removeEventListener('online', handleWakeOrOnline);
      window.removeEventListener('focus', handleWakeOrOnline);
    };
  }, [recover]);

  // Realtime subscription to room_events
  useEffect(() => {
    if (!supabase || !room?.id) return;

    const channel = supabase
      .channel(`room-events:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_events',
          filter: `room_id=eq.${room.id}`,
        },
        (change: any) => {
          const row = change.new;
          if (sessionId && row.session_id && row.session_id !== sessionId) return;

          dispatchEvent({
            id: row.id,
            sequence: Number(row.sequence),
            schemaVersion: Number(row.schema_version || 1),
            senderId: row.sender_id,
            type: row.event_type,
            payload: row.payload,
            clientCreatedAt: row.client_created_at,
            createdAt: row.created_at,
          });
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // Re-sync latest snapshot when reconnecting
          void recover(lastSequenceRef.current);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, room?.id, sessionId, dispatchEvent, recover]);

  // Transient channel for transient cursor / pointer broadcast
  useEffect(() => {
    if (!supabase || !room?.id) return;

    const transientChannel = supabase.channel(`room-transient:${room.id}`, {
      config: { broadcast: { self: false } },
    });

    transientChannel
      .on('broadcast', { event: '*' }, (message: any) => {
        const { event, payload } = message;
        const handlers = transientHandlers.current.get(event);
        if (handlers) {
          handlers.forEach((fn) => {
            try {
              fn(payload);
            } catch (err) {
              console.error('Error in transient event handler:', err);
            }
          });
        }
      })
      .subscribe();

    transientChannelRef.current = transientChannel;

    return () => {
      void supabase.removeChannel(transientChannel);
      transientChannelRef.current = null;
    };
  }, [supabase, room?.id]);

  const startActivityHandler = async (type: string, options: Record<string, unknown> = {}) => {
    if (!room?.code || !user || !supabase) {
      // Local mock fallback for development and local testing
      const mockId = `mock-${Date.now()}`;
      setSessionId(mockId);
      setActivityType(type);
      setRevision(1);
      seenEventIds.current.clear();
      lastSequenceRef.current = 0;
      setLastSequence(0);
      setEvents([]);
      setSessionState('active');
      setRecoveryState('recovered');
      return { sessionId: mockId, activityType: type };
    }
    setLoading(true);
    try {
      const started = await rpcStartDateActivity(room.code, type, options);
      setSessionId(started.sessionId);
      setActivityType(started.activityType);
      setRevision(started.revision);
      seenEventIds.current.clear();
      lastSequenceRef.current = 0;
      setLastSequence(0);
      setEvents([]);
      setSessionState('active');
      setRecoveryState('recovered');
      return { sessionId: started.sessionId, activityType: started.activityType };
    } finally {
      setLoading(false);
    }
  };

  const sendEventHandler = async (type: string, payload: unknown): Promise<ActivityEvent | null> => {
    const activeSessionId = sessionId || room?.currentSessionId;
    if (!activeSessionId) return null;

    if (!user || !supabase || activeSessionId.startsWith('mock-')) {
      const mockSeq = lastSequenceRef.current + 1;
      const mockEvt: ActivityEvent = {
        id: crypto.randomUUID(),
        sequence: mockSeq,
        schemaVersion: 1,
        senderId: user?.id || 'local-user',
        type,
        payload,
        clientCreatedAt: null,
        createdAt: new Date().toISOString(),
      };
      dispatchEvent(mockEvt);
      return mockEvt;
    }

    try {
      const result = await rpcAppendActivityEvent(activeSessionId, type, payload, revision || undefined);
      if (!result.accepted) return null;

      setRevision(result.revision);
      // The database owns event IDs and ordering. Re-fetch instead of inventing a
      // client event, which previously allowed one action to be delivered twice.
      await recover(lastSequenceRef.current);
      return null;
    } catch (err) {
      console.error('Failed to append activity event:', err);
      return null;
    }
  };

  const completeActivityHandler = async (resultSnapshot: Record<string, unknown>) => {
    const activeSessionId = sessionId || room?.currentSessionId;
    if (!activeSessionId) return;
    setSessionState('completed');
    if (activeSessionId.startsWith('mock-')) return;
    await rpcCompleteActivitySession(activeSessionId, resultSnapshot);
  };

  const setPausedHandler = async (paused: boolean) => {
    const activeSessionId = sessionId || room?.currentSessionId;
    if (!activeSessionId) return;
    setSessionState(paused ? 'paused' : 'active');
    if (activeSessionId.startsWith('mock-')) return;
    const updated = await rpcSetActivityPaused(activeSessionId, paused);
    setSession(updated);
  };

  const value = useMemo<ActivitySessionContextValue>(
    () => ({
      session,
      sessionId,
      activityType,
      revision,
      lastSequence,
      events,
      lastEvent,
      loading,
      isReplaying,
      serverTimeOffset,
      sessionState,
      recoveryState,
      getServerNow,
      startActivity: startActivityHandler,
      sendEvent: sendEventHandler,
      sendTransient,
      recover,
      completeActivity: completeActivityHandler,
      setPaused: setPausedHandler,
      registerEventHandler,
      registerTransientHandler,
    }),
    [
      session,
      sessionId,
      activityType,
      revision,
      lastSequence,
      events,
      lastEvent,
      loading,
      isReplaying,
      serverTimeOffset,
      sessionState,
      recoveryState,
      getServerNow,
      startActivityHandler,
      sendEventHandler,
      sendTransient,
      recover,
      completeActivityHandler,
      setPausedHandler,
      registerEventHandler,
      registerTransientHandler,
    ]
  );

  return <ActivitySessionContext.Provider value={value}>{children}</ActivitySessionContext.Provider>;
}

const defaultActivitySessionValue: ActivitySessionContextValue = {
  session: null,
  sessionId: null,
  activityType: null,
  revision: 0,
  lastSequence: 0,
  events: [],
  lastEvent: null,
  loading: false,
  isReplaying: false,
  serverTimeOffset: 0,
  sessionState: 'drafting',
  recoveryState: 'idle',
  getServerNow: () => Date.now(),
  startActivity: async () => ({ sessionId: '', activityType: '' }),
  sendEvent: async () => null,
  sendTransient: () => {},
  recover: async () => {},
  completeActivity: async () => {},
  setPaused: async () => {},
  registerEventHandler: () => () => {},
  registerTransientHandler: () => () => {},
};

export function useActivitySession() {
  const context = useContext(ActivitySessionContext);
  return context || defaultActivitySessionValue;
}

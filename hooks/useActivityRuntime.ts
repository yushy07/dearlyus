'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ActivityRuntime, ActivityTransport } from '@/lib/runtime';
import {
  createActivityRuntime,
  MockActivityTransport,
  SupabaseActivityTransport,
} from '@/lib/runtime';
import { allActivityAdapters } from '@/lib/activity-adapters';
import type {
  RealtimeActivityAdapter,
  StandardSessionState,
  StandardRecoveryState,
  StandardActivityEvent,
} from '@/lib/activity-adapters';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useActiveRoom } from '@/contexts/ActiveRoomContext';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { useRoomPresence } from '@/contexts/PresenceContext';

export interface UseActivityRuntimeOptions<TSnapshot = any> {
  sessionId?: string | null;
  activityType: string;
  userId?: string | null;
  roomId?: string | null;
  transportMode?: 'auto' | 'mock' | 'supabase';
  customTransport?: ActivityTransport<TSnapshot>;
  initialOptions?: Record<string, unknown>;
  enabled?: boolean;
}

export function useActivityRuntime<
  TSnapshot extends Record<string, unknown> = Record<string, unknown>,
>(options: UseActivityRuntimeOptions<TSnapshot>) {
  const activeRoom = useActiveRoom();
  const sharedSession = useActivitySession();
  const { user } = useSupabaseSession();
  const presence = useRoomPresence();
  const {
    sessionId: rawSessionId,
    activityType,
    userId: rawUserId,
    roomId,
    transportMode = 'auto',
    customTransport,
    initialOptions,
    enabled = true,
  } = options;

  const isUuid = (value?: string | null) =>
    Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
  const contextSessionMatches =
    sharedSession.activityType === activityType && isUuid(sharedSession.sessionId);
  const resolvedRoomId = activeRoom.room?.id || (isUuid(roomId) ? roomId! : null);
  const resolvedSessionId = contextSessionMatches
    ? sharedSession.sessionId!
    : isUuid(rawSessionId)
      ? rawSessionId!
      : null;
  const hasRealRoom = Boolean(resolvedRoomId && resolvedSessionId);
  const sessionId = resolvedSessionId || rawSessionId || `local-${activityType}`;
  // Activity setup is intentionally captured once. Pages pass inline option objects,
  // and treating those as a runtime dependency would reset a live local session on
  // every render.
  const initialOptionsRef = useRef(initialOptions);
  const [localUserId] = useState(() => {
    if (typeof window === 'undefined') return 'local-user';
    const key = 'dearly_local_runtime_user_id';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = `local-${crypto.randomUUID()}`;
    sessionStorage.setItem(key, created);
    return created;
  });
  const userId = user?.id || rawUserId || localUserId;

  const adapter = (allActivityAdapters[activityType] ||
    allActivityAdapters.quiz) as RealtimeActivityAdapter<TSnapshot>;

  // Determine transport
  const transport = useMemo<ActivityTransport<TSnapshot>>(() => {
    if (customTransport) return customTransport;

    const isMockExplicit = transportMode === 'mock';
    const useMock =
      isMockExplicit ||
      !isSupabaseConfigured() ||
      (!hasRealRoom &&
        (transportMode === 'auto' ||
          sessionId.startsWith('mock-') ||
          sessionId === 'local-session'));

    if (useMock) {
      return new MockActivityTransport({
        initialSnapshot: adapter.createInitialSnapshot({
          roomCode: roomId || 'mock-room',
          userId,
          options: initialOptionsRef.current,
        }),
      });
    }

    const sbTransport = new SupabaseActivityTransport(resolvedRoomId || '');
    return sbTransport;
  }, [
    customTransport,
    transportMode,
    sessionId,
    resolvedRoomId,
    userId,
    activityType,
    hasRealRoom,
  ]);

  const runtimeRef = useRef<ActivityRuntime<TSnapshot> | null>(null);

  const [snapshot, setSnapshot] = useState<TSnapshot>(() =>
    adapter.createInitialSnapshot({
      roomCode: activeRoom.room?.code || roomId || 'room',
      userId,
      options: initialOptionsRef.current,
    }),
  );

  const [sessionState, setSessionState] =
    useState<StandardSessionState>('drafting');
  const [recoveryState, setRecoveryState] =
    useState<StandardRecoveryState>('idle');
  const [lastEvent, setLastEvent] = useState<StandardActivityEvent | null>(
    null,
  );

  useEffect(() => {
    if (!enabled) return;
    const runtime = createActivityRuntime<TSnapshot>({
      sessionId,
      activityType,
      currentUserId: userId,
      adapter,
      transport,
      initialInput: {
        roomCode: activeRoom.room?.code || roomId || 'room',
        userId,
        options: initialOptionsRef.current,
      },
    });

    runtimeRef.current = runtime;

    const unbindSubscribe = runtime.subscribe((newSnapshot, event) => {
      setSnapshot(newSnapshot);
      setSessionState(runtime.getSessionState());
      if (event) {
        setLastEvent(event);
      }
    });

    const unbindRecovery = runtime.subscribeRecoveryState((state) => {
      setRecoveryState(state);
    });

    void transport.connect(sessionId, userId).then(() => runtime.requestRecovery(0));

    return () => {
      unbindSubscribe();
      unbindRecovery();
      transport.disconnect();
      runtime.destroy();
      runtimeRef.current = null;
    };
  }, [enabled, sessionId, activityType, userId, transport, adapter, roomId, activeRoom.room?.code]);

  const sendEvent = useCallback(async (type: string, payload: unknown) => {
    if (!runtimeRef.current) return null;
    return await runtimeRef.current.sendEvent(type, payload);
  }, []);

  const sendTransient = useCallback((event: string, payload: unknown) => {
    if (!runtimeRef.current) return;
    runtimeRef.current.sendTransient(event, payload);
  }, []);

  const dispatch = useCallback(
    (event: { type: string; payload?: unknown }) =>
      sendEvent(event.type, event.payload ?? {}),
    [sendEvent],
  );

  const partnerPresence: 'offline' | 'online' | 'ready' | 'choosing' | 'writing' | 'drawing' | 'locked' = presence.partnerOnline
    ? presence.partnerInteraction === 'idle'
      ? 'online'
      : presence.partnerInteraction
    : 'offline';

  const requestRecovery = useCallback(async (afterSequence?: number) => {
    if (!runtimeRef.current) return;
    await runtimeRef.current.requestRecovery(afterSequence);
  }, []);

  const completeActivity = useCallback(
    async (resultSnapshot?: Record<string, unknown>) => {
      if (!runtimeRef.current) return null;
      return await runtimeRef.current.completeActivity(resultSnapshot);
    },
    [],
  );

  const setPaused = useCallback(async (paused: boolean) => {
    if (!runtimeRef.current) return;
    await runtimeRef.current.setPaused(paused);
  }, []);

  const subscribeTransient = useCallback(
    (event: string, handler: (payload: unknown) => void) => {
      return (
        runtimeRef.current?.subscribeTransient(event, handler) ?? (() => {})
      );
    },
    [],
  );

  return {
    runtime: runtimeRef.current,
    snapshot,
    sessionState,
    recoveryState,
    lastEvent,
    transportName: transport.name,
    currentUserId: userId,
    sendEvent,
    dispatch,
    sendTransient,
    requestRecovery,
    completeActivity,
    setPaused,
    subscribeTransient,
    privateVault: transport.privateVault,
    roomId: resolvedRoomId || undefined,
    roomCode: activeRoom.room?.code || null,
    sessionId: resolvedSessionId,
    isHost: activeRoom.isHost,
    partnerPresence,
    partnerOnline: presence.partnerOnline,
  };
}

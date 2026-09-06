'use client';

import type {
  ActivityRuntime,
  ActivityTransport,
  PrivateVault,
} from './types';
import type {
  StandardSessionState,
  StandardRecoveryState,
  StandardActivityEvent,
  RealtimeActivityAdapter,
  ActivityResult,
  StartActivityInput,
} from '../activity-adapters/types';

export interface CreateActivityRuntimeOptions<TSnapshot = any> {
  sessionId: string;
  activityType: string;
  currentUserId: string;
  adapter: RealtimeActivityAdapter<TSnapshot>;
  transport: ActivityTransport<TSnapshot>;
  initialInput?: StartActivityInput;
}

export function createActivityRuntime<TSnapshot extends Record<string, unknown> = Record<string, unknown>>(
  options: CreateActivityRuntimeOptions<TSnapshot>
): ActivityRuntime<TSnapshot> {
  const { sessionId, activityType, currentUserId, adapter, transport } = options;

  let currentSnapshot: TSnapshot = adapter.createInitialSnapshot(
    options.initialInput || { roomCode: 'local-room', userId: currentUserId }
  );
  let lastSequence = 0;
  let revision = 1;
  let recoveryState: StandardRecoveryState = 'idle';

  const seenEventIds = new Set<string>();
  const listeners = new Set<(snapshot: TSnapshot, event?: StandardActivityEvent) => void>();
  const recoveryListeners = new Set<(state: StandardRecoveryState) => void>();

  const setRecoveryState = (state: StandardRecoveryState) => {
    recoveryState = state;
    recoveryListeners.forEach((l) => l(state));
  };

  const dispatchEvent = (event: StandardActivityEvent) => {
    // 1. Drop duplicate events
    if (event.id && seenEventIds.has(event.id)) {
      return;
    }
    if (event.id) {
      seenEventIds.add(event.id);
    }

    // 2. Detect sequence gaps and trigger recovery
    if (event.sequence > lastSequence + 1 && lastSequence > 0) {
      console.warn(
        `[ActivityRuntime] Event gap detected: lastSequence=${lastSequence}, incoming=${event.sequence}. Triggering replay recovery.`
      );
      void requestRecovery(lastSequence);
    }

    lastSequence = Math.max(lastSequence, event.sequence);
    revision += 1;

    // 3. Validate and reduce into current snapshot
    const validation = adapter.validateEvent(event as any);
    if (!validation.valid) {
      console.warn(`[ActivityRuntime] Rejected invalid event '${event.type}':`, validation.message);
      return;
    }

    currentSnapshot = adapter.reduce(currentSnapshot, event as any);
    transport.updateSnapshot?.(currentSnapshot, lastSequence);

    // 4. Notify subscribers
    listeners.forEach((listener) => {
      try {
        listener(currentSnapshot, event);
      } catch (err) {
        console.error('[ActivityRuntime] Error in subscriber listener:', err);
      }
    });
  };

  // Wire transport event subscription
  const unbindEvent = transport.onEvent(dispatchEvent);
  const unbindRecovery = transport.onRecoveryStateChange?.((state) => {
    setRecoveryState(state);
  });

  const sendEvent = async (type: string, payload: unknown): Promise<StandardActivityEvent | null> => {
    const actionAllowed = adapter.canTransition(currentSnapshot, type, currentUserId);
    if (!actionAllowed) {
      console.warn(`[ActivityRuntime] Transition '${type}' rejected by adapter transition rules.`);
      return null;
    }
    return await transport.sendEvent(type, payload, revision);
  };

  const sendTransient = (event: string, payload: unknown): void => {
    transport.sendTransient(event, payload);
  };

  const requestRecovery = async (afterSequence = 0): Promise<void> => {
    setRecoveryState('replaying_missed_events');
    try {
      const recovered = await transport.requestRecovery(afterSequence);
      if (recovered) {
        if (recovered.snapshot && afterSequence === 0) {
          currentSnapshot = recovered.snapshot;
          const recoveredSequence = Number(recovered.lastSequence ?? (recovered.snapshot as any).lastSequence ?? 0);
          lastSequence = Math.max(lastSequence, recoveredSequence);
        }
        if (Array.isArray(recovered.events)) {
          recovered.events.forEach((evt) => dispatchEvent(evt));
        }
      }
      setRecoveryState('recovered');
    } catch (err) {
      setRecoveryState('unrecoverable_error');
      console.error('[ActivityRuntime] Recovery failed:', err);
    }
  };

  const completeActivity = async (resultSnapshot?: Record<string, unknown>): Promise<ActivityResult> => {
    const finalSnapshot = {
      ...currentSnapshot,
      ...resultSnapshot,
      status: 'completed' as StandardSessionState,
      completed: true,
    };
    currentSnapshot = finalSnapshot as TSnapshot;
    await transport.completeSession(finalSnapshot);

    listeners.forEach((l) => l(currentSnapshot));
    return adapter.summarize(currentSnapshot);
  };

  const setPaused = async (paused: boolean): Promise<void> => {
    await transport.setPaused(paused);
  };

  const subscribe = (listener: (snapshot: TSnapshot, event?: StandardActivityEvent) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const subscribeTransient = (event: string, listener: (payload: any) => void): (() => void) => {
    return transport.onTransient(event, listener);
  };

  const subscribeRecoveryState = (listener: (state: StandardRecoveryState) => void): (() => void) => {
    recoveryListeners.add(listener);
    return () => recoveryListeners.delete(listener);
  };

  const destroy = () => {
    unbindEvent();
    unbindRecovery?.();
    listeners.clear();
    recoveryListeners.clear();
  };

  return {
    sessionId,
    activityType,
    adapter,
    currentUserId,
    getSnapshot: () => currentSnapshot,
    getSessionState: () => (currentSnapshot.status as StandardSessionState) || 'drafting',
    getRecoveryState: () => recoveryState,
    getLastSequence: () => lastSequence,
    getRevision: () => revision,
    sendEvent,
    sendTransient,
    requestRecovery,
    completeActivity,
    setPaused,
    subscribe,
    subscribeTransient,
    subscribeRecoveryState,
    privateVault: transport.privateVault,
    destroy,
  };
}

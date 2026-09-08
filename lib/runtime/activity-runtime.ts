'use client';

import type { ActivityRuntime, ActivityTransport, PrivateVault } from './types';
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

export function createActivityRuntime<
  TSnapshot extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateActivityRuntimeOptions<TSnapshot>,
): ActivityRuntime<TSnapshot> {
  const { sessionId, activityType, currentUserId, adapter, transport } =
    options;

  let currentSnapshot: TSnapshot = adapter.createInitialSnapshot(
    options.initialInput || { roomCode: 'local-room', userId: currentUserId },
  );
  let lastSequence = 0;
  let revision = 1;
  let recoveryState: StandardRecoveryState = 'idle';

  const seenEventIds = new Set<string>();
  const eventBuffer = new Map<number, StandardActivityEvent>();
  const listeners = new Set<
    (snapshot: TSnapshot, event?: StandardActivityEvent) => void
  >();
  const recoveryListeners = new Set<(state: StandardRecoveryState) => void>();

  const setRecoveryState = (state: StandardRecoveryState) => {
    recoveryState = state;
    recoveryListeners.forEach((l) => l(state));
  };

  const applyContiguousEvent = (evt: StandardActivityEvent) => {
    if (evt.id) {
      seenEventIds.add(evt.id);
    }
    lastSequence = evt.sequence;
    revision += 1;

    currentSnapshot = adapter.reduce(currentSnapshot, evt as any);
    transport.updateSnapshot?.(currentSnapshot, lastSequence);

    listeners.forEach((listener) => {
      try {
        listener(currentSnapshot, evt);
      } catch (err) {
        console.error('[ActivityRuntime] Error in subscriber listener:', err);
      }
    });
  };

  const dispatchEvent = (event: StandardActivityEvent) => {
    // 1. Validate event schema and domain rules FIRST before any mutation
    const validation = adapter.validateEvent(event as any);
    if (!validation.valid) {
      console.warn(
        `[ActivityRuntime] Rejected invalid event '${event.type}':`,
        validation.message,
      );
      return;
    }

    // 2. Drop duplicate events (by ID or obsolete sequence)
    if (event.id && seenEventIds.has(event.id)) {
      return;
    }
    if (lastSequence > 0 && event.sequence <= lastSequence) {
      return;
    }

    // 3. Detect sequence gaps: buffer out-of-order events instead of prematurely applying them
    const expectedSequence = lastSequence + 1;
    if (event.sequence > expectedSequence) {
      console.warn(
        `[ActivityRuntime] Event gap detected: lastSequence=${lastSequence}, expected=${expectedSequence}, incoming=${event.sequence}. Buffering and triggering recovery.`,
      );
      eventBuffer.set(event.sequence, event);
      if (event.id) {
        seenEventIds.add(event.id);
      }
      void requestRecovery(lastSequence);
      return;
    }

    // 4. Apply contiguous event and drain buffered events sequentially
    applyContiguousEvent(event);

    while (eventBuffer.has(lastSequence + 1)) {
      const nextSeq = lastSequence + 1;
      const nextEvt = eventBuffer.get(nextSeq)!;
      eventBuffer.delete(nextSeq);
      applyContiguousEvent(nextEvt);
    }
  };

  // Wire transport event subscription
  const unbindEvent = transport.onEvent(dispatchEvent);
  const unbindRecovery = transport.onRecoveryStateChange?.((state) => {
    setRecoveryState(state);
  });

  const sendEvent = async (
    type: string,
    payload: unknown,
  ): Promise<StandardActivityEvent | null> => {
    const actionAllowed = adapter.canTransition(
      currentSnapshot,
      type,
      currentUserId,
    );
    if (!actionAllowed) {
      console.warn(
        `[ActivityRuntime] Transition '${type}' rejected by adapter transition rules.`,
      );
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
          const recoveredSequence = Number(
            recovered.lastSequence ??
              (recovered.snapshot as any).lastSequence ??
              0,
          );
          lastSequence = Math.max(lastSequence, recoveredSequence);
        }
        if (Array.isArray(recovered.events)) {
          const sorted = [...recovered.events].sort(
            (a, b) => a.sequence - b.sequence,
          );
          sorted.forEach((evt) => dispatchEvent(evt));
        }
      }
      setRecoveryState('recovered');
    } catch (err) {
      setRecoveryState('unrecoverable_error');
      console.error('[ActivityRuntime] Recovery failed:', err);
    }
  };

  const completeActivity = async (
    resultSnapshot?: Record<string, unknown>,
  ): Promise<ActivityResult> => {
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

  const subscribe = (
    listener: (snapshot: TSnapshot, event?: StandardActivityEvent) => void,
  ): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const subscribeTransient = (
    event: string,
    listener: (payload: any) => void,
  ): (() => void) => {
    return transport.onTransient(event, listener);
  };

  const subscribeRecoveryState = (
    listener: (state: StandardRecoveryState) => void,
  ): (() => void) => {
    recoveryListeners.add(listener);
    return () => recoveryListeners.delete(listener);
  };

  const destroy = () => {
    unbindEvent();
    unbindRecovery?.();
    eventBuffer.clear();
    listeners.clear();
    recoveryListeners.clear();
  };

  return {
    sessionId,
    activityType,
    adapter,
    currentUserId,
    getSnapshot: () => currentSnapshot,
    getSessionState: () =>
      (currentSnapshot.status as StandardSessionState) || 'drafting',
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

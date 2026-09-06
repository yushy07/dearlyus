'use client';

import type {
  ActivityTransport,
  PrivateVault,
  PrivateLockResult,
  PrivateRevealResult,
  PrivateAnswerRecord,
} from './types';
import type {
  StandardActivityEvent,
  StandardRecoveryState,
} from '../activity-adapters/types';

/**
 * Shared in-memory session bus for local development and deterministic multi-client tests.
 */
interface BusSessionState {
  events: StandardActivityEvent[];
  lastSequence: number;
  revision: number;
  snapshot: any;
  snapshotSequence: number;
  paused: boolean;
  completed: boolean;
  privateAnswers: Map<number, Map<string, unknown>>; // round -> (userId -> answer)
  subscribers: Set<MockActivityTransport>;
}

const activeBuses = new Map<string, BusSessionState>();

export function getOrCreateBus(sessionId: string, initialSnapshot?: any): BusSessionState {
  if (!activeBuses.has(sessionId)) {
    activeBuses.set(sessionId, {
      events: [],
      lastSequence: 0,
      revision: 1,
      snapshot: initialSnapshot ?? {},
      snapshotSequence: 0,
      paused: false,
      completed: false,
      privateAnswers: new Map(),
      subscribers: new Set(),
    });
  }
  return activeBuses.get(sessionId)!;
}

export function clearMockBuses() {
  activeBuses.clear();
}

export interface MockTransportOptions {
  simulatedDelayMs?: number;
  dropNextEvent?: boolean;
  duplicateNextEvent?: boolean;
  initialSnapshot?: any;
}

const browserStoragePrefix = 'dearly_mock_activity_bus:';
const browserVaultPrefix = 'dearly_mock_activity_vault:';

function isBrowserTransport() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readBrowserBus(sessionId: string, initialSnapshot?: unknown): BusSessionState {
  const key = `${browserStoragePrefix}${sessionId}`;
  const raw = window.localStorage.getItem(key);
  if (raw) {
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      privateAnswers: new Map(),
      subscribers: new Set(),
      snapshotSequence: Number(parsed.snapshotSequence ?? 0),
    } as BusSessionState;
  }
  const fresh: BusSessionState = {
    events: [], lastSequence: 0, revision: 1, snapshot: initialSnapshot ?? {}, snapshotSequence: 0,
    paused: false, completed: false, privateAnswers: new Map(), subscribers: new Set(),
  };
  writeBrowserBus(sessionId, fresh);
  return fresh;
}

function writeBrowserBus(sessionId: string, state: BusSessionState) {
  const key = `${browserStoragePrefix}${sessionId}`;
  window.localStorage.setItem(key, JSON.stringify({
    events: state.events, lastSequence: state.lastSequence, revision: state.revision,
    snapshot: state.snapshot, snapshotSequence: state.snapshotSequence,
    paused: state.paused, completed: state.completed,
  }));
}

export class MockActivityTransport implements ActivityTransport {
  public readonly name = 'mock' as const;
  private sessionId: string = '';
  private currentUserId: string = 'partner-a';
  private eventHandlers = new Set<(event: StandardActivityEvent) => void>();
  private transientHandlers = new Map<string, Set<(payload: any) => void>>();
  private recoveryStateHandlers = new Set<(state: StandardRecoveryState) => void>();
  private options: MockTransportOptions;
  private channel: BroadcastChannel | null = null;

  constructor(options: MockTransportOptions = {}) {
    this.options = options;
  }

  public setOptions(opts: Partial<MockTransportOptions>) {
    this.options = { ...this.options, ...opts };
  }

  public async connect(sessionId: string, currentUserId: string): Promise<void> {
    this.sessionId = sessionId;
    this.currentUserId = currentUserId;
    const bus = getOrCreateBus(sessionId, this.options.initialSnapshot);
    bus.subscribers.add(this);
    if (isBrowserTransport()) {
      readBrowserBus(sessionId, this.options.initialSnapshot);
      this.channel = new BroadcastChannel(`dearly-mock-runtime:${sessionId}`);
      this.channel.onmessage = (message) => {
        const data = message.data;
        if (data?.kind === 'event') this.dispatchIncomingEvent(data.event);
        if (data?.kind === 'transient') this.dispatchIncomingTransient(data.event, data.payload);
      };
    }
    this.notifyRecoveryState('recovered');
  }

  public disconnect(): void {
    if (this.sessionId && activeBuses.has(this.sessionId)) {
      const bus = activeBuses.get(this.sessionId)!;
      bus.subscribers.delete(this);
    }
    this.eventHandlers.clear();
    this.transientHandlers.clear();
    this.recoveryStateHandlers.clear();
    this.channel?.close();
    this.channel = null;
  }

  public async sendEvent(
    type: string,
    payload: unknown,
    _expectedRevision?: number
  ): Promise<StandardActivityEvent | null> {
    if (!this.sessionId) throw new Error('Transport not connected to a session.');
    const bus = isBrowserTransport()
      ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
      : getOrCreateBus(this.sessionId);

    if (this.options.dropNextEvent) {
      this.options.dropNextEvent = false;
      return null;
    }

    if (this.options.simulatedDelayMs && this.options.simulatedDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.options.simulatedDelayMs));
    }

    bus.lastSequence += 1;
    bus.revision += 1;

    const event: StandardActivityEvent = {
      id: crypto.randomUUID(),
      sequence: bus.lastSequence,
      schemaVersion: 1,
      senderId: this.currentUserId,
      createdAt: new Date().toISOString(),
      activityType: bus.snapshot?.activityType || 'unknown',
      type,
      payload,
    };

    bus.events.push(event);

    if (isBrowserTransport()) {
      writeBrowserBus(this.sessionId, bus);
      this.dispatchIncomingEvent(event);
      this.channel?.postMessage({ kind: 'event', event });
    } else {
      // Broadcast to all subscribers attached to this in-memory bus.
      bus.subscribers.forEach((client) => client.dispatchIncomingEvent(event));
    }

    if (this.options.duplicateNextEvent) {
      this.options.duplicateNextEvent = false;
      // Send duplicate immediately to test client deduplication
      if (isBrowserTransport()) this.dispatchIncomingEvent(event);
      else bus.subscribers.forEach((client) => client.dispatchIncomingEvent(event));
    }

    return event;
  }

  public sendTransient(event: string, payload: unknown): void {
    if (!this.sessionId) return;
    const bus = isBrowserTransport()
      ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
      : getOrCreateBus(this.sessionId);
    // Broadcast transient to other subscribers (not self)
    if (isBrowserTransport()) this.channel?.postMessage({ kind: 'transient', event, payload });
    else bus.subscribers.forEach((client) => {
      if (client !== this) client.dispatchIncomingTransient(event, payload);
    });
  }

  public async requestRecovery(
    afterSequence = 0
  ): Promise<{ snapshot: any; events: StandardActivityEvent[]; lastSequence?: number } | null> {
    if (!this.sessionId) return null;
    this.notifyRecoveryState('replaying_missed_events');
    const bus = isBrowserTransport()
      ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
      : getOrCreateBus(this.sessionId);

    if (this.options.simulatedDelayMs && this.options.simulatedDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.options.simulatedDelayMs));
    }

    // The retained snapshot already contains all events through snapshotSequence.
    // Replaying those again would double-apply reducers after a refresh.
    const missed = bus.events.filter((e) => e.sequence > Math.max(afterSequence, bus.snapshotSequence));
    this.notifyRecoveryState('recovered');
    return {
      snapshot: bus.snapshot,
      events: missed,
      lastSequence: bus.lastSequence,
    };
  }

  public async completeSession(resultSnapshot: Record<string, unknown>): Promise<void> {
    if (!this.sessionId) return;
    const bus = isBrowserTransport()
      ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
      : getOrCreateBus(this.sessionId);
    bus.completed = true;
    bus.snapshot = { ...bus.snapshot, ...resultSnapshot, completed: true };
    bus.snapshotSequence = bus.lastSequence;
    if (isBrowserTransport()) writeBrowserBus(this.sessionId, bus);
  }

  public updateSnapshot(snapshot: Record<string, unknown>, sequence: number): void {
    if (!this.sessionId) return;
    const bus = isBrowserTransport()
      ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
      : getOrCreateBus(this.sessionId);
    if (sequence >= bus.snapshotSequence) {
      bus.snapshot = structuredClone(snapshot);
      bus.snapshotSequence = sequence;
      if (isBrowserTransport()) writeBrowserBus(this.sessionId, bus);
    }
  }

  public async setPaused(paused: boolean): Promise<void> {
    if (!this.sessionId) return;
    const bus = getOrCreateBus(this.sessionId);
    bus.paused = paused;
  }

  public onEvent(handler: (event: StandardActivityEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  public onTransient(event: string, handler: (payload: any) => void): () => void {
    if (!this.transientHandlers.has(event)) {
      this.transientHandlers.set(event, new Set());
    }
    this.transientHandlers.get(event)!.add(handler);
    return () => {
      this.transientHandlers.get(event)?.delete(handler);
    };
  }

  public onRecoveryStateChange(handler: (state: StandardRecoveryState) => void): () => void {
    this.recoveryStateHandlers.add(handler);
    return () => this.recoveryStateHandlers.delete(handler);
  }

  // Internal dispatch methods
  public dispatchIncomingEvent(event: StandardActivityEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error('Error in mock event handler:', err);
      }
    });
  }

  public dispatchIncomingTransient(event: string, payload: unknown): void {
    const handlers = this.transientHandlers.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error('Error in mock transient handler:', err);
        }
      });
    }
  }

  private notifyRecoveryState(state: StandardRecoveryState): void {
    this.recoveryStateHandlers.forEach((h) => h(state));
  }

  // Private answer vault implementation
  public privateVault: PrivateVault = {
    lockAnswer: async (roundNumber: number, answerPayload: unknown): Promise<PrivateLockResult> => {
      if (!this.sessionId) throw new Error('Transport not connected.');
      const bus = isBrowserTransport()
        ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
        : getOrCreateBus(this.sessionId);

      if (!bus.privateAnswers.has(roundNumber)) {
        bus.privateAnswers.set(roundNumber, new Map());
      }
      const roundMap = bus.privateAnswers.get(roundNumber)!;
      if (isBrowserTransport()) {
        const key = `${browserVaultPrefix}${this.sessionId}:${roundNumber}`;
        const persisted = JSON.parse(window.localStorage.getItem(key) || '{}') as Record<string, unknown>;
        persisted[this.currentUserId] = answerPayload;
        window.localStorage.setItem(key, JSON.stringify(persisted));
        Object.entries(persisted).forEach(([userId, answer]) => roundMap.set(userId, answer));
      } else {
        roundMap.set(this.currentUserId, answerPayload);
      }

      // In Dearly Us date rooms, there are 2 partners. When size >= 2, both are locked.
      const lockedCount = roundMap.size;
      const bothLocked = lockedCount >= 2;

      return {
        locked: true,
        bothLocked,
        lockedCount,
      };
    },

    revealAnswers: async (roundNumber: number): Promise<PrivateRevealResult> => {
      if (!this.sessionId) throw new Error('Transport not connected.');
      const bus = isBrowserTransport()
        ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
        : getOrCreateBus(this.sessionId);
      const roundMap = bus.privateAnswers.get(roundNumber) || new Map();
      if (isBrowserTransport()) {
        const persisted = JSON.parse(window.localStorage.getItem(`${browserVaultPrefix}${this.sessionId}:${roundNumber}`) || '{}') as Record<string, unknown>;
        Object.entries(persisted).forEach(([userId, answer]) => roundMap.set(userId, answer));
      }
      if (roundMap.size < 2) {
        throw new Error('NOT_READY: both partners must lock before answers can be revealed.');
      }

      const answers: PrivateAnswerRecord[] = [];
      roundMap.forEach((answer, userId) => {
        answers.push({
          userId,
          answer,
          lockedAt: new Date().toISOString(),
        });
      });

      return {
        roundNumber,
        answers,
      };
    },

    isLocked: (roundNumber: number, userId?: string): boolean => {
      if (!this.sessionId) return false;
      const bus = isBrowserTransport()
        ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
        : getOrCreateBus(this.sessionId);
      if (isBrowserTransport()) {
        const persisted = JSON.parse(window.localStorage.getItem(`${browserVaultPrefix}${this.sessionId}:${roundNumber}`) || '{}') as Record<string, unknown>;
        if (userId) return Object.hasOwn(persisted, userId);
        return Object.hasOwn(persisted, this.currentUserId);
      }
      const roundMap = bus.privateAnswers.get(roundNumber);
      if (!roundMap) return false;
      const targetUser = userId || this.currentUserId;
      return roundMap.has(targetUser);
    },

    areBothLocked: (roundNumber: number): boolean => {
      if (!this.sessionId) return false;
      const bus = isBrowserTransport()
        ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
        : getOrCreateBus(this.sessionId);
      if (isBrowserTransport()) {
        return Object.keys(JSON.parse(window.localStorage.getItem(`${browserVaultPrefix}${this.sessionId}:${roundNumber}`) || '{}')).length >= 2;
      }
      const roundMap = bus.privateAnswers.get(roundNumber);
      return Boolean(roundMap && roundMap.size >= 2);
    },

    resetRound: (roundNumber: number): void => {
      if (!this.sessionId) return;
      const bus = isBrowserTransport()
        ? readBrowserBus(this.sessionId, this.options.initialSnapshot)
        : getOrCreateBus(this.sessionId);
      bus.privateAnswers.delete(roundNumber);
      if (isBrowserTransport()) window.localStorage.removeItem(`${browserVaultPrefix}${this.sessionId}:${roundNumber}`);
    },
  };
}

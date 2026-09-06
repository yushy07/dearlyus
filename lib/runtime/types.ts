'use client';

import type {
  StandardSessionState,
  StandardRecoveryState,
  StandardActivityEvent,
  RealtimeActivityAdapter,
  ActivityResult,
} from '../activity-adapters/types';

export interface PrivateAnswerRecord {
  userId: string;
  answer: unknown;
  lockedAt: string;
}

export interface PrivateLockResult {
  locked: boolean;
  bothLocked: boolean;
  lockedCount: number;
}

export interface PrivateRevealResult {
  roundNumber: number;
  answers: PrivateAnswerRecord[];
}

export interface PrivateVault {
  lockAnswer: (roundNumber: number, answerPayload: unknown) => Promise<PrivateLockResult>;
  revealAnswers: (roundNumber: number) => Promise<PrivateRevealResult>;
  isLocked: (roundNumber: number, userId?: string) => boolean;
  areBothLocked: (roundNumber: number) => boolean;
  resetRound: (roundNumber: number) => void;
}

export interface ActivityTransport<TSnapshot = any> {
  name: 'mock' | 'supabase';
  connect: (sessionId: string, currentUserId: string) => Promise<void>;
  disconnect: () => void;
  sendEvent: (type: string, payload: unknown, expectedRevision?: number) => Promise<StandardActivityEvent | null>;
  sendTransient: (event: string, payload: unknown) => void;
  requestRecovery: (afterSequence?: number) => Promise<{ snapshot: TSnapshot; events: StandardActivityEvent[]; lastSequence?: number } | null>;
  /** Local transports may retain the last reduced snapshot for deterministic recovery. */
  updateSnapshot?: (snapshot: TSnapshot, sequence: number) => void;
  completeSession: (resultSnapshot: Record<string, unknown>) => Promise<void>;
  setPaused: (paused: boolean) => Promise<void>;
  onEvent: (handler: (event: StandardActivityEvent) => void) => () => void;
  onTransient: (event: string, handler: (payload: any) => void) => () => void;
  onRecoveryStateChange?: (handler: (state: StandardRecoveryState) => void) => () => void;
  privateVault: PrivateVault;
}

export interface ActivityRuntime<TSnapshot = any> {
  readonly sessionId: string;
  readonly activityType: string;
  readonly adapter: RealtimeActivityAdapter<TSnapshot>;
  readonly currentUserId: string;

  getSnapshot: () => TSnapshot;
  getSessionState: () => StandardSessionState;
  getRecoveryState: () => StandardRecoveryState;
  getLastSequence: () => number;
  getRevision: () => number;

  sendEvent: (type: string, payload: unknown) => Promise<StandardActivityEvent | null>;
  sendTransient: (event: string, payload: unknown) => void;
  requestRecovery: (afterSequence?: number) => Promise<void>;
  completeActivity: (resultSnapshot?: Record<string, unknown>) => Promise<ActivityResult>;
  setPaused: (paused: boolean) => Promise<void>;

  subscribe: (listener: (snapshot: TSnapshot, event?: StandardActivityEvent) => void) => () => void;
  subscribeTransient: (event: string, listener: (payload: any) => void) => () => void;
  subscribeRecoveryState: (listener: (state: StandardRecoveryState) => void) => () => void;

  privateVault: PrivateVault;
  destroy: () => void;
}

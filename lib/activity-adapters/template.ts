'use client';

import type {
  StartActivityInput,
  ValidationResult,
  ActivityResult,
  KeepsakeDraft,
  RealtimeActivityEvent,
  RealtimeActivityAdapter,
} from './types';

/**
 * Standard Session States across all Dearly Us collaborative activities.
 */
export type StandardSessionState =
  | 'drafting'
  | 'active'
  | 'locked'
  | 'revealed'
  | 'paused'
  | 'completed'
  | 'expired';

/**
 * Standard Recovery States for activity session synchronization and connection recovery.
 */
export type StandardRecoveryState =
  | 'idle'
  | 'loading_snapshot'
  | 'replaying_missed_events'
  | 'reconnecting'
  | 'recovered'
  | 'unrecoverable_error';

/**
 * Standard event metadata required for every durable event.
 */
export interface StandardEventMetadata {
  /** Unique UUID for deduplication */
  id: string;
  /** Monotonically increasing sequence number */
  sequence: number;
  /** Schema contract version */
  schemaVersion: number;
  /** ID of the user who produced the event */
  senderId: string;
  /** Authoritative server / runtime timestamp (ISO 8601) */
  createdAt: string;
  /** Activity type tag (e.g. 'quiz', 'draw', 'cards') */
  activityType: string;
}

/**
 * Full standard activity event carrying payload and metadata.
 */
export interface StandardActivityEvent<
  TPayload = unknown,
> extends StandardEventMetadata {
  type: string;
  payload: TPayload;
  clientCreatedAt?: string | null;
}

/**
 * Standard Activity Definition Template.
 * Every collaborative activity (Quiz, Draw, Cards, etc.) is defined completely using this structure.
 */
export interface ActivityDefinition<
  TSnapshot extends Record<string, unknown> = Record<string, unknown>,
  TEvent extends RealtimeActivityEvent = RealtimeActivityEvent,
> {
  /** Unique key identifying the activity */
  activityType: string;
  /** Schema version */
  schemaVersion: number;
  /** Factory to construct initial snapshot state */
  initialSnapshot: (input: StartActivityInput) => TSnapshot;
  /** Allow-list of durable event types recorded in session history */
  durableEvents: readonly string[];
  /** Allow-list of transient event types (ephemeral broadcasts like cursor, typing presence) */
  transientEvents: readonly string[];
  /** List of private fields that must never appear in public event payloads */
  privateFields: readonly string[];
  /** Transition guard checking if an action is valid in current state */
  transitionRules: (
    snapshot: TSnapshot,
    action: string,
    userId: string,
  ) => boolean;
  /** Reconnect behavior strategy */
  reconnectBehavior: 'loading_snapshot' | 'replaying_missed_events' | 'hybrid';
  /** Pure state reducer applying a validated event to snapshot */
  reduce: (snapshot: TSnapshot, event: TEvent) => TSnapshot;
  /** Produces finalized summary upon completion */
  summarize: (snapshot: TSnapshot) => ActivityResult;
  /** Optional keepsake draft builder */
  buildKeepsake?: (result: ActivityResult) => KeepsakeDraft | null;
  /** Custom event validator (defaults to checking durableEvents allow-list) */
  validateEvent?: (event: TEvent) => ValidationResult;
}

/**
 * Converts a standard ActivityDefinition into a RealtimeActivityAdapter.
 */
export function createAdapterFromDefinition<
  TSnapshot extends Record<string, unknown>,
  TEvent extends RealtimeActivityEvent,
>(
  definition: ActivityDefinition<TSnapshot, TEvent>,
): RealtimeActivityAdapter<TSnapshot, TEvent> {
  return {
    activityType: definition.activityType,
    schemaVersion: definition.schemaVersion,
    definition: definition as ActivityDefinition<any, any>,
    createInitialSnapshot: (input: StartActivityInput) =>
      definition.initialSnapshot(input),
    validateEvent: (event: TEvent): ValidationResult => {
      // Private-answer values live in the sealed vault. These durable events only
      // synchronize readiness/reveal and are safe for every paired activity.
      if (['answer_locked', 'answers_revealed', 'gentle_skip'].includes(event.type)) {
        return { valid: true };
      }
      if (definition.validateEvent) {
        return definition.validateEvent(event);
      }
      const allowed = definition.durableEvents.includes(event.type);
      if (!allowed) {
        return {
          valid: false,
          code: 'INVALID_EVENT',
          message: `Event '${event.type}' is not allowed for activity '${definition.activityType}'.`,
        };
      }
      return { valid: true };
    },
    reduce: (snapshot: TSnapshot, event: TEvent) =>
      definition.reduce(snapshot, event),
    canTransition: (snapshot: TSnapshot, action: string, userId: string) =>
      definition.transitionRules(snapshot, action, userId),
    summarize: (snapshot: TSnapshot) => definition.summarize(snapshot),
    buildKeepsake: definition.buildKeepsake
      ? (result: ActivityResult) => definition.buildKeepsake!(result)
      : undefined,
  };
}

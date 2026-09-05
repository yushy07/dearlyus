'use client';

export interface StartActivityInput {
  roomCode: string;
  userId: string;
  options?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  code?: string;
  message?: string;
}

export interface ActivityResult {
  activityType: string;
  completed: boolean;
  summary: Record<string, unknown>;
}

export interface KeepsakeDraft {
  kind: 'activity';
  title: string;
  metadata: Record<string, unknown>;
}

export interface RealtimeActivityEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
}

export interface RealtimeActivityAdapter<
  TSnapshot = any,
  TEvent extends RealtimeActivityEvent = RealtimeActivityEvent,
> {
  activityType: string;
  schemaVersion: number;
  createInitialSnapshot(input: StartActivityInput): TSnapshot;
  validateEvent(event: TEvent): ValidationResult;
  reduce(snapshot: TSnapshot, event: TEvent): TSnapshot;
  canTransition(snapshot: TSnapshot, action: string, userId: string): boolean;
  summarize(snapshot: TSnapshot): ActivityResult;
  buildKeepsake?(result: ActivityResult): KeepsakeDraft | null;
}

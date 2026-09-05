export type AccountLifecycleStatus = 'active' | 'suspended' | 'deletion_requested' | 'deleted';
export type CoupleRole = 'owner' | 'partner';
export type InviteStatus = 'active' | 'accepted' | 'revoked' | 'expired';
export type InviteViewState =
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'revoked'
  | 'already_used'
  | 'couple_full'
  | 'self_invite'
  | 'already_connected';
export type RoomStatus = 'lobby' | 'active' | 'paused' | 'completed' | 'expired' | 'cancelled';
export type ActivityStatus = 'preparing' | 'active' | 'waiting' | 'revealing' | 'paused' | 'completed' | 'abandoned';
export type KeepsakeStatus = 'draft' | 'finalized' | 'deleted';

export interface AccountProfile {
  id: string;
  displayName: string;
  city: string;
  timezone: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  accountStatus: AccountLifecycleStatus;
}

export interface SpaceMember {
  id: string;
  displayName: string;
  city: string;
  timezone: string;
  avatarUrl: string | null;
  role: CoupleRole;
}

export interface CoupleInvitation {
  code: string;
  status: InviteStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}

export interface CoupleInvitePreview {
  code: string;
  spaceName: string;
  inviterName: string;
  expiresAt: string;
  state?: InviteViewState;
  isSelfInvite?: boolean;
}

export interface CoupleSpace {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  activeRoomCode: string | null;
  currentRoomId: string | null;
  relationshipMetadata: Record<string, unknown>;
  members: SpaceMember[];
  invite: CoupleInvitation | null;
}

export interface DateRoomMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  ready: boolean;
}

export interface DateRoom {
  id: string;
  code: string;
  coupleId: string;
  hostUserId: string;
  status: RoomStatus;
  currentSessionId: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  lastActivityAt: string;
  members: DateRoomMember[];
}

export interface ActivityEvent<T = unknown> {
  id: string;
  sequence: number;
  schemaVersion: number;
  senderId: string;
  type: string;
  payload: T;
  clientCreatedAt: string | null;
  createdAt: string;
}

export interface ActivitySession<TSnapshot = Record<string, unknown>> {
  sessionId: string;
  activityType: string;
  schemaVersion: number;
  status: ActivityStatus;
  roundNumber: number;
  snapshot: TSnapshot;
  resultSummary: Record<string, unknown>;
  revision: number;
  lastSequence: number;
  startedAt: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  completedAt: string | null;
}

export interface PresenceState {
  userId: string;
  displayName: string;
  roomId: string;
  deviceId: string;
  tabId: string;
  interaction: 'idle' | 'ready' | 'choosing' | 'writing' | 'drawing';
  onlineAt: string;
  lastActiveAt: string;
}

export interface Keepsake {
  id: string;
  kind: 'photostrip' | 'passport' | 'receipt' | 'letter' | 'scrapbook' | 'activity';
  status: KeepsakeStatus;
  title: string;
  previewUrl: string | null;
  activityPath: string | null;
  createdAt: string;
  finalizedAt: string | null;
  caption: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  metadata?: Record<string, unknown> | null;
  publicUrl?: string | null;
}

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
import { getSupabase } from '../supabase';
import {
  recoverActivitySession,
  appendActivityEvent,
  lockPrivateAnswer,
  revealPrivateAnswers,
  completeActivitySession,
  setActivityPaused,
} from '../activity-session';

export class SupabaseActivityTransport implements ActivityTransport {
  public readonly name = 'supabase' as const;
  private sessionId: string = '';
  private currentUserId: string = '';
  private roomId: string = '';
  private eventHandlers = new Set<(event: StandardActivityEvent) => void>();
  private transientHandlers = new Map<string, Set<(payload: any) => void>>();
  private recoveryStateHandlers = new Set<(state: StandardRecoveryState) => void>();
  private roomChannel: any = null;
  private transientChannel: any = null;

  constructor(roomId: string = '') {
    this.roomId = roomId;
  }

  public setRoomId(roomId: string) {
    this.roomId = roomId;
  }

  public async connect(sessionId: string, currentUserId: string): Promise<void> {
    this.sessionId = sessionId;
    this.currentUserId = currentUserId;
    const supabase = getSupabase();
    if (!supabase || !this.roomId) return;

    // Listen to durable room_events table changes
    this.roomChannel = supabase
      .channel(`room-events:${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_events',
          filter: `room_id=eq.${this.roomId}`,
        },
        (change: any) => {
          const row = change.new;
          if (this.sessionId && row.session_id && row.session_id !== this.sessionId) return;

          const event: StandardActivityEvent = {
            id: row.id,
            sequence: Number(row.sequence),
            schemaVersion: Number(row.schema_version || 1),
            senderId: row.sender_id,
            activityType: row.activity_type || 'unknown',
            type: row.event_type,
            payload: row.payload,
            clientCreatedAt: row.client_created_at,
            createdAt: row.created_at,
          };

          this.eventHandlers.forEach((handler) => {
            try {
              handler(event);
            } catch (err) {
              console.error('Error in supabase event handler:', err);
            }
          });
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.notifyRecoveryState('recovered');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.notifyRecoveryState('reconnecting');
        }
      });

    // Listen to ephemeral transient broadcasts (cursors, presence)
    this.transientChannel = supabase
      .channel(`room-transient:${this.roomId}`, {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: '*' }, (message: any) => {
        const { event, payload } = message;
        const handlers = this.transientHandlers.get(event);
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
  }

  public disconnect(): void {
    const supabase = getSupabase();
    if (supabase) {
      if (this.roomChannel) void supabase.removeChannel(this.roomChannel);
      if (this.transientChannel) void supabase.removeChannel(this.transientChannel);
    }
    this.roomChannel = null;
    this.transientChannel = null;
    this.eventHandlers.clear();
    this.transientHandlers.clear();
    this.recoveryStateHandlers.clear();
  }

  public async sendEvent(
    type: string,
    payload: unknown,
    expectedRevision?: number
  ): Promise<StandardActivityEvent | null> {
    if (!this.sessionId) return null;
    try {
      const result = await appendActivityEvent(this.sessionId, type, payload, expectedRevision);
      if (!result.accepted) return null;
      return null; // Event will arrive via postgres_changes subscription
    } catch (err) {
      console.error('Supabase sendEvent failed:', err);
      return null;
    }
  }

  public sendTransient(event: string, payload: unknown): void {
    if (this.transientChannel) {
      this.transientChannel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }

  public async requestRecovery(
    afterSequence = 0
  ): Promise<{ snapshot: any; events: StandardActivityEvent[]; lastSequence?: number } | null> {
    if (!this.sessionId) return null;
    this.notifyRecoveryState('loading_snapshot');
    try {
      const recovery = await recoverActivitySession(this.sessionId, afterSequence);
      if (!recovery) return null;

      const events: StandardActivityEvent[] = (recovery.events || []).map((evt: any) => ({
        id: evt.id,
        sequence: Number(evt.sequence),
        schemaVersion: Number(evt.schemaVersion || 1),
        senderId: evt.senderId,
        activityType: evt.activityType || recovery.activityType || 'unknown',
        type: evt.type,
        payload: evt.payload,
        clientCreatedAt: evt.clientCreatedAt,
        createdAt: evt.createdAt || new Date().toISOString(),
      }));

      this.notifyRecoveryState('recovered');
      return {
        snapshot: recovery.snapshot,
        events,
        lastSequence: Number(recovery.lastSequence ?? 0),
      };
    } catch (err) {
      this.notifyRecoveryState('unrecoverable_error');
      console.error('Supabase requestRecovery failed:', err);
      return null;
    }
  }

  public async completeSession(resultSnapshot: Record<string, unknown>): Promise<void> {
    if (!this.sessionId) return;
    await completeActivitySession(this.sessionId, resultSnapshot);
  }

  public async setPaused(paused: boolean): Promise<void> {
    if (!this.sessionId) return;
    await setActivityPaused(this.sessionId, paused);
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

  private notifyRecoveryState(state: StandardRecoveryState): void {
    this.recoveryStateHandlers.forEach((h) => h(state));
  }

  public privateVault: PrivateVault = {
    lockAnswer: async (roundNumber: number, answerPayload: unknown): Promise<PrivateLockResult> => {
      if (!this.sessionId) throw new Error('Transport not connected.');
      return await lockPrivateAnswer(this.sessionId, roundNumber, answerPayload);
    },

    revealAnswers: async (roundNumber: number): Promise<PrivateRevealResult> => {
      if (!this.sessionId) throw new Error('Transport not connected.');
      const result = await revealPrivateAnswers(this.sessionId, roundNumber);
      return {
        roundNumber: result.roundNumber,
        answers: result.answers as PrivateAnswerRecord[],
      };
    },

    isLocked: () => false,
    areBothLocked: () => false,
    resetRound: () => {},
  };
}

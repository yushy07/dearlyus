'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from './supabase';
import type { PresenceState } from './domain';

export interface RoomEvent<T = any> {
  id: string;
  sender: string;
  type: string;
  payload: T;
  timestamp: number;
  sequence?: number;
}

export type RoomConnectionState = 'idle' | 'connecting' | 'synchronized' | 'reconnecting' | 'unavailable';

export interface UseRoomSyncOptions {
  roomCode: string;
  senderName: string;
  onMessage?: (event: RoomEvent) => void;
  interaction?: 'idle' | 'ready' | 'choosing' | 'writing' | 'drawing';
  pollingIntervalMs?: number;
}

const normalizeCode = (code: string) => code.trim().toUpperCase();
const tabId = crypto.randomUUID();

function getDeviceId() {
  const key = 'dearly-us-device-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export function useRoomSync({ roomCode, senderName, onMessage, interaction = 'idle' }: UseRoomSyncOptions) {
  const [connectionState, setConnectionState] = useState<RoomConnectionState>('idle');
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [lastEvent, setLastEvent] = useState<RoomEvent | null>(null);
  const roomId = useRef<string | null>(null);
  const sessionId = useRef<string | null>(null);
  const userId = useRef<string | null>(null);
  const revision = useRef<number | null>(null);
  const lastSequence = useRef(0);
  const seenIds = useRef(new Set<string>());
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const receive = useCallback((event: RoomEvent) => {
    if (!event.id || event.sender === userId.current || seenIds.current.has(event.id)) return;
    seenIds.current.add(event.id);
    if (event.sequence) lastSequence.current = Math.max(lastSequence.current, event.sequence);
    setLastEvent(event);
    onMessageRef.current?.(event);
  }, []);

  const sendEvent = useCallback(async (type: string, payload: unknown) => {
    const supabase = getSupabase();
    if (!supabase || !roomId.current || !sessionId.current || !userId.current) return null;
    const eventId = crypto.randomUUID();
    const { data, error } = await supabase.rpc('append_activity_event', {
      target_session_id: sessionId.current,
      event_id: eventId,
      event_name: type,
      event_payload: payload ?? {},
      expected_revision: null,
      client_time: new Date().toISOString(),
    });
    if (error || !data?.accepted) return null;
    seenIds.current.add(eventId);
    revision.current = Number(data.revision);
    lastSequence.current = Number(data.sequence);
    return { id: eventId, sender: userId.current, type, payload, timestamp: Date.now(), sequence: Number(data.sequence) } as RoomEvent;
  }, []);

  useEffect(() => {
    const code = normalizeCode(roomCode);
    const supabase = getSupabase();
    if (!supabase || !code) {
      setConnectionState('idle');
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;
    setConnectionState('connecting');

    const start = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !active) {
        setConnectionState('unavailable');
        return;
      }

      userId.current = auth.user.id;
      const { data: joined, error: joinError } = await supabase.rpc('join_date_room', { room_code: code });
      if (joinError || !joined?.id || !active) {
        setConnectionState('unavailable');
        return;
      }

      roomId.current = joined.id;
      sessionId.current = joined.currentSessionId || null;

      if (sessionId.current) {
        const { data: recovery } = await supabase.rpc('get_session_recovery', {
          target_session_id: sessionId.current,
          after_sequence: 0,
        });
        if (recovery && active) {
          revision.current = Number(recovery.revision ?? 0);
          lastSequence.current = Number(recovery.lastSequence ?? 0);
          const events = Array.isArray(recovery.events) ? recovery.events : [];
          events.forEach((event: any) => receive({
            id: event.id,
            sender: event.senderId,
            type: event.type,
            payload: event.payload,
            timestamp: new Date(event.createdAt).getTime(),
            sequence: Number(event.sequence),
          }));
        }
      }

      channel = supabase
        .channel(`room:${joined.id}`, { config: { presence: { key: auth.user.id } } })
        .on('presence', { event: 'sync' }, () => {
          if (!channel || !active) return;
          const state = channel.presenceState() as Record<string, PresenceState[]>;
          const onlineIds = Object.values(state).flat().map((presence) => presence.userId).filter(Boolean);
          setPartnerOnline(onlineIds.some((id) => id !== auth.user!.id));
        })
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'room_events', filter: `room_id=eq.${joined.id}`,
        }, (change: any) => {
          const row = change.new;
          if (sessionId.current && row.session_id && row.session_id !== sessionId.current) return;
          receive({
            id: row.id,
            sender: row.sender_id,
            type: row.event_type,
            payload: row.payload,
            timestamp: new Date(row.created_at).getTime(),
            sequence: row.sequence ? Number(row.sequence) : undefined,
          });
        })
        .subscribe(async (status) => {
          if (!active || !channel) return;
          if (status === 'SUBSCRIBED') {
            const now = new Date().toISOString();
            await channel.track({
              userId: auth.user!.id,
              displayName: senderName.slice(0, 60),
              roomId: joined.id,
              deviceId: getDeviceId(),
              tabId,
              interaction,
              onlineAt: now,
              lastActiveAt: now,
            } satisfies PresenceState);
            setConnectionState('synchronized');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionState('reconnecting');
          } else if (status === 'CLOSED') {
            setConnectionState('unavailable');
          }
        });
    };

    void start();
    return () => {
      active = false;
      setPartnerOnline(false);
      setConnectionState('idle');
      if (channel) void supabase.removeChannel(channel);
      roomId.current = null;
      sessionId.current = null;
      userId.current = null;
    };
  }, [interaction, receive, roomCode, senderName]);

  return {
    isConnected: connectionState === 'synchronized',
    connectionState,
    partnerOnline,
    lastEvent,
    sendEvent,
  };
}

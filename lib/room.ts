'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from './supabase';

export interface RoomEvent<T = any> { id: string; sender: string; type: string; payload: T; timestamp: number; }
export interface UseRoomSyncOptions { roomCode: string; senderName: string; onMessage?: (event: RoomEvent) => void; pollingIntervalMs?: number; }
const normalizeCode = (code: string) => code.trim().toUpperCase();

export function useRoomSync({ roomCode, senderName, onMessage }: UseRoomSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [lastEvent, setLastEvent] = useState<RoomEvent | null>(null);
  const roomId = useRef<string | null>(null);
  const userId = useRef<string | null>(null);
  const seenIds = useRef(new Set<string>());
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const receive = useCallback((event: RoomEvent) => {
    if (!event.id || event.sender === userId.current || seenIds.current.has(event.id)) return;
    seenIds.current.add(event.id);
    setPartnerOnline(true); setLastEvent(event); onMessageRef.current?.(event);
  }, [senderName]);

  const sendEvent = useCallback(async (type: string, payload: unknown) => {
    const supabase = getSupabase();
    if (!supabase || !roomId.current || !userId.current) return null;
    const event: RoomEvent = { id: crypto.randomUUID(), sender: senderName, type, payload, timestamp: Date.now() };
    seenIds.current.add(event.id);
    const { error } = await supabase.from('room_events').insert({
      id: event.id, room_id: roomId.current, sender_id: userId.current, event_type: type, payload,
      created_at: new Date(event.timestamp).toISOString(),
    });
    return error ? null : event;
  }, [senderName]);

  useEffect(() => {
    const code = normalizeCode(roomCode); const supabase = getSupabase();
    if (!supabase || !code) return;
    let channel: ReturnType<typeof supabase.channel> | null = null; let active = true;
    const start = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !active) return;
      userId.current = auth.user.id;
      const joined = await supabase.rpc('join_room_by_code', { room_code: code });
      if (joined.error) {
        const created = await supabase.rpc('create_room', { room_code: code });
        if (created.error) return;
      }
      const { data: room } = await supabase.from('rooms').select('id').eq('code', code).single();
      if (!room?.id || !active) return;
      roomId.current = room.id;
      const { data: history } = await supabase.from('room_events').select('id, event_type, payload, created_at, sender_id').eq('room_id', room.id).order('created_at', { ascending: false }).limit(30);
      history?.reverse().forEach((row: any) => receive({ id: row.id, sender: row.sender_id, type: row.event_type, payload: row.payload, timestamp: new Date(row.created_at).getTime() }));
      channel = supabase.channel(`room:${room.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_events', filter: `room_id=eq.${room.id}` }, (change: any) => {
        const row = change.new; receive({ id: row.id, sender: row.sender_id, type: row.event_type, payload: row.payload, timestamp: new Date(row.created_at).getTime() });
      }).subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    };
    start();
    return () => { active = false; if (channel) supabase.removeChannel(channel); roomId.current = null; };
  }, [roomCode, receive]);
  return { isConnected, partnerOnline, lastEvent, sendEvent };
}

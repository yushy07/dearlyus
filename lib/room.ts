'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface RoomEvent<T = any> {
  id: string;
  sender: string;
  type: string;
  payload: T;
  timestamp: number;
}

export interface UseRoomSyncOptions {
  roomCode: string;
  senderName: string;
  onMessage?: (event: RoomEvent) => void;
  pollingIntervalMs?: number;
}

export function useRoomSync({
  roomCode,
  senderName,
  onMessage,
  pollingIntervalMs = 650,
}: UseRoomSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [lastEvent, setLastEvent] = useState<RoomEvent | null>(null);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const lastTimestampRef = useRef<number>(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const normalizedCode = (roomCode || 'LOVE').toUpperCase();

  // Process inbound event and prevent echo or duplicates
  const handleInboundEvent = useCallback((event: RoomEvent) => {
    if (!event || !event.id) return;
    if (event.sender === senderName) return; // ignore self-echoes
    if (seenMessageIdsRef.current.has(event.id)) return;

    seenMessageIdsRef.current.add(event.id);
    // Keep set bounded
    if (seenMessageIdsRef.current.size > 200) {
      const arr = Array.from(seenMessageIdsRef.current).slice(100);
      seenMessageIdsRef.current = new Set(arr);
    }

    setPartnerOnline(true);
    setLastEvent(event);
    onMessageRef.current?.(event);
  }, [senderName]);

  // Send an event via both BroadcastChannel (0ms local) and API relay (remote)
  const sendEvent = useCallback(
    async (type: string, payload: any) => {
      const event: RoomEvent = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: senderName,
        type,
        payload,
        timestamp: Date.now(),
      };

      seenMessageIdsRef.current.add(event.id);

      // 1. BroadcastChannel for local tabs
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage(event);
        } catch {}
      }

      // 2. Cross-device API relay
      try {
        await fetch(`/api/room/${normalizedCode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch {}

      return event;
    },
    [normalizedCode, senderName]
  );

  // Setup BroadcastChannel and Polling Relay
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsConnected(true);
    lastTimestampRef.current = Date.now() - 5000;

    // 1. Local BroadcastChannel
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(`angie_room_${normalizedCode}`);
        channel.onmessage = (ev) => {
          if (ev.data) handleInboundEvent(ev.data);
        };
        broadcastChannelRef.current = channel;
      } catch {}
    }

    // 2. Announce presence
    sendEvent('presence_ping', { status: 'online' });

    // 3. Remote Relay Polling
    let isMounted = true;
    const pollRelay = async () => {
      if (!isMounted) return;
      try {
        const res = await fetch(`/api/room/${normalizedCode}?since=${lastTimestampRef.current}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach((msg: RoomEvent) => {
              if (msg.timestamp > lastTimestampRef.current) {
                lastTimestampRef.current = msg.timestamp;
              }
              handleInboundEvent(msg);
            });
          }
        }
      } catch {}
      if (isMounted) {
        pollTimerRef.current = setTimeout(pollRelay, pollingIntervalMs);
      }
    };

    pollRelay();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [normalizedCode, handleInboundEvent, pollingIntervalMs, sendEvent]);

  return {
    isConnected,
    partnerOnline,
    lastEvent,
    sendEvent,
  };
}

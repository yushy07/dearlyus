'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useSupabaseSession } from './SupabaseSessionContext';
import { useCoupleSpace } from './CoupleSpaceContext';
import {
  type DateRoom,
  createDateRoom as rpcCreateDateRoom,
  joinDateRoom as rpcJoinDateRoom,
  leaveDateRoom as rpcLeaveDateRoom,
  rotateDateRoomCode as rpcRotateDateRoomCode,
  setDateRoomReady as rpcSetDateRoomReady,
} from '@/lib/account';

export interface ActiveRoomContextValue {
  room: DateRoom | null;
  roomCode: string | null;
  isHost: boolean;
  loading: boolean;
  error: string | null;
  createRoom: () => Promise<DateRoom>;
  joinRoom: (code: string) => Promise<DateRoom>;
  leaveRoom: () => Promise<void>;
  rotateRoomCode: () => Promise<DateRoom>;
  setReady: (ready: boolean) => Promise<void>;
  refreshRoom: () => Promise<DateRoom | null>;
}

const ActiveRoomContext = createContext<ActiveRoomContextValue | null>(null);

export function ActiveRoomProvider({
  children,
  initialRoomCode,
}: {
  children: React.ReactNode;
  initialRoomCode?: string;
}) {
  const { user, supabase } = useSupabaseSession();
  const { space } = useCoupleSpace();
  const [room, setRoom] = useState<DateRoom | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(initialRoomCode));
  const [error, setError] = useState<string | null>(null);

  const activeCode =
    initialRoomCode || room?.code || space?.activeRoomCode || null;

  const refreshRoom = useCallback(async () => {
    if (!activeCode || !user) {
      setLoading(false);
      return null;
    }

    try {
      setError(null);
      // STRICT JOIN: Never falls back to creating a room if joining fails!
      const currentRoom = await rpcJoinDateRoom(activeCode);
      setRoom(currentRoom);
      return currentRoom;
    } catch (err: any) {
      const msg = err?.message || 'Failed to join room.';
      setError(msg);
      setRoom(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeCode, user]);

  useEffect(() => {
    if (initialRoomCode) {
      void refreshRoom();
    }
  }, [initialRoomCode, refreshRoom]);

  // Realtime subscription to room changes & member ready states
  useEffect(() => {
    if (!supabase || !room?.id) return;

    const roomId = room.id;
    const channel = supabase
      .channel(`active-room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        () => {
          void refreshRoom();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          void refreshRoom();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, room?.id, refreshRoom]);

  const createRoomHandler = async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await rpcCreateDateRoom();
      setRoom(created);
      return created;
    } catch (err: any) {
      const msg = err?.message || 'Failed to create room.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinRoomHandler = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      // STRICT JOIN: No client creation fallback!
      const joined = await rpcJoinDateRoom(code);
      setRoom(joined);
      return joined;
    } catch (err: any) {
      const msg = err?.message || 'Room not found or unauthorized.';
      setError(msg);
      setRoom(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoomHandler = async () => {
    if (!room) return;
    try {
      await rpcLeaveDateRoom(room.code);
    } finally {
      setRoom(null);
    }
  };

  const rotateRoomCodeHandler = async () => {
    if (!room) throw new Error('No active room to rotate.');
    const rotated = await rpcRotateDateRoomCode(room.code);
    setRoom(rotated);
    return rotated;
  };

  const setReadyHandler = async (ready: boolean) => {
    if (!room) return;
    const updated = await rpcSetDateRoomReady(room.code, ready);
    setRoom(updated);
  };

  const isHost = useMemo(() => {
    if (!room || !user) return false;
    return room.hostUserId === user.id;
  }, [room, user]);

  const value = useMemo<ActiveRoomContextValue>(
    () => ({
      room,
      roomCode: room?.code ?? activeCode,
      isHost,
      loading,
      error,
      createRoom: createRoomHandler,
      joinRoom: joinRoomHandler,
      leaveRoom: leaveRoomHandler,
      rotateRoomCode: rotateRoomCodeHandler,
      setReady: setReadyHandler,
      refreshRoom,
    }),
    [room, activeCode, isHost, loading, error, refreshRoom],
  );

  return (
    <ActiveRoomContext.Provider value={value}>
      {children}
    </ActiveRoomContext.Provider>
  );
}

const defaultActiveRoomValue: ActiveRoomContextValue = {
  room: null,
  roomCode: null,
  isHost: false,
  loading: false,
  error: null,
  createRoom: async () => ({}) as any,
  joinRoom: async () => ({}) as any,
  leaveRoom: async () => {},
  rotateRoomCode: async () => ({}) as any,
  setReady: async () => {},
  refreshRoom: async () => null,
};

export function useActiveRoom() {
  const context = useContext(ActiveRoomContext);
  return context || defaultActiveRoomValue;
}

'use client';

import { useEffect, useCallback } from 'react';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useRoomPresence } from '@/contexts/PresenceContext';

export function useSessionRecovery() {
  const { sessionId, lastSequence, recover, isReplaying } =
    useActivitySession();
  const { connectionState } = useRoomPresence();

  const handleReconnect = useCallback(async () => {
    if (!sessionId) return;
    await recover(lastSequence);
  }, [sessionId, lastSequence, recover]);

  // When connection transitions from reconnecting to synchronized, perform catchup replay
  useEffect(() => {
    if (connectionState === 'synchronized' && sessionId && lastSequence > 0) {
      void handleReconnect();
    }
  }, [connectionState, sessionId, handleReconnect]);

  // Window focus or resume from sleep
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionId) {
        void handleReconnect();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, handleReconnect]);

  return {
    replaying: isReplaying,
    lastSequence,
    manualRecover: handleReconnect,
  };
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import type { ActivityEvent } from '@/lib/domain';

export interface UseRealtimeEventsOptions {
  filterType?: string | string[];
  onEvent?: (event: ActivityEvent) => void;
}

export function useRealtimeEvents({
  filterType,
  onEvent,
}: UseRealtimeEventsOptions = {}) {
  const { events, lastEvent, sendEvent, registerEventHandler } =
    useActivitySession();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const matchesFilter = useCallback(
    (type: string) => {
      if (!filterType) return true;
      if (Array.isArray(filterType)) {
        return filterType.some((ft) => type === ft || type.startsWith(ft));
      }
      return type === filterType || type.startsWith(filterType);
    },
    [filterType],
  );

  useEffect(() => {
    const unregister = registerEventHandler((event) => {
      if (matchesFilter(event.type)) {
        onEventRef.current?.(event);
      }
    });
    return unregister;
  }, [registerEventHandler, matchesFilter]);

  const emit = useCallback(
    async (type: string, payload: unknown) => {
      return sendEvent(type, payload);
    },
    [sendEvent],
  );

  const filteredEvents = filterType
    ? events.filter((e) => matchesFilter(e.type))
    : events;

  return {
    events: filteredEvents,
    lastEvent: lastEvent && matchesFilter(lastEvent.type) ? lastEvent : null,
    sendEvent: emit,
  };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';

type Point = { x: number; y: number };

export function useDraggableFixed<T extends HTMLElement>(storageKey: string) {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const drag = useRef({
    active: false,
    pointerId: -1,
    dx: 0,
    dy: 0,
    moved: false,
  });

  const clamp = useCallback((x: number, y: number) => {
    const rect = ref.current?.getBoundingClientRect();
    const width = rect?.width ?? 80;
    const height = rect?.height ?? 80;
    return {
      x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - height - 8)),
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const point = JSON.parse(saved) as Point;
        if (Number.isFinite(point.x) && Number.isFinite(point.y))
          setPosition(clamp(point.x, point.y));
      }
    } catch {
      /* Use the default dock position. */
    }
  }, [clamp, storageKey]);

  useEffect(() => {
    const keepOnScreen = () =>
      setPosition((current) => (current ? clamp(current.x, current.y) : null));
    window.addEventListener('resize', keepOnScreen);
    return () => window.removeEventListener('resize', keepOnScreen);
  }, [clamp]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = {
      active: true,
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current.active || drag.current.pointerId !== event.pointerId)
      return;
    const next = clamp(
      event.clientX - drag.current.dx,
      event.clientY - drag.current.dy,
    );
    drag.current.moved ||=
      Math.abs(event.movementX) + Math.abs(event.movementY) > 2;
    setPosition(next);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current.active || drag.current.pointerId !== event.pointerId)
      return;
    drag.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setPosition((current) => {
      if (current) localStorage.setItem(storageKey, JSON.stringify(current));
      return current;
    });
  };

  const consumeDrag = () => {
    const moved = drag.current.moved;
    drag.current.moved = false;
    return moved;
  };

  const style: CSSProperties = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : {};

  return {
    ref: ref as RefObject<T>,
    style,
    consumeDrag,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}

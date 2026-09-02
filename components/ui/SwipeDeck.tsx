'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '@/lib/sound';

interface SwipeDeckProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SwipeDeck({
  onSwipeLeft,
  onSwipeRight,
  threshold = 90,
  children,
  className = '',
  style,
}: SwipeDeckProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setOffset({ x: dx, y: dy * 0.3 }); // Dampen vertical movement
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    if (offset.x > threshold) {
      // Swiped Right
      setSwiped('right');
      sounds.playSwipe();
      setTimeout(() => {
        onSwipeRight?.();
        setOffset({ x: 0, y: 0 });
        setSwiped(null);
      }, 250);
    } else if (offset.x < -threshold) {
      // Swiped Left
      setSwiped('left');
      sounds.playSwipe();
      setTimeout(() => {
        onSwipeLeft?.();
        setOffset({ x: 0, y: 0 });
        setSwiped(null);
      }, 250);
    } else {
      // Spring back to center
      setOffset({ x: 0, y: 0 });
    }
  };

  const rotation = offset.x * 0.08;
  const opacity = 1 - Math.min(Math.abs(offset.x) / 350, 0.4);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={className}
      style={{
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: swiped === 'right'
          ? 'translateX(450px) rotate(25deg)'
          : swiped === 'left'
          ? 'translateX(-450px) rotate(-25deg)'
          : `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg)`,
        opacity: swiped ? 0 : opacity,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease',
        willChange: 'transform, opacity',
        ...style,
      }}
    >
      {/* Swipe Overlay Hint Badges */}
      {offset.x > 30 && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 30,
            background: 'rgba(78, 204, 163, 0.95)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '999px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(78, 204, 163, 0.4)',
            pointerEvents: 'none',
            transform: 'rotate(-10deg)',
          }}
        >
          ✓ NEXT ▷
        </div>
      )}

      {offset.x < -30 && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 30,
            background: 'rgba(255, 123, 163, 0.95)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '999px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(255, 123, 163, 0.4)',
            pointerEvents: 'none',
            transform: 'rotate(10deg)',
          }}
        >
          ◁ PASS / SKIP
        </div>
      )}

      {children}
    </div>
  );
}

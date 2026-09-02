'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { sounds } from '@/lib/sound';

interface Particle3D {
  id: string;
  emoji: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  fontSize: number;
  durationMs: number;
  isHero: boolean;
}

const EMOJI_LIST = [
  { emoji: '💖', label: 'Love' },
  { emoji: '💋', label: 'Kiss' },
  { emoji: '✨', label: 'Sparkle' },
  { emoji: '☕', label: 'Warmth' },
  { emoji: '🧸', label: 'Hug' },
  { emoji: '🔥', label: 'Spicy' },
];

export function ReactionBursts() {
  const [particles, setParticles] = useState<Particle3D[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastBurstTime, setLastBurstTime] = useState(0);

  const spawnBurst = useCallback((emoji: string, originX?: number, originY?: number, shouldBroadcast = true) => {
    sounds.playSparkleReaction(emoji);

    const screenW = typeof window !== 'undefined' ? window.innerWidth : 800;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 600;

    const startX = originX ?? screenW / 2;
    const startY = originY ?? screenH - 120;

    const now = Date.now();
    const newParticles: Particle3D[] = [];

    // 1. Giant Hero 3D Particle flying directly towards user's face
    newParticles.push({
      id: `${now}-hero-${Math.random()}`,
      emoji,
      startX,
      startY,
      targetX: (Math.random() - 0.5) * 80,
      targetY: -160 + (Math.random() - 0.5) * 60,
      rotX: (Math.random() - 0.5) * 45,
      rotY: (Math.random() - 0.5) * 45,
      rotZ: (Math.random() - 0.5) * 30,
      fontSize: 44,
      durationMs: 1600,
      isHero: true,
    });

    // 2. 14 Radial 3D Orbiting Sprites exploding in a 360-degree cone towards viewer
    const spriteCount = 14;
    for (let i = 0; i < spriteCount; i++) {
      const angle = (i / spriteCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = Math.random() * 260 + 140;

      // Mix in matching secondary sparkle icons
      const secondaryEmoji = i % 3 === 0 ? '✨' : i % 5 === 0 ? '💖' : emoji;

      newParticles.push({
        id: `${now}-${i}-${Math.random()}`,
        emoji: secondaryEmoji,
        startX,
        startY,
        targetX: Math.cos(angle) * distance,
        targetY: Math.sin(angle) * distance - 60,
        rotX: (Math.random() - 0.5) * 120,
        rotY: (Math.random() - 0.5) * 120,
        rotZ: (Math.random() - 0.5) * 90,
        fontSize: Math.random() * 12 + 24,
        durationMs: Math.random() * 400 + 1400,
        isHero: false,
      });
    }

    setParticles((prev) => [...prev.slice(-45), ...newParticles]);
    setLastBurstTime(Date.now());

    if (shouldBroadcast && typeof window !== 'undefined') {
      try {
        const channel = new BroadcastChannel('angie_reaction_bursts');
        channel.postMessage({ emoji, x: startX, y: startY });
      } catch {}
    }
  }, []);

  // Listen for remote partner reaction broadcasts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const channel = new BroadcastChannel('angie_reaction_bursts');
      channel.onmessage = (e) => {
        if (e.data?.emoji) {
          spawnBurst(e.data.emoji, e.data.x, e.data.y, false);
        }
      };
      return () => channel.close();
    } catch {}
  }, [spawnBurst]);

  // Global Double-Click & Double-Tap anywhere on screen for instant 3D Heart burst
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastTapTime = 0;

    const isInteractive = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toUpperCase();
      if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A'].includes(tag)) return true;
      if (target.closest('button, input, textarea, select, a, [role="button"], .no-heart-burst')) return true;
      return false;
    };

    const handleDblClick = (e: MouseEvent) => {
      if (isInteractive(e.target)) return;
      spawnBurst('💖', e.clientX, e.clientY, true);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      const touch = e.changedTouches[0];
      if (now - lastTapTime < 300 && touch) {
        if (!isInteractive(e.target)) {
          spawnBurst('💖', touch.clientX, touch.clientY, true);
        }
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
    };

    window.addEventListener('dblclick', handleDblClick, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [spawnBurst]);

  // Clean up expired 3D particles
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - lastBurstTime < 2400));
    }, 2200);
    return () => clearTimeout(timer);
  }, [particles, lastBurstTime]);

  return (
    <>
      {/* 3D Flying Outward Particle Canvas Layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'hidden',
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          transformStyle: 'preserve-3d',
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle-3d-element"
            style={{
              position: 'absolute',
              left: `${p.startX}px`,
              top: `${p.startY}px`,
              fontSize: `${p.fontSize}px`,
              userSelect: 'none',
              filter: p.isHero
                ? 'drop-shadow(0 15px 40px rgba(255, 123, 163, 0.95))'
                : 'drop-shadow(0 8px 24px rgba(255, 123, 163, 0.6))',
              // CSS Custom Properties for 3D trajectory
              ['--target-x' as string]: `${p.targetX}px`,
              ['--target-y' as string]: `${p.targetY}px`,
              ['--rot-x' as string]: `${p.rotX}deg`,
              ['--rot-y' as string]: `${p.rotY}deg`,
              ['--rot-z' as string]: `${p.rotZ}deg`,
              ['--duration' as string]: `${p.durationMs}ms`,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Floating Bottom-Left Couple Reaction Dock */}
      <aside
        aria-label="Couple live reactions"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 98,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isExpanded && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 18, 24, 0.92)',
              backdropFilter: 'blur(24px) saturate(190%)',
              WebkitBackdropFilter: 'blur(24px) saturate(190%)',
              border: '1px solid rgba(255, 123, 163, 0.4)',
              borderRadius: '36px',
              padding: '6px 10px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(255, 123, 163, 0.3)',
              animation: 'gl-rise 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {EMOJI_LIST.map((item) => (
              <button
                key={item.emoji}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  spawnBurst(item.emoji, rect.left + rect.width / 2, rect.top);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.4) translateZ(20px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'none';
                }}
                title={`Send 3D ${item.label} burst to partner`}
                aria-label={`Send 3D ${item.label}`}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reaction Dock Expand/Collapse Trigger */}
        <button
          onClick={() => {
            sounds.playPop();
            setIsExpanded(!isExpanded);
          }}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: isExpanded
              ? 'linear-gradient(135deg, var(--pink), #FF9E64)'
              : 'rgba(16, 18, 24, 0.90)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isExpanded ? '1px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isExpanded
              ? '0 8px 24px rgba(255, 123, 163, 0.5)'
              : '0 8px 24px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          title={isExpanded ? 'Hide 3D reactions' : 'Send 3D flying reaction burst to partner'}
          aria-label={isExpanded ? 'Hide reactions' : 'Send 3D reaction'}
        >
          {isExpanded ? '✕' : '💖'}
        </button>
      </aside>
    </>
  );
}

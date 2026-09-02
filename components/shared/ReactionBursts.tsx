'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { sounds } from '@/lib/sound';

interface Particle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  vr: number;
  opacity: number;
  duration: number;
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastBurstTime, setLastBurstTime] = useState(0);

  const spawnBurst = useCallback((emoji: string, originX?: number, originY?: number, shouldBroadcast = true) => {
    sounds.playSparkleReaction(emoji);

    const startX = originX ?? (typeof window !== 'undefined' ? window.innerWidth / 2 + (Math.random() * 200 - 100) : 200);
    const startY = originY ?? (typeof window !== 'undefined' ? window.innerHeight - 120 : 500);

    const newParticles: Particle[] = Array.from({ length: 14 }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      emoji,
      x: startX + (Math.random() * 40 - 20),
      y: startY + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 6,
      vy: -(Math.random() * 8 + 6),
      scale: Math.random() * 0.6 + 0.8,
      rotation: (Math.random() - 0.5) * 60,
      vr: (Math.random() - 0.5) * 10,
      opacity: 1,
      duration: Math.random() * 400 + 1400,
    }));

    setParticles((prev) => [...prev.slice(-40), ...newParticles]);
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

  // Clean up expired particles
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - lastBurstTime < 2200));
    }, 2000);
    return () => clearTimeout(timer);
  }, [particles, lastBurstTime]);

  return (
    <>
      {/* Particle Canvas Layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}px`,
              top: `${p.y}px`,
              fontSize: '28px',
              userSelect: 'none',
              animation: `particle-float-up ${p.duration}ms cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
              transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
              filter: 'drop-shadow(0 4px 12px rgba(255, 123, 163, 0.4))',
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
          gap: '6px',
        }}
      >
        {isExpanded && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(16, 18, 24, 0.90)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '30px',
              padding: '4px 8px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
              animation: 'gl-rise 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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
                  fontSize: '18px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.35)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'none';
                }}
                title={`Send ${item.label} to partner`}
                aria-label={`Send ${item.label}`}
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
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: isExpanded
              ? 'linear-gradient(135deg, var(--pink), #FF9E64)'
              : 'rgba(16, 18, 24, 0.90)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#FFFFFF',
            fontSize: '17px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          title={isExpanded ? 'Hide reactions' : 'Send realtime reaction to partner'}
          aria-label={isExpanded ? 'Hide reactions' : 'Send realtime reaction'}
        >
          {isExpanded ? '✕' : '💖'}
        </button>
      </aside>
    </>
  );
}

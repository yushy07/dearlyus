'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import {
  CupidotState,
  CupidotMood,
  SAFE_REACTIONS,
  SafeReaction,
} from '@/types/cupidot';
import { CupidotBot } from './CupidotBot';
import { Cupidot2D } from './Cupidot2D';
import { sounds } from '@/lib/sound';

export interface CupidotPetStageProps {
  state?: CupidotState;
  mood?: CupidotMood;
  onTap?: () => void;
  onSendReaction?: (reaction: SafeReaction) => void;
  onGoodnightTap?: () => void;
  showControls?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const STATE_DESCRIPTIONS: Record<
  CupidotState,
  { title: string; hint: string; face2D: string }
> = {
  resting: {
    title: 'Resting Calmly',
    hint: 'Curled up and resting peacefully. Zero demands, zero rush.',
    face2D: '( ˘͈ ᵕ ˘͈ ) 💤',
  },
  welcoming: {
    title: 'Welcoming You',
    hint: 'Warm and bright as you return to your shared sanctuary.',
    face2D: '(˶ᵔ ᵕ ᵔ˶) ♡',
  },
  waiting: {
    title: 'Holding Space',
    hint: 'Keeping the hearth warm while your person gets comfortable.',
    face2D: '( ◕ ‿ ◕ ) 🌸',
  },
  reunion: {
    title: 'Together in Sanctuary',
    hint: 'Both hearts are present. The room glows with shared warmth.',
    face2D: '( ≧ ◡ ≦ ) ✨',
  },
  curious: {
    title: 'Curious & Wondering',
    hint: 'Noticing new possibilities for moments together.',
    face2D: '( • ‿ • ) 🔍',
  },
  hosting: {
    title: 'Guiding Tonight',
    hint: 'Holding transitions gently without rushing you two.',
    face2D: '( ˆ ᗜ ˆ ) 🎤',
  },
  focused: {
    title: 'Quiet Presence',
    hint: 'Tiptoeing while both of you draft and create privately.',
    face2D: '( • ̯ • ) 🤫',
  },
  anticipating_reveal: {
    title: 'Anticipating Reveal',
    hint: 'Both responses are sealed! Ready to unseal together.',
    face2D: '( ✧ ‿ ✧ ) 💌',
  },
  celebrating: {
    title: 'Sparkling Celebration',
    hint: 'Marking this milestone with pure, guilt-free joy.',
    face2D: '٩( ᐛ )و 💖',
  },
  curating_memory: {
    title: 'Preserving a Keepsake',
    hint: 'Turning this shared moment into a lasting memory seed.',
    face2D: '( ˘͈ ᵕ ˘͈ ) 📦',
  },
  reconnecting: {
    title: 'Holding Your Place',
    hint: 'Protecting your room progress while connection restores.',
    face2D: '( • ‿ • ) 🛡️',
  },
  settling_for_night: {
    title: 'Settling for the Night',
    hint: 'Cozy and tranquil. Wishing both of you sweet dreams.',
    face2D: '( ˘͈ ᵕ ˘͈ ) 🌙',
  },
};

export function CupidotPetStage({
  state = 'welcoming',
  mood = 'cozy',
  onTap,
  onSendReaction,
  onGoodnightTap,
  showControls = true,
  className = '',
  style,
}: CupidotPetStageProps) {
  const [use3D, setUse3D] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reactionBurst, setReactionBurst] = useState<string | null>(null);
  const stageId = useId();
  const burstTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (burstTimerRef.current !== null) {
        window.clearTimeout(burstTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    if (query.matches) setUse3D(false);

    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) setUse3D(false);
    };
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  const info = STATE_DESCRIPTIONS[state] || STATE_DESCRIPTIONS.welcoming;

  const handleStageClick = () => {
    sounds.playPop();
    setReactionBurst('💖');
    if (burstTimerRef.current !== null) {
      window.clearTimeout(burstTimerRef.current);
    }
    burstTimerRef.current = window.setTimeout(() => {
      setReactionBurst(null);
      burstTimerRef.current = null;
    }, 1200);
    onTap?.();
  };

  const handleQuickReaction = (reaction: SafeReaction, emoji: string) => {
    setReactionBurst(emoji);
    if (burstTimerRef.current !== null) {
      window.clearTimeout(burstTimerRef.current);
    }
    burstTimerRef.current = window.setTimeout(() => {
      setReactionBurst(null);
      burstTimerRef.current = null;
    }, 1200);
    onSendReaction?.(reaction);
  };

  return (
    <div
      className={`cupidot-pet-stage ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background:
          'linear-gradient(180deg, rgba(255, 245, 248, 0.9) 0%, rgba(255, 237, 243, 0.6) 100%)',
        border: '1.5px solid rgba(255, 143, 178, 0.28)',
        borderRadius: '28px',
        padding: '24px 20px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px -8px rgba(255, 78, 120, 0.12)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        width: '100%',
        ...style,
      }}
    >
      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Cupidot is {info.title}: {info.hint} Current mood: {mood}.
      </div>

      {/* Top Badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(255, 143, 178, 0.35)',
              padding: '3px 10px',
              borderRadius: '20px',
              color: '#C93B6B',
              boxShadow: '0 2px 6px rgba(255, 78, 120, 0.08)',
            }}
          >
            ● {info.title}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--ink-soft)',
              textTransform: 'capitalize',
            }}
          >
            Mood: {mood}
          </span>
        </div>

        {/* 2D / 3D Presentation Toggle */}
        {!reducedMotion && (
          <button
            type="button"
            onClick={() => setUse3D((prev) => !prev)}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 143, 178, 0.3)',
              background: '#FFFFFF',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
            title={
              use3D
                ? 'Switch to the animated plush character'
                : 'Preview the legacy 3D character'
            }
          >
            {use3D ? 'Legacy 3D' : 'Plush 2D'}
          </button>
        )}
      </div>

      {/* Pet Interactive Canvas / 2D Presentation Stage */}
      <div
        onClick={handleStageClick}
        style={{
          width: '100%',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
        }}
        title="Tap Cupidot for a gentle reaction ♡"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStageClick();
          }
        }}
        aria-label={`Interactive Cupidot pet. Currently ${info.title}. Tap to send a quiet love reaction.`}
      >
        {/* Floating Heart Burst Effect on Click */}
        {reactionBurst && (
          <span
            style={{
              position: 'absolute',
              fontSize: '32px',
              pointerEvents: 'none',
              zIndex: 10,
              animation:
                'burst-float 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              filter: 'drop-shadow(0 4px 12px rgba(255, 78, 120, 0.4))',
            }}
          >
            {reactionBurst}
          </span>
        )}

        {/* 3D Presentation Mode */}
        {use3D && !reducedMotion ? (
          <CupidotBot
            state={state}
            scale={2.2}
            interactive={true}
            showGlow={true}
            showParticles={state === 'celebrating' || state === 'reunion'}
            onError={() => setUse3D(false)}
          />
        ) : (
          <Cupidot2D
            state={state}
            size="clamp(150px, 48vw, 220px)"
            roam={
              !reducedMotion &&
              state !== 'focused' &&
              state !== 'settling_for_night'
            }
            label={`Cupidot is ${info.title}`}
          />
        )}
      </div>

      {/* Subtext description */}
      <p
        style={{
          fontSize: '12.5px',
          color: 'var(--ink-soft)',
          margin: '2px 0 14px',
          textAlign: 'center',
          maxWidth: '420px',
        }}
      >
        {info.hint}
      </p>

      {/* Quick Safe Reactions Bar */}
      {showControls && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 143, 178, 0.2)',
          }}
        >
          {SAFE_REACTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleQuickReaction(r.id, r.emoji)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 143, 178, 0.25)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--ink)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
              title={r.label}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}

          {onGoodnightTap && (
            <button
              type="button"
              onClick={onGoodnightTap}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(245, 243, 255, 0.95)',
                color: '#6D28D9',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Give Cupidot a cozy goodnight tap before leaving"
            >
              <span>🌙</span>
              <span>Goodnight Tap</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

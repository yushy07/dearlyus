'use client';

import React from 'react';
import type { CupidotState } from '@/types/cupidot';
import { resolveVisualState, type BotState } from './CupidotBot';

export type CupidotVisualState = BotState | CupidotState;

export interface Cupidot2DProps {
  state?: CupidotVisualState;
  size?: number | string;
  roam?: boolean;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  onClick?: () => void;
}

const CUPIDOT_ART = '/cupidot/cupidot-soft-plush-reference.png';
const CUPIDOT_WALK_A = '/cupidot/cupidot-walk-a.png';
const CUPIDOT_WALK_B = '/cupidot/cupidot-walk-b.png';

/** Uses the approved Soft Plush Cupid artwork exactly; motion is layered around it. */
export function Cupidot2D({
  state = 'idle',
  size = 220,
  roam = false,
  interactive = false,
  className = '',
  style,
  label = 'Cupidot, your shared plush companion',
  onClick,
}: Cupidot2DProps) {
  const visualState = resolveVisualState(state);
  const loving =
    visualState === 'love' ||
    visualState === 'happy' ||
    visualState === 'celebration';
  const sleeping = visualState === 'sleeping';

  return (
    <span
      className={`cupidot-plush cupidot-plush--${visualState}${roam ? ' cupidot-plush--roam' : ''}${interactive ? ' cupidot-plush--interactive' : ''} ${className}`}
      style={
        {
          '--cupidot-size': typeof size === 'number' ? `${size}px` : size,
          ...style,
        } as React.CSSProperties
      }
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          !interactive ||
          !onClick ||
          (event.key !== 'Enter' && event.key !== ' ')
        )
          return;
        event.preventDefault();
        onClick();
      }}
    >
      <span className="cupidot-plush__shadow" aria-hidden />
      <span className="cupidot-plush__actor" aria-hidden>
        <img
          className="cupidot-plush__art cupidot-plush__art--rest"
          src={CUPIDOT_ART}
          alt=""
          draggable={false}
          decoding="async"
        />
        {roam && (
          <span className="cupidot-plush__walk-cycle">
            <img
              className="cupidot-plush__art cupidot-plush__art--step-a"
              src={CUPIDOT_WALK_A}
              alt=""
              draggable={false}
              decoding="async"
            />
            <img
              className="cupidot-plush__art cupidot-plush__art--step-b"
              src={CUPIDOT_WALK_B}
              alt=""
              draggable={false}
              decoding="async"
            />
          </span>
        )}
      </span>
      {loving && (
        <span className="cupidot-plush__effects" aria-hidden>
          <i>♥</i>
          <i>♥</i>
          <i>✦</i>
        </span>
      )}
      {sleeping && (
        <span className="cupidot-plush__sleep" aria-hidden>
          z
        </span>
      )}
    </span>
  );
}

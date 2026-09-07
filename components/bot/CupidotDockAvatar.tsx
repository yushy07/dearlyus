'use client';

import React from 'react';
import type { BotState } from './CupidotBot';

/** Lightweight launcher: reserves WebGL for the full Cupidot stage. */
export function CupidotDockAvatar({ state = 'idle' }: { state?: BotState }) {
  const excited = state === 'love' || state === 'happy' || state === 'celebration';
  const upset = state === 'angry' || state === 'pouty';
  return <span className={`cupidot-dock-avatar cupidot-dock-avatar--${state}`} aria-hidden>
    <span className="cupidot-dock-avatar__halo" />
    <span className="cupidot-dock-avatar__wing cupidot-dock-avatar__wing--left">ʚ</span>
    <span className="cupidot-dock-avatar__face">{upset ? '•̀⤙•́' : excited ? '˶ᵔ ᵕ ᵔ˶' : '◕‿◕'}</span>
    <span className="cupidot-dock-avatar__wing cupidot-dock-avatar__wing--right">ɞ</span>
    <span className="cupidot-dock-avatar__heart">♥</span>
  </span>;
}

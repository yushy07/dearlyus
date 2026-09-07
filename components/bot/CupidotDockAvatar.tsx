'use client';

import React from 'react';
import type { BotState } from './CupidotBot';
import { Cupidot2D } from './Cupidot2D';

/** Lightweight launcher: reserves WebGL for the full Cupidot stage. */
export function CupidotDockAvatar({ state = 'idle' }: { state?: BotState }) {
  return <Cupidot2D state={state} size={62} className="cupidot-dock-avatar" label="" />;
}

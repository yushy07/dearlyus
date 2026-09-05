'use client';

export * from './types';
export * from './quiz';
export * from './draw';
export * from './catalog';

import { quizActivityAdapter } from './quiz';
import { drawActivityAdapter } from './draw';
import { catalogActivityAdapters } from './catalog';
import type { RealtimeActivityAdapter } from './types';

export const allActivityAdapters: Record<string, RealtimeActivityAdapter> = {
  quiz: quizActivityAdapter,
  draw: drawActivityAdapter,
  ...catalogActivityAdapters,
};

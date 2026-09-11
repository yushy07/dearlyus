'use client';

export * from './types';
export * from './template';
export * from './quiz';
export * from './draw';
export * from './catalog';
export * from './expanded';

import { quizActivityAdapter } from './quiz';
import { drawActivityAdapter } from './draw';
import { catalogActivityAdapters } from './catalog';
import {
  letterActivityAdapter,
  arcadeActivityAdapter,
  scrapbookActivityAdapter,
  iqActivityAdapter,
  riddleActivityAdapter,
  labActivityAdapter,
  debateActivityAdapter,
  huntActivityAdapter,
  futureActivityAdapter,
  birthdayActivityAdapter,
  fashionActivityAdapter,
  shirtsActivityAdapter,
  forecastActivityAdapter,
  timezoneActivityAdapter,
  bucketActivityAdapter,
  datePlannerActivityAdapter,
} from './expanded';
import type { RealtimeActivityAdapter } from './types';
import { createAdapterFromDefinition } from './template';
import { courtActivityDefinition } from '../court';

const playfulCourtActivityAdapter = createAdapterFromDefinition(
  courtActivityDefinition,
);

export const allActivityAdapters: Record<string, RealtimeActivityAdapter> = {
  quiz: quizActivityAdapter,
  draw: drawActivityAdapter,
  ...catalogActivityAdapters,
  letter: letterActivityAdapter,
  arcade: arcadeActivityAdapter,
  scrapbook: scrapbookActivityAdapter,
  iq: iqActivityAdapter,
  riddle: riddleActivityAdapter,
  lab: labActivityAdapter,
  debate: debateActivityAdapter,
  court: playfulCourtActivityAdapter,
  hunt: huntActivityAdapter,
  future: futureActivityAdapter,
  birthday: birthdayActivityAdapter,
  fashion: fashionActivityAdapter,
  shirts: shirtsActivityAdapter,
  forecast: forecastActivityAdapter,
  timezone: timezoneActivityAdapter,
  bucket: bucketActivityAdapter,
  date: datePlannerActivityAdapter,
};

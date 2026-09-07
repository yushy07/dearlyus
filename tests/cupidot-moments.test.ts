import { describe, expect, it } from 'vitest';
import { COMPANION_MOMENTS, nextCompanionMoment } from '../lib/cupidot-moments';

describe('Cupidot companion moments', () => {
  it.each(['playful', 'tender', 'quiet'] as const)('exhausts %s prompts before repeating and avoids immediate repeats', (mood) => {
    const seen: string[] = [];
    const count = COMPANION_MOMENTS.filter((moment) => moment.mood === mood).length;
    for (let index = 0; index < count; index++) {
      const moment = nextCompanionMoment(mood, seen, () => 0);
      expect(moment.mood).toBe(mood);
      expect(seen).not.toContain(moment.id);
      seen.push(moment.id);
    }
    expect(nextCompanionMoment(mood, seen, () => 0).id).not.toBe(seen.at(-1));
  });
});

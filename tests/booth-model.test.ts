import { describe, it, expect } from 'vitest';
import {
  coverCrop,
  putPhoto,
  completeShot,
  frameRects,
  logicalSize,
  DEFAULT_CROP,
  INITIAL_DESIGN,
  approvalKey,
  simplifyStroke,
} from '../lib/booth/model';
describe('paired photobooth composition', () => {
  it('invalidates approval when a crop, caption or shot order changes', () => {
    const shots = [
      {
        id: 's',
        left: {
          id: 'a',
          shotId: 's',
          side: 'left' as const,
          src: 'a',
          crop: DEFAULT_CROP,
        },
      },
      { id: 'second' },
    ];
    const original = approvalKey(shots, INITIAL_DESIGN);
    expect(
      approvalKey(shots, { ...INITIAL_DESIGN, caption: 'new caption' }),
    ).not.toBe(original);
    expect(approvalKey([...shots].reverse(), INITIAL_DESIGN)).not.toBe(
      original,
    );
    expect(
      approvalKey(
        putPhoto(shots, {
          ...shots[0].left!,
          crop: { ...DEFAULT_CROP, mirror: true },
        }),
        INITIAL_DESIGN,
      ),
    ).not.toBe(original);
    expect(
      approvalKey(structuredClone(shots), structuredClone(INITIAL_DESIGN)),
    ).toBe(original);
  });
  it('requires both people before a shared shot is complete', () => {
    const left = {
      id: 'a',
      shotId: 's',
      side: 'left' as const,
      src: 'a',
      crop: DEFAULT_CROP,
    };
    const shots = putPhoto([{ id: 's' }], left);
    expect(completeShot(shots[0])).toBe(false);
    expect(completeShot(shots[0], true)).toBe(true);
    const paired = putPhoto(shots, { ...left, id: 'b', side: 'right' });
    expect(completeShot(paired[0])).toBe(true);
    expect(paired[0].left?.id).toBe('a');
  });
  it('ignores late images from a replaced shot', () => {
    expect(
      putPhoto([{ id: 'new' }], {
        id: 'a',
        shotId: 'old',
        side: 'left',
        src: 'a',
        crop: DEFAULT_CROP,
      }),
    ).toEqual([{ id: 'new' }]);
  });
  it('keeps portrait crops within source bounds at maximum pan and zoom', () => {
    for (const x of [-1, 0, 1])
      for (const y of [-1, 0, 1]) {
        const c = coverCrop(1920, 1080, 270, 360, {
          x,
          y,
          zoom: 2.5,
          mirror: false,
        });
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeGreaterThanOrEqual(0);
        expect(c.x + c.w).toBeLessThanOrEqual(1920);
        expect(c.y + c.h).toBeLessThanOrEqual(1080);
      }
  });
  it('fits all four frames inside every supported export layout', () => {
    for (const layout of ['strip', 'grid'] as const) {
      const { width, height } = logicalSize(layout);
      for (const r of frameRects(layout)) {
        expect(r.x + r.w).toBeLessThan(width);
        expect(r.y + r.h).toBeLessThan(height - 80);
      }
    }
  });
  it('normalizes and caps shared drawing points', () => {
    const points = Array.from({ length: 200 }, (_, index) => ({
      x: index / 100,
      y: -index / 100,
    }));
    const result = simplifyStroke(points, 24);
    expect(result).toHaveLength(24);
    expect(result.every((point) => point.x >= 0 && point.x <= 1)).toBe(true);
    expect(result.every((point) => point.y >= 0 && point.y <= 1)).toBe(true);
  });
});

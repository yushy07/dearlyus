import { describe, expect, it } from 'vitest';
import { cleanEdgeColours, refineConfidenceMask } from '../lib/booth/matte';

describe('photobooth matte refinement', () => {
  it('removes isolated fragments while retaining the central subject', () => {
    const width = 9;
    const confidence = new Float32Array(width * width);
    for (let y = 2; y <= 7; y++) for (let x = 2; x <= 6; x++) confidence[y * width + x] = 0.95;
    confidence[0] = 0.9;
    const result = refineConfidenceMask(confidence, width, width);
    expect(result.alpha[4 * width + 4]).toBeGreaterThan(0.9);
    expect(result.alpha[0]).toBe(0);
    expect(result.quality.foregroundRatio).toBeGreaterThan(0.2);
  });

  it('replaces contaminated translucent edge colour with nearby foreground colour', () => {
    const pixels = new Uint8ClampedArray([
      20, 220, 20, 255,
      20, 220, 20, 255,
      180, 80, 60, 255,
    ]);
    const alpha = new Uint8ClampedArray([80, 120, 255]);
    cleanEdgeColours(pixels, alpha, 3, 1);
    expect(pixels[4]).toBeGreaterThan(20);
    expect(pixels[5]).toBeLessThan(220);
  });
});

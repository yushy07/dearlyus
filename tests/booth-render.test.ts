import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  INITIAL_DESIGN,
  DEFAULT_CROP,
  BACKDROPS,
  type Shot,
} from '../lib/booth/model';
import { renderBooth } from '../lib/booth/render';
import { personCutout } from '../lib/booth/cutout';

vi.mock('../lib/booth/cutout', () => ({ personCutout: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

function fixture() {
  const ctx = {
    scale: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: '',
    filter: '',
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  vi.stubGlobal('document', {
    fonts: { ready: Promise.resolve() },
    createElement: () => canvas,
  });
  vi.stubGlobal(
    'Image',
    class {
      src = '';
      naturalWidth = 1600;
      naturalHeight = 1200;
      decode() {
        return Promise.resolve();
      }
    },
  );
  const left = { width: 400, height: 800 } as HTMLCanvasElement;
  const right = { width: 500, height: 800 } as HTMLCanvasElement;
  vi.mocked(personCutout)
    .mockResolvedValueOnce(left)
    .mockResolvedValueOnce(right);
  const shots: Shot[] = [
    {
      id: 'pair',
      left: {
        id: 'left-photo',
        shotId: 'pair',
        side: 'left',
        src: 'left-source',
        crop: { ...DEFAULT_CROP },
      },
      right: {
        id: 'right-photo',
        shotId: 'pair',
        side: 'right',
        src: 'right-source',
        crop: { ...DEFAULT_CROP },
      },
    },
  ];
  return { ctx, canvas, shots, left, right };
}

describe('shared-background photo rendering', () => {
  it('places two independent cutouts in one full-frame clipping area and keeps originals', async () => {
    const { ctx, shots, left, right } = fixture();
    const original = structuredClone(shots);
    const result = await renderBooth(
      shots,
      { ...INITIAL_DESIGN, composition: 'backdrop', backdrop: 'midnight' },
      false,
    );
    expect(personCutout).toHaveBeenCalledTimes(2);
    expect(ctx.drawImage.mock.calls[0][0]).toBe(left);
    expect(ctx.drawImage.mock.calls[1][0]).toBe(right);
    expect(ctx.drawImage.mock.calls[0][1]).toBeLessThan(
      ctx.drawImage.mock.calls[1][1],
    );
    expect(ctx.rect.mock.calls.slice(0, 2)).toEqual([
      [30, 105, 540, 360],
      [30, 105, 540, 360],
    ]);
    expect(shots).toEqual(original);
    expect([result.width, result.height]).toEqual([1200, 3600]);
    expect(BACKDROPS.midnight).toBeTruthy();
  });

  it('restores original split photos without requesting segmentation', async () => {
    const { ctx, shots } = fixture();
    await renderBooth(shots, INITIAL_DESIGN, false);
    expect(personCutout).not.toHaveBeenCalled();
    expect(ctx.rect.mock.calls.slice(0, 2)).toEqual([
      [30, 105, 270, 360],
      [300, 105, 270, 360],
    ]);
  });

  it('rejects a failed cutout rather than exporting an incomplete shared photo', async () => {
    const { shots } = fixture();
    vi.mocked(personCutout)
      .mockReset()
      .mockRejectedValue(new Error('Portrait unavailable'));
    await expect(
      renderBooth(shots, { ...INITIAL_DESIGN, composition: 'backdrop' }, false),
    ).rejects.toThrow('Portrait unavailable');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  INITIAL_DESIGN,
  DEFAULT_CROP,
  BACKDROPS,
  normalizeBackdrop,
  type Shot,
} from '../lib/booth/model';
import { printSheet, renderBooth } from '../lib/booth/render';
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
    ellipse: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: '',
    filter: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
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
      {
        ...INITIAL_DESIGN,
        composition: 'backdrop',
        backdrop: 'moonlit-rooftop',
      },
      false,
    );
    expect(personCutout).toHaveBeenCalledTimes(2);
    const subjectCalls = ctx.drawImage.mock.calls.filter(
      (call) => call[0] === left || call[0] === right,
    );
    expect(subjectCalls).toHaveLength(4);
    const finalSubjects = [subjectCalls[1], subjectCalls[3]];
    expect(finalSubjects[0][0]).toBe(left);
    expect(finalSubjects[1][0]).toBe(right);
    expect(finalSubjects[0][1]).toBeLessThan(finalSubjects[1][1]);
    expect(ctx.rect.mock.calls.slice(0, 2)).toEqual([
      [30, 105, 540, 360],
      [30, 105, 540, 360],
    ]);
    expect(shots).toEqual(original);
    expect([result.width, result.height]).toEqual([1200, 3600]);
    expect(BACKDROPS['moonlit-rooftop'].image).toContain('moonlit-rooftop');
    expect(ctx.ellipse).toHaveBeenCalledTimes(2);
  });

  it('restores original split photos without requesting segmentation', async () => {
    const { ctx, shots } = fixture();
    await renderBooth(
      shots,
      { ...INITIAL_DESIGN, composition: 'split' },
      false,
    );
    expect(personCutout).not.toHaveBeenCalled();
    expect(ctx.rect.mock.calls.slice(0, 2)).toEqual([
      [30, 105, 270, 360],
      [300, 105, 270, 360],
    ]);
  });

  it('ships ten distinct scenes and maps previous snapshot names', () => {
    const scenes = Object.values(BACKDROPS);
    expect(scenes).toHaveLength(10);
    expect(new Set(scenes.map((item) => item.image))).toHaveLength(10);
    expect(new Set(scenes.map((item) => item.thumbnail))).toHaveLength(10);
    expect(normalizeBackdrop('linen')).toBe('ivory-studio');
    expect(normalizeBackdrop('rose')).toBe('rose-curtain');
    expect(normalizeBackdrop('sage')).toBe('seoul-dessert-cafe');
    expect(normalizeBackdrop('midnight')).toBe('moonlit-rooftop');
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

  it('renders synchronized drawing strokes into the export', async () => {
    const { ctx, shots } = fixture();
    await renderBooth(
      shots,
      {
        ...INITIAL_DESIGN,
        composition: 'split',
        strokes: [
          {
            id: 'note',
            color: '#8f5361',
            width: 8,
            points: [
              { x: 0.1, y: 0.2 },
              { x: 0.3, y: 0.4 },
              { x: 0.5, y: 0.3 },
            ],
          },
        ],
      },
      false,
    );
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalledOnce();
    expect(ctx.strokeStyle).toBe('#8f5361');
  });

  it('creates an exact 4 by 6 print canvas for either layout', async () => {
    const { canvas } = fixture();
    for (const layout of ['strip', 'grid'] as const) {
      const sheet = await printSheet(
        canvas as unknown as HTMLCanvasElement,
        layout,
      );
      expect([sheet.width, sheet.height]).toEqual([1200, 1800]);
    }
  });
});

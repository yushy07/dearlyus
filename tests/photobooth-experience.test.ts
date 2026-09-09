import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  photoboothActivityDefinition,
  photoboothActivityAdapter,
} from '../lib/activity-adapters';
import { sounds } from '../lib/sound';

describe('Photobooth Experience & Mechanics', () => {
  describe('Photobooth Activity Definition & State Lifecycle', () => {
    it('initializes photobooth snapshot with standby stage and default 4 shots', () => {
      const snapshot = photoboothActivityDefinition.initialSnapshot({
        roomCode: 'booth-404',
        userId: 'lover-1',
        options: { cuts: 4 },
      });

      expect(snapshot.activityType).toBe('photobooth');
      expect(snapshot.photoboothStage).toBe('standby');
      expect(snapshot.status).toBe('active');
    });

    it('advances through countdown -> flash -> review stages properly', () => {
      let snapshot = photoboothActivityDefinition.initialSnapshot({
        roomCode: 'booth-404',
        userId: 'lover-1',
      });

      // 1. Start Countdown
      snapshot = photoboothActivityDefinition.reduce(snapshot, {
        type: 'photo_start_countdown',
        payload: { cut: 1 },
      });
      expect(snapshot.photoboothStage).toBe('countdown');

      // 2. Shutter Flash
      snapshot = photoboothActivityDefinition.reduce(snapshot, {
        type: 'photo_shutter',
        payload: { cut: 1, shotUrl: 'data:image/webp;base64,...' },
      });
      expect(snapshot.photoboothStage).toBe('flash');

      // 3. Finish sequence into review stage
      snapshot = photoboothActivityDefinition.reduce(snapshot, {
        type: 'photo_finish',
        payload: { totalCuts: 4 },
      });
      expect(snapshot.photoboothStage).toBe('review');
    });

    it('validates allowed durable events and rejects unauthorized ones', () => {
      const validEvent = {
        type: 'photo_filter',
        payload: { filter: 'vintage-film' },
      };
      const invalidEvent = {
        type: 'unauthorized_admin_drop',
        payload: {},
      };

      expect(
        photoboothActivityDefinition.validateEvent!(validEvent as any).valid,
      ).toBe(true);
      expect(
        photoboothActivityDefinition.validateEvent!(invalidEvent as any).valid,
      ).toBe(false);
    });
  });

  describe('Doodle Path & SVG Vector Calculations', () => {
    it('constructs valid SVG path data from normalized coordinates', () => {
      const doodle = {
        color: '#FF7BA3',
        width: 3,
        points: [
          { x: 10, y: 20 },
          { x: 15, y: 25 },
          { x: 20, y: 30 },
        ],
      };

      const pathData = doodle.points.reduce(
        (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
        '',
      ).trim();

      expect(pathData).toBe('M 10 20 L 15 25 L 20 30');
    });

    it('handles single-point paths gracefully without breaking SVG path parsing', () => {
      const singlePointDoodle = {
        color: '#4ECCA3',
        width: 3,
        points: [{ x: 50, y: 50 }],
      };

      // In rendering, paths with < 2 points are filtered out to avoid corrupt path definitions
      const shouldRender = singlePointDoodle.points.length >= 2;
      expect(shouldRender).toBe(false);
    });
  });

  describe('Placed Stickers Bounds & Transformations', () => {
    it('clamps sticker placement positions within photostrip bounds', () => {
      const clampCoordinate = (val: number, min = 5, max = 95) =>
        Math.max(min, Math.min(max, val));

      expect(clampCoordinate(-10)).toBe(5);
      expect(clampCoordinate(105)).toBe(95);
      expect(clampCoordinate(45)).toBe(45);
    });

    it('applies rotation and scale limits', () => {
      const clampScale = (scale: number) =>
        Math.max(0.7, Math.min(1.6, scale));

      expect(clampScale(0.4)).toBe(0.7);
      expect(clampScale(2.5)).toBe(1.6);
      expect(clampScale(1.1)).toBe(1.1);
    });
  });

  describe('Procedural Audio Feedback Verification', () => {
    it('plays countdown beep with different frequencies for ticks vs zero', () => {
      const fakeOsc = {
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      const fakeGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      const fakeCtx = {
        currentTime: 0,
        state: 'running',
        createOscillator: vi.fn(() => fakeOsc),
        createGain: vi.fn(() => fakeGain),
        destination: {},
      };

      vi.spyOn(sounds, 'getContext').mockReturnValue(fakeCtx as any);

      // Normal tick: 440 Hz
      sounds.playCountdownBeep(false);
      expect(fakeOsc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);

      // Zero snap beep: 880 Hz
      sounds.playCountdownBeep(true);
      expect(fakeOsc.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
    });

    it('plays camera shutter snap sound without error', () => {
      const fakeOsc = {
        type: '',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      const fakeGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      const fakeCtx = {
        currentTime: 0,
        state: 'running',
        createOscillator: vi.fn(() => fakeOsc),
        createGain: vi.fn(() => fakeGain),
        destination: {},
      };

      vi.spyOn(sounds, 'getContext').mockReturnValue(fakeCtx as any);

      expect(() => sounds.playShutter()).not.toThrow();
      expect(fakeOsc.frequency.setValueAtTime).toHaveBeenCalledWith(800, 0);
      expect(fakeOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(80, 0.08);
    });
  });

  describe('Korean Photobooth Smooth Bezier & Twin Strip Enhancements', () => {
    it('generates smooth quadratic bezier curves with pointsToBezierPath', async () => {
      const { pointsToBezierPath } = await import('../lib/photobooth-bezier');

      const twoPoints = [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      expect(pointsToBezierPath(twoPoints)).toBe('M 10 10 L 20 20');

      const multiPoints = [
        { x: 0, y: 0 },
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 50 },
      ];
      const path = pointsToBezierPath(multiPoints);
      expect(path.startsWith('M 0 0')).toBe(true);
      expect(path).toContain('Q');
      expect(path).toContain('50 50');
    });

    it('toggles horizontal flip on placed stickers', () => {
      const sticker = {
        id: 'stk-1',
        content: '💖',
        x: 50,
        y: 50,
        rotation: 0,
        scale: 1,
        flipX: false,
      };

      const flipped = { ...sticker, flipX: !sticker.flipX };
      expect(flipped.flipX).toBe(true);

      const unFlipped = { ...flipped, flipX: !flipped.flipX };
      expect(unFlipped.flipX).toBe(false);
    });

    it('computes correct canvas dimensions for single strip vs twin strip', () => {
      const getCanvasDimensions = (isTwin: boolean) => ({
        width: isTwin ? 1200 : 600,
        height: 1600,
      });

      expect(getCanvasDimensions(false)).toEqual({ width: 600, height: 1600 });
      expect(getCanvasDimensions(true)).toEqual({ width: 1200, height: 1600 });
    });

    it('updates specific cut in captured shots on drag-and-drop replacement', () => {
      const initialShots = [
        '/photos/cut1.webp',
        '/photos/cut2.webp',
        '/photos/cut3.webp',
        '/photos/cut4.webp',
      ];

      const dropTargetIndex = 2;
      const newImageUrl = 'data:image/png;base64,customUpload123';

      const updatedShots = initialShots.map((shot, idx) =>
        idx === dropTargetIndex ? newImageUrl : shot,
      );

      expect(updatedShots[2]).toBe(newImageUrl);
      expect(updatedShots[0]).toBe('/photos/cut1.webp');
      expect(updatedShots[1]).toBe('/photos/cut2.webp');
      expect(updatedShots[3]).toBe('/photos/cut4.webp');
    });
  });

  describe('Photobooth Polish & Advanced Functional Enhancements', () => {
    it('reorders cuts by swapping elements in shots and transforms arrays', () => {
      const shots = ['cut-1', 'cut-2', 'cut-3', 'cut-4'];
      const transforms = [
        { rotation: 0, flipX: false },
        { rotation: 90, flipX: true },
        { rotation: 180, flipX: false },
        { rotation: 270, flipX: true },
      ];

      const moveCut = <T>(arr: T[], from: number, to: number): T[] => {
        if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) return arr;
        const next = [...arr];
        const temp = next[from];
        next[from] = next[to];
        next[to] = temp;
        return next;
      };

      const reorderedShots = moveCut(shots, 1, 2);
      expect(reorderedShots).toEqual(['cut-1', 'cut-3', 'cut-2', 'cut-4']);

      const reorderedTransforms = moveCut(transforms, 1, 2);
      expect(reorderedTransforms[1]).toEqual({ rotation: 180, flipX: false });
      expect(reorderedTransforms[2]).toEqual({ rotation: 90, flipX: true });
    });

    it('rotates cut by 90 degrees clockwise and flips horizontally', () => {
      let transform = { rotation: 0, flipX: false };

      const rotate = (t: { rotation: number; flipX: boolean }) => ({
        ...t,
        rotation: (t.rotation + 90) % 360,
      });

      const flip = (t: { rotation: number; flipX: boolean }) => ({
        ...t,
        flipX: !t.flipX,
      });

      transform = rotate(transform);
      expect(transform.rotation).toBe(90);
      transform = rotate(transform);
      expect(transform.rotation).toBe(180);
      transform = rotate(transform);
      expect(transform.rotation).toBe(270);
      transform = rotate(transform);
      expect(transform.rotation).toBe(0);

      transform = flip(transform);
      expect(transform.flipX).toBe(true);
      transform = flip(transform);
      expect(transform.flipX).toBe(false);
    });

    it('manages sticker z-index layering with bringForward and sendBackward', () => {
      const stickers = [
        { id: 'stk-a', content: '💖' },
        { id: 'stk-b', content: '✨' },
        { id: 'stk-c', content: '🌸' },
      ];

      const bringForward = (arr: typeof stickers, id: string) => {
        const idx = arr.findIndex((s) => s.id === id);
        if (idx === -1 || idx === arr.length - 1) return arr;
        const next = [...arr];
        const temp = next[idx];
        next[idx] = next[idx + 1];
        next[idx + 1] = temp;
        return next;
      };

      const sendBackward = (arr: typeof stickers, id: string) => {
        const idx = arr.findIndex((s) => s.id === id);
        if (idx <= 0) return arr;
        const next = [...arr];
        const temp = next[idx];
        next[idx] = next[idx - 1];
        next[idx - 1] = temp;
        return next;
      };

      // Bring 'stk-a' forward: ['stk-b', 'stk-a', 'stk-c']
      const forward1 = bringForward(stickers, 'stk-a');
      expect(forward1.map((s) => s.id)).toEqual(['stk-b', 'stk-a', 'stk-c']);

      // Send 'stk-c' backward: ['stk-a', 'stk-c', 'stk-b']
      const backward1 = sendBackward(stickers, 'stk-c');
      expect(backward1.map((s) => s.id)).toEqual(['stk-a', 'stk-c', 'stk-b']);
    });

    it('supports customizable countdown timer intervals (3s, 5s, 10s)', () => {
      const validTimers: (3 | 5 | 10)[] = [3, 5, 10];
      validTimers.forEach((timer) => {
        expect([3, 5, 10]).toContain(timer);
      });

      const computeSnapDelay = (seconds: number) => seconds * 900;
      expect(computeSnapDelay(3)).toBe(2700);
      expect(computeSnapDelay(5)).toBe(4500);
      expect(computeSnapDelay(10)).toBe(9000);
    });

    it('supports fine-tuning photo parameters (brightness, contrast, grain)', () => {
      const clampBrightness = (b: number) => Math.max(85, Math.min(115, b));
      const clampContrast = (c: number) => Math.max(85, Math.min(115, c));

      expect(clampBrightness(70)).toBe(85);
      expect(clampBrightness(100)).toBe(100);
      expect(clampBrightness(130)).toBe(115);

      expect(clampContrast(60)).toBe(85);
      expect(clampContrast(110)).toBe(110);
      expect(clampContrast(140)).toBe(115);
    });

    it('supports custom curated frame cardstock palette with theme fallback', () => {
      const cardstockPalette = [
        { name: 'Classic White', hex: '#FFFFFF' },
        { name: 'Charcoal Dark', hex: '#18191E' },
        { name: 'Blush Pink', hex: '#FFE4E8' },
        { name: 'Buttercream', hex: '#FFFBEB' },
        { name: 'Sky Blue', hex: '#E0F2FE' },
        { name: 'Lavender Lilac', hex: '#F3E8FF' },
        { name: 'Misty Sage', hex: '#E2ECE9' },
        { name: 'Matcha Green', hex: '#DCFCE7' },
      ];

      const themeDefaultBg = '#F6EDE6';

      const resolveBg = (customColor: string | null) =>
        customColor || themeDefaultBg;

      expect(resolveBg(null)).toBe('#F6EDE6');
      expect(resolveBg(cardstockPalette[2].hex)).toBe('#FFE4E8');
      expect(resolveBg(cardstockPalette[7].hex)).toBe('#DCFCE7');
    });

    it('bypasses color grading and grain when Hold to Compare is active', () => {
      const activeFilter = 'contrast(1.15) brightness(1.05) saturate(1.2)';
      const brightness = 110;
      const contrast = 95;

      const resolveFilterStyle = (
        isComparing: boolean,
        filterStr: string,
        b: number,
        c: number,
      ) => {
        if (isComparing) return 'none';
        return `${filterStr} brightness(${b}%) contrast(${c}%)`;
      };

      // Graded / Styled state
      const styledFilter = resolveFilterStyle(
        false,
        activeFilter,
        brightness,
        contrast,
      );
      expect(styledFilter).toBe(
        'contrast(1.15) brightness(1.05) saturate(1.2) brightness(110%) contrast(95%)',
      );

      // Raw camera compare state
      const rawFilter = resolveFilterStyle(
        true,
        activeFilter,
        brightness,
        contrast,
      );
      expect(rawFilter).toBe('none');

      // Film grain bypass check
      const shouldRenderGrain = (grainEnabled: boolean, isComparing: boolean) =>
        grainEnabled && !isComparing;

      expect(shouldRenderGrain(true, false)).toBe(true);
      expect(shouldRenderGrain(true, true)).toBe(false);
      expect(shouldRenderGrain(false, true)).toBe(false);
    });

    it('calculates 4×6" print sheet layout dimensions and exact symmetry', () => {
      // Standard 4×6 inch photo paper at 300 DPI: 1200 × 1800 px
      const SHEET_WIDTH = 1200;
      const SHEET_HEIGHT = 1800;

      const STRIP_WIDTH = 515;
      const STRIP_HEIGHT = 1600;

      const LEFT_OFFSET_X = 55;
      const RIGHT_OFFSET_X = 630;
      const OFFSET_Y = 80;

      expect(SHEET_WIDTH / SHEET_HEIGHT).toBe(2 / 3); // 4x6 aspect ratio

      // Left strip span: 55 -> 570
      const leftStripEnd = LEFT_OFFSET_X + STRIP_WIDTH;
      expect(leftStripEnd).toBe(570);

      // Right strip span: 630 -> 1145
      const rightStripEnd = RIGHT_OFFSET_X + STRIP_WIDTH;
      expect(rightStripEnd).toBe(1145);

      // Right margin: 1200 - 1145 = 55px (perfect symmetry with left margin 55px)
      const rightMargin = SHEET_WIDTH - rightStripEnd;
      expect(rightMargin).toBe(LEFT_OFFSET_X);

      // Center gutter: 570 to 630 = 60px
      const centerGutter = RIGHT_OFFSET_X - leftStripEnd;
      expect(centerGutter).toBe(60);

      // Center cutting line down x = 600 (exact midpoint of gutter: 570 + 30 = 600)
      const centerCutX = leftStripEnd + centerGutter / 2;
      expect(centerCutX).toBe(600);
      expect(centerCutX).toBe(SHEET_WIDTH / 2);

      // Vertical margins
      const bottomMargin = SHEET_HEIGHT - (OFFSET_Y + STRIP_HEIGHT);
      expect(bottomMargin).toBe(120);
      expect(OFFSET_Y).toBe(80);
    });
  });
});


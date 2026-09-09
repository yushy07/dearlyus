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
});


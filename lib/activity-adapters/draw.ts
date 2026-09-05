'use client';

import type {
  RealtimeActivityAdapter,
  StartActivityInput,
  ValidationResult,
  ActivityResult,
  KeepsakeDraft,
} from './types';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface StrokeBatch {
  id: string;
  userId: string;
  sequence: number;
  color: string;
  brushSize: number;
  points: StrokePoint[];
  timestamp: string;
}

export interface CanvasCheckpoint {
  checkpointSequence: number;
  strokeCount: number;
  dataUrl?: string;
  createdAt: string;
}

export interface DrawSnapshot {
  [key: string]: unknown;
  activityType: 'draw';
  schemaVersion: number;
  prompt: string;
  background: string;
  strokes: StrokeBatch[];
  checkpoints: CanvasCheckpoint[];
  lastSequence: number;
  completed: boolean;
}

export type DrawEvent =
  | { type: 'draw_batch'; payload: StrokeBatch }
  | { type: 'draw_clear'; payload: { clearedAt: string; userId: string } }
  | { type: 'draw_checkpoint'; payload: CanvasCheckpoint }
  | { type: 'draw_complete'; payload: { summary: Record<string, unknown> } };

export const DRAW_ALLOWED_EVENTS = [
  'draw_batch',
  'draw_clear',
  'draw_checkpoint',
  'draw_complete',
] as const;

export const drawActivityAdapter: RealtimeActivityAdapter<DrawSnapshot, DrawEvent> = {
  activityType: 'draw',
  schemaVersion: 1,

  createInitialSnapshot(input: StartActivityInput): DrawSnapshot {
    const options = input.options || {};
    return {
      activityType: 'draw',
      schemaVersion: 1,
      prompt: String(options.prompt || 'Draw: Our Dream Sunset Date 🌅'),
      background: String(options.background || '#FFFFFF'),
      strokes: [],
      checkpoints: [],
      lastSequence: 0,
      completed: false,
    };
  },

  validateEvent(event: DrawEvent): ValidationResult {
    if (!DRAW_ALLOWED_EVENTS.includes(event.type as any)) {
      return { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} is not permitted for draw.` };
    }
    if (event.type === 'draw_batch') {
      const payload = event.payload;
      if (!Array.isArray(payload.points) || payload.points.length === 0) {
        return { valid: false, message: 'Stroke batch must contain points.' };
      }
    }
    return { valid: true };
  },

  reduce(snapshot: DrawSnapshot, event: DrawEvent): DrawSnapshot {
    switch (event.type) {
      case 'draw_batch': {
        const batch = event.payload;
        // Keep strokes ordered monotonically by sequence
        const newStrokes = [...snapshot.strokes, batch].sort((a, b) => a.sequence - b.sequence);
        return {
          ...snapshot,
          strokes: newStrokes,
          lastSequence: Math.max(snapshot.lastSequence, batch.sequence),
        };
      }

      case 'draw_clear': {
        return {
          ...snapshot,
          strokes: [],
          checkpoints: [],
        };
      }

      case 'draw_checkpoint': {
        const checkpoint = event.payload;
        return {
          ...snapshot,
          checkpoints: [...snapshot.checkpoints.slice(-4), checkpoint],
        };
      }

      case 'draw_complete': {
        return {
          ...snapshot,
          completed: true,
        };
      }

      default:
        return snapshot;
    }
  },

  canTransition(_snapshot: DrawSnapshot, _action: string, userId: string): boolean {
    return Boolean(userId);
  },

  summarize(snapshot: DrawSnapshot): ActivityResult {
    return {
      activityType: 'draw',
      completed: snapshot.completed,
      summary: {
        prompt: snapshot.prompt,
        totalStrokes: snapshot.strokes.length,
        checkpointsCount: snapshot.checkpoints.length,
      },
    };
  },

  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const summary = result.summary as {
      prompt: string;
      totalStrokes: number;
    };

    return {
      kind: 'activity',
      title: `Our Canvas Artwork · ${summary.prompt}`,
      metadata: {
        activityType: 'draw',
        prompt: summary.prompt,
        totalStrokes: summary.totalStrokes,
        completedAt: new Date().toISOString(),
      },
    };
  },
};

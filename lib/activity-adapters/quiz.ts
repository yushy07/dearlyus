'use client';

import type {
  RealtimeActivityAdapter,
  StartActivityInput,
  ValidationResult,
  ActivityResult,
  KeepsakeDraft,
} from './types';

export interface QuizQuestionData {
  q: string;
  options: string[];
  honestAnswerIndex?: number;
}

export interface QuizRoundRecord {
  roundIndex: number;
  question: QuizQuestionData;
  answers: Array<{ userId: string; answer: number | string; lockedAt: string }>;
  isMatch: boolean;
  skipped?: boolean;
}

export interface QuizSnapshot {
  [key: string]: unknown;
  activityType: 'quiz';
  schemaVersion: number;
  packId: string;
  packTitle: string;
  currentRound: number;
  status: 'drafting' | 'locked' | 'revealed' | 'completed';
  matches: number;
  totalRounds: number;
  history: QuizRoundRecord[];
  completed: boolean;
  questions?: QuizQuestionData[];
}

export type QuizEvent =
  | { type: 'quiz_start'; payload: { packId: string; packTitle: string; totalRounds: number; questions?: QuizQuestionData[] } }
  | { type: 'answer_locked'; payload: { roundNumber: number; locked: boolean } }
  | { type: 'answers_revealed'; payload: { roundNumber: number; answers: Array<{ userId: string; answer: number | string; lockedAt: string }> } }
  | { type: 'quiz_next'; payload: { nextRound: number } }
  | { type: 'gentle_skip'; payload: { roundNumber: number; skippedAt: string } }
  | { type: 'reaction_sent'; payload: { emoji: string; roundNumber?: number } };

export const QUIZ_ALLOWED_EVENTS = [
  'quiz_start',
  'answer_locked',
  'answers_revealed',
  'quiz_next',
  'gentle_skip',
  'reaction_sent',
] as const;

export const quizActivityAdapter: RealtimeActivityAdapter<QuizSnapshot, QuizEvent> = {
  activityType: 'quiz',
  schemaVersion: 1,

  createInitialSnapshot(input: StartActivityInput): QuizSnapshot {
    const options = input.options || {};
    return {
      activityType: 'quiz',
      schemaVersion: 1,
      packId: String(options.packId || 'pack-love-sync'),
      packTitle: String(options.packTitle || 'Our Daily Lore & Sync'),
      currentRound: Number(options.currentRound || 0),
      status: 'drafting',
      matches: 0,
      totalRounds: Number(options.totalRounds || 6),
      history: [],
      completed: false,
      questions: Array.isArray(options.questions) ? (options.questions as QuizQuestionData[]) : undefined,
    };
  },

  validateEvent(event: QuizEvent): ValidationResult {
    if (!QUIZ_ALLOWED_EVENTS.includes(event.type as any)) {
      return { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} is not permitted for quiz.` };
    }
    return { valid: true };
  },

  reduce(snapshot: QuizSnapshot, event: QuizEvent): QuizSnapshot {
    switch (event.type) {
      case 'quiz_start': {
        return {
          ...snapshot,
          packId: event.payload.packId,
          packTitle: event.payload.packTitle,
          totalRounds: event.payload.totalRounds,
          currentRound: 0,
          status: 'drafting',
          matches: 0,
          history: [],
          completed: false,
          questions: event.payload.questions ?? snapshot.questions,
        };
      }

      case 'answer_locked': {
        return {
          ...snapshot,
          status: 'locked',
        };
      }

      case 'answers_revealed': {
        const answers = event.payload.answers || [];
        const ansA = answers[0]?.answer;
        const ansB = answers[1]?.answer;
        const isMatch = answers.length >= 2 && ansA !== undefined && ansA === ansB;

        const currentQ = snapshot.questions?.[snapshot.currentRound] || {
          q: `Question ${snapshot.currentRound + 1}`,
          options: [],
        };

        const newRecord: QuizRoundRecord = {
          roundIndex: snapshot.currentRound,
          question: currentQ,
          answers,
          isMatch: Boolean(isMatch),
          skipped: false,
        };

        return {
          ...snapshot,
          status: 'revealed',
          matches: isMatch ? snapshot.matches + 1 : snapshot.matches,
          history: [...snapshot.history.filter((h) => h.roundIndex !== snapshot.currentRound), newRecord],
        };
      }

      case 'gentle_skip': {
        const currentQ = snapshot.questions?.[snapshot.currentRound] || {
          q: `Question ${snapshot.currentRound + 1}`,
          options: [],
        };

        const skipRecord: QuizRoundRecord = {
          roundIndex: snapshot.currentRound,
          question: currentQ,
          answers: [],
          isMatch: false,
          skipped: true,
        };

        return {
          ...snapshot,
          status: 'revealed',
          history: [...snapshot.history.filter((h) => h.roundIndex !== snapshot.currentRound), skipRecord],
        };
      }

      case 'quiz_next': {
        const nextRound = event.payload.nextRound;
        const isCompleted = nextRound >= snapshot.totalRounds;
        return {
          ...snapshot,
          currentRound: nextRound,
          status: isCompleted ? 'completed' : 'drafting',
          completed: isCompleted,
        };
      }

      default:
        return snapshot;
    }
  },

  canTransition(snapshot: QuizSnapshot, action: string, userId: string): boolean {
    if (!userId) return false;
    if (action === 'quiz_next') {
      return snapshot.status === 'revealed';
    }
    if (action === 'answers_revealed') {
      return snapshot.status === 'locked' || snapshot.status === 'drafting';
    }
    return true;
  },

  summarize(snapshot: QuizSnapshot): ActivityResult {
    return {
      activityType: 'quiz',
      completed: snapshot.completed,
      summary: {
        packId: snapshot.packId,
        packTitle: snapshot.packTitle,
        matches: snapshot.matches,
        totalRounds: snapshot.totalRounds,
        history: snapshot.history,
      },
    };
  },

  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const summary = result.summary as {
      packTitle: string;
      matches: number;
      totalRounds: number;
      history: QuizRoundRecord[];
    };

    const matchRate = summary.totalRounds > 0 ? Math.round((summary.matches / summary.totalRounds) * 100) : 100;

    return {
      kind: 'activity',
      title: `${summary.packTitle} · ${matchRate}% Match`,
      metadata: {
        activityType: 'quiz',
        packTitle: summary.packTitle,
        matches: summary.matches,
        totalRounds: summary.totalRounds,
        matchRate,
        historySummary: summary.history.map((h) => ({
          q: h.question.q,
          isMatch: h.isMatch,
          skipped: Boolean(h.skipped),
        })),
        date: new Date().toISOString(),
      },
    };
  },
};

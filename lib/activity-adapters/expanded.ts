'use client';

import type {
  StartActivityInput,
  ValidationResult,
  ActivityResult,
  KeepsakeDraft,
  RealtimeActivityEvent,
  RealtimeActivityAdapter,
} from './types';
import {
  type ActivityDefinition,
  type StandardSessionState,
  createAdapterFromDefinition,
} from './template';

// Helper for validating allowed events
function validateEventSet(allowed: readonly string[], event: RealtimeActivityEvent): ValidationResult {
  return allowed.includes(event.type)
    ? { valid: true }
    : {
        valid: false,
        code: 'INVALID_EVENT',
        message: `Event ${event.type} not allowed for this activity.`,
      };
}

// ==========================================
// 1. LETTERS TO THE FUTURE ADAPTER
// ==========================================
export interface LetterSnapshot {
  [key: string]: unknown;
  activityType: 'letter';
  schemaVersion: number;
  status: StandardSessionState;
  mode: 'date' | 'milestone' | 'need';
  unlockDate: string;
  sealed: boolean;
  partnerAWrote: boolean;
  partnerBWrote: boolean;
  hasVoiceNote: boolean;
  completed: boolean;
}

const LETTER_EVENTS = [
  'letter_mode_select',
  'letter_progress_update',
  'letter_seal_propose',
  'letter_seal_confirm',
  'letter_unseal',
] as const;

export const letterActivityDefinition: ActivityDefinition<LetterSnapshot, RealtimeActivityEvent> = {
  activityType: 'letter',
  schemaVersion: 1,
  durableEvents: LETTER_EVENTS,
  transientEvents: ['letter_typing'],
  privateFields: ['partnerALetter', 'partnerBLetter'],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): LetterSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'letter',
      schemaVersion: 1,
      status: 'active',
      mode: (opts.mode as any) || 'date',
      unlockDate: String(opts.unlockDate || new Date(Date.now() + 30 * 86400000).toISOString()),
      sealed: false,
      partnerAWrote: false,
      partnerBWrote: false,
      hasVoiceNote: false,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(LETTER_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'letter_mode_select':
        return { ...snapshot, mode: p.mode as any, unlockDate: String(p.unlockDate || snapshot.unlockDate) };
      case 'letter_progress_update':
        return {
          ...snapshot,
          partnerAWrote: p.isPartnerA ? Boolean(p.wrote) : snapshot.partnerAWrote,
          partnerBWrote: !p.isPartnerA ? Boolean(p.wrote) : snapshot.partnerBWrote,
          hasVoiceNote: Boolean(p.hasVoiceNote ?? snapshot.hasVoiceNote),
        };
      case 'letter_seal_confirm':
        return { ...snapshot, sealed: true, status: 'completed', completed: true };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'letter',
      completed: snapshot.completed,
      summary: { mode: snapshot.mode, unlockDate: snapshot.unlockDate, sealed: snapshot.sealed },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { mode: string; unlockDate: string };
    return {
      kind: 'activity',
      title: `Time Capsule · Sealed until ${new Date(sum.unlockDate).toLocaleDateString()}`,
      metadata: { activityType: 'letter', ...sum },
    };
  },
};
export const letterActivityAdapter: RealtimeActivityAdapter<LetterSnapshot> =
  createAdapterFromDefinition(letterActivityDefinition);

// ==========================================
// 2. THE ARCADE ADAPTER
// ==========================================
export interface ArcadeSnapshot {
  [key: string]: unknown;
  activityType: 'arcade';
  schemaVersion: number;
  status: StandardSessionState;
  gameId: 'heart-jump' | 'asteroid' | 'berry-catch';
  roundSeed: number;
  playerAScore: number;
  playerBScore: number;
  roundNumber: number;
  winner: string | null;
  completed: boolean;
}

const ARCADE_EVENTS = [
  'arcade_game_select',
  'arcade_round_start',
  'arcade_score_update',
  'arcade_round_end',
  'arcade_rematch',
] as const;

export const arcadeActivityDefinition: ActivityDefinition<ArcadeSnapshot, RealtimeActivityEvent> = {
  activityType: 'arcade',
  schemaVersion: 1,
  durableEvents: ARCADE_EVENTS,
  transientEvents: ['arcade_player_move'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): ArcadeSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'arcade',
      schemaVersion: 1,
      status: 'active',
      gameId: (opts.gameId as any) || 'heart-jump',
      roundSeed: Number(opts.roundSeed || 0),
      playerAScore: 0,
      playerBScore: 0,
      roundNumber: 1,
      winner: null,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(ARCADE_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'arcade_game_select':
        return { ...snapshot, gameId: p.gameId as any };
      case 'arcade_round_start':
        return {
          ...snapshot,
          gameId: (p.gameId as ArcadeSnapshot['gameId']) || snapshot.gameId,
          roundSeed: Number(p.roundSeed || snapshot.roundSeed),
          playerAScore: 0,
          playerBScore: 0,
          winner: null,
          status: 'active',
          completed: false,
        };
      case 'arcade_score_update':
        return {
          ...snapshot,
          playerAScore: Math.max(snapshot.playerAScore, Number(p.scoreA || 0)),
          playerBScore: Math.max(snapshot.playerBScore, Number(p.scoreB || 0)),
        };
      case 'arcade_round_end':
        return {
          ...snapshot,
          winner: String(p.winner || 'Tie'),
          status: 'completed',
          completed: true,
        };
      case 'arcade_rematch':
        return {
          ...snapshot,
          roundNumber: snapshot.roundNumber + 1,
          roundSeed: Number(p.roundSeed || snapshot.roundSeed),
          playerAScore: 0,
          playerBScore: 0,
          winner: null,
          status: 'active',
          completed: false,
        };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'arcade',
      completed: snapshot.completed,
      summary: {
        gameId: snapshot.gameId,
        scoreA: snapshot.playerAScore,
        scoreB: snapshot.playerBScore,
        winner: snapshot.winner,
      },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { gameId: string; scoreA: number; scoreB: number; winner: string };
    return {
      kind: 'activity',
      title: `Arcade Duel · ${sum.gameId.replace('-', ' ')} (${sum.scoreA} - ${sum.scoreB})`,
      metadata: { activityType: 'arcade', ...sum },
    };
  },
};
export const arcadeActivityAdapter: RealtimeActivityAdapter<ArcadeSnapshot> =
  createAdapterFromDefinition(arcadeActivityDefinition);

// ==========================================
// 3. DIGITAL SCRAPBOOK ADAPTER
// ==========================================
export interface ScrapbookSnapshot {
  [key: string]: unknown;
  activityType: 'scrapbook';
  schemaVersion: number;
  status: StandardSessionState;
  theme: string;
  elements: Array<{ id: string; type: string; x: number; y: number; content: string; rotation?: number; imageUrl?: string; sub?: string }>;
  completed: boolean;
}

const SCRAPBOOK_EVENTS = [
  'scrapbook_element_add',
  'scrapbook_element_update',
  'scrapbook_element_remove',
  'scrapbook_theme_select',
  'scrapbook_clear',
] as const;

export const scrapbookActivityDefinition: ActivityDefinition<ScrapbookSnapshot, RealtimeActivityEvent> = {
  activityType: 'scrapbook',
  schemaVersion: 1,
  durableEvents: SCRAPBOOK_EVENTS,
  transientEvents: ['scrapbook_cursor_move'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): ScrapbookSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'scrapbook',
      schemaVersion: 1,
      status: 'active',
      theme: String(opts.theme || 'Our Month'),
      elements: [],
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(SCRAPBOOK_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'scrapbook_theme_select':
        return { ...snapshot, theme: String(p.theme || snapshot.theme) };
      case 'scrapbook_element_add':
        return {
          ...snapshot,
          elements: [
            ...snapshot.elements.filter((element) => element.id !== (p.element as any)?.id),
            p.element as any,
          ],
        };
      case 'scrapbook_element_update':
        return {
          ...snapshot,
          elements: snapshot.elements.map((el) => (el.id === p.id ? { ...el, ...(p.updates as any) } : el)),
        };
      case 'scrapbook_element_remove':
        return {
          ...snapshot,
          elements: snapshot.elements.filter((el) => el.id !== p.id),
        };
      case 'scrapbook_clear':
        return { ...snapshot, elements: [] };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'scrapbook',
      completed: snapshot.elements.length > 0,
      summary: { theme: snapshot.theme, elementCount: snapshot.elements.length },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { theme: string; elementCount: number };
    return {
      kind: 'activity',
      title: `Digital Scrapbook · ${sum.theme} (${sum.elementCount} memories)`,
      metadata: { activityType: 'scrapbook', ...sum },
    };
  },
};
export const scrapbookActivityAdapter: RealtimeActivityAdapter<ScrapbookSnapshot> =
  createAdapterFromDefinition(scrapbookActivityDefinition);

// ==========================================
// 4. IQ DUEL ADAPTER
// ==========================================
export interface IQSnapshot {
  [key: string]: unknown;
  activityType: 'iq';
  schemaVersion: number;
  status: StandardSessionState;
  category: string;
  roundIndex: number;
  totalRounds: number;
  scoreA: number;
  scoreB: number;
  revealed: boolean;
  completed: boolean;
}

const IQ_EVENTS = [
  'iq_category_select',
  'iq_answer_lock',
  'iq_round_reveal',
  'iq_next_question',
] as const;

export const iqActivityDefinition: ActivityDefinition<IQSnapshot, RealtimeActivityEvent> = {
  activityType: 'iq',
  schemaVersion: 1,
  durableEvents: IQ_EVENTS,
  transientEvents: ['iq_timer_tick'],
  privateFields: ['answerA', 'answerB'],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): IQSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'iq',
      schemaVersion: 1,
      status: 'active',
      category: String(opts.category || 'Logic & Sequences'),
      roundIndex: 0,
      totalRounds: Number(opts.totalRounds || 5),
      scoreA: 0,
      scoreB: 0,
      revealed: false,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(IQ_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'iq_category_select':
        return { ...snapshot, category: String(p.category || snapshot.category) };
      case 'iq_round_reveal':
        return {
          ...snapshot,
          revealed: true,
          scoreA: snapshot.scoreA + (p.correctA ? 1 : 0),
          scoreB: snapshot.scoreB + (p.correctB ? 1 : 0),
        };
      case 'iq_next_question': {
        const nextIdx = snapshot.roundIndex + 1;
        const isDone = nextIdx >= snapshot.totalRounds;
        return {
          ...snapshot,
          roundIndex: nextIdx,
          revealed: false,
          status: isDone ? 'completed' : 'active',
          completed: isDone,
        };
      }
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'iq',
      completed: snapshot.completed,
      summary: { category: snapshot.category, scoreA: snapshot.scoreA, scoreB: snapshot.scoreB },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { category: string; scoreA: number; scoreB: number };
    return {
      kind: 'activity',
      title: `IQ Duel · ${sum.category} (${sum.scoreA} vs ${sum.scoreB})`,
      metadata: { activityType: 'iq', ...sum },
    };
  },
};
export const iqActivityAdapter: RealtimeActivityAdapter<IQSnapshot> =
  createAdapterFromDefinition(iqActivityDefinition);

// ==========================================
// 5. RIDDLE NIGHT ADAPTER
// ==========================================
export interface RiddleSnapshot {
  [key: string]: unknown;
  activityType: 'riddle';
  schemaVersion: number;
  status: StandardSessionState;
  caseId: string;
  unlockedClues: number[];
  notes: string[];
  hintLevel: number;
  solved: boolean;
  completed: boolean;
}

const RIDDLE_EVENTS = [
  'riddle_case_select',
  'riddle_clue_unlock',
  'riddle_note_add',
  'riddle_hint_request',
  'riddle_answer_submit',
] as const;

export const riddleActivityDefinition: ActivityDefinition<RiddleSnapshot, RealtimeActivityEvent> = {
  activityType: 'riddle',
  schemaVersion: 1,
  durableEvents: RIDDLE_EVENTS,
  transientEvents: ['riddle_typing'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): RiddleSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'riddle',
      schemaVersion: 1,
      status: 'active',
      caseId: String(opts.caseId || 'the-lost-compass'),
      unlockedClues: [1],
      notes: [],
      hintLevel: 0,
      solved: false,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(RIDDLE_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'riddle_case_select':
        return {
          ...snapshot,
          caseId: String(p.caseId || snapshot.caseId),
          unlockedClues: [1],
          notes: [],
          hintLevel: 0,
          solved: false,
          completed: false,
          status: 'active',
        };
      case 'riddle_clue_unlock': {
        const id = Number(p.clueId);
        return {
          ...snapshot,
          unlockedClues: snapshot.unlockedClues.includes(id) ? snapshot.unlockedClues : [...snapshot.unlockedClues, id],
        };
      }
      case 'riddle_note_add':
        return { ...snapshot, notes: [...snapshot.notes, String(p.note || '')] };
      case 'riddle_hint_request':
        return { ...snapshot, hintLevel: Math.max(snapshot.hintLevel, Number(p.hintLevel || snapshot.hintLevel + 1)) };
      case 'riddle_answer_submit':
        return { ...snapshot, solved: Boolean(p.correct), status: p.correct ? 'completed' : 'active', completed: Boolean(p.correct) };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'riddle',
      completed: snapshot.solved,
      summary: { caseId: snapshot.caseId, cluesCount: snapshot.unlockedClues.length, hintsUsed: snapshot.hintLevel },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { caseId: string; hintsUsed: number };
    return {
      kind: 'activity',
      title: `Riddle Solved · Case of ${sum.caseId.replace(/-/g, ' ')}`,
      metadata: { activityType: 'riddle', ...sum },
    };
  },
};
export const riddleActivityAdapter: RealtimeActivityAdapter<RiddleSnapshot> =
  createAdapterFromDefinition(riddleActivityDefinition);

// ==========================================
// 6. THE LAB ADAPTER
// ==========================================
export interface LabSnapshot {
  [key: string]: unknown;
  activityType: 'lab';
  schemaVersion: number;
  status: StandardSessionState;
  preset: '25/5' | '45/10' | '60/15';
  isBreak: boolean;
  isRunning: boolean;
  completedBlocks: number;
  deadlineAt: string | null;
  remainingSeconds: number;
  taskA: string;
  taskB: string;
  completed: boolean;
}

const LAB_EVENTS = [
  'lab_preset_select',
  'lab_start',
  'lab_pause',
  'lab_resume',
  'lab_task_update',
  'lab_block_complete',
] as const;

export const labActivityDefinition: ActivityDefinition<LabSnapshot, RealtimeActivityEvent> = {
  activityType: 'lab',
  schemaVersion: 1,
  durableEvents: LAB_EVENTS,
  transientEvents: ['lab_presence_ping'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): LabSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'lab',
      schemaVersion: 1,
      status: 'active',
      preset: (opts.preset as any) || '25/5',
      isBreak: false,
      isRunning: false,
      completedBlocks: 0,
      deadlineAt: null,
      remainingSeconds: Number(opts.remainingSeconds || 25 * 60),
      taskA: '',
      taskB: '',
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(LAB_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'lab_preset_select':
        return { ...snapshot, preset: (p.preset as any) || snapshot.preset };
      case 'lab_start':
        return {
          ...snapshot,
          isRunning: true,
          deadlineAt: String(p.deadlineAt || snapshot.deadlineAt || ''),
          remainingSeconds: Number(p.remainingSeconds || snapshot.remainingSeconds),
        };
      case 'lab_pause':
        return { ...snapshot, isRunning: false, deadlineAt: null, remainingSeconds: Number(p.remainingSeconds || snapshot.remainingSeconds) };
      case 'lab_resume':
        return { ...snapshot, isRunning: true, deadlineAt: String(p.deadlineAt || ''), remainingSeconds: Number(p.remainingSeconds || snapshot.remainingSeconds) };
      case 'lab_task_update':
        return {
          ...snapshot,
          taskA: p.taskA !== undefined ? String(p.taskA) : snapshot.taskA,
          taskB: p.taskB !== undefined ? String(p.taskB) : snapshot.taskB,
        };
      case 'lab_block_complete':
        return {
          ...snapshot,
          completedBlocks: snapshot.completedBlocks + 1,
          isBreak: !snapshot.isBreak,
          deadlineAt: null,
        };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'lab',
      completed: snapshot.completedBlocks > 0,
      summary: { preset: snapshot.preset, blocks: snapshot.completedBlocks },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { preset: string; blocks: number };
    return {
      kind: 'activity',
      title: `Study Sanctuary Record · ${sum.blocks} Focus Blocks (${sum.preset})`,
      metadata: { activityType: 'lab', ...sum },
    };
  },
};
export const labActivityAdapter: RealtimeActivityAdapter<LabSnapshot> =
  createAdapterFromDefinition(labActivityDefinition);

// ==========================================
// 7. THE GREAT DEBATE ADAPTER
// ==========================================
export interface DebateSnapshot {
  [key: string]: unknown;
  activityType: 'debate';
  schemaVersion: number;
  status: StandardSessionState;
  packId: string;
  topic: string;
  phase: 'prep' | 'speakA' | 'speakB' | 'rebuttal' | 'vote' | 'verdict';
  votesA: number;
  votesB: number;
  winner: string | null;
  completed: boolean;
}

const DEBATE_EVENTS = [
  'debate_topic_select',
  'debate_phase_next',
  'debate_vote_submit',
  'debate_finish',
] as const;

export const debateActivityDefinition: ActivityDefinition<DebateSnapshot, RealtimeActivityEvent> = {
  activityType: 'debate',
  schemaVersion: 1,
  durableEvents: DEBATE_EVENTS,
  transientEvents: ['debate_timer_tick'],
  privateFields: ['notesA', 'notesB'],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): DebateSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'debate',
      schemaVersion: 1,
      status: 'active',
      packId: String(opts.packId || 'silly'),
      topic: String(opts.topic || 'Pineapple belongs on pizza forever'),
      phase: 'prep',
      votesA: 0,
      votesB: 0,
      winner: null,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(DEBATE_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'debate_topic_select':
        return { ...snapshot, topic: String(p.topic || snapshot.topic), phase: 'prep' };
      case 'debate_phase_next':
        return { ...snapshot, phase: (p.phase as any) || snapshot.phase };
      case 'debate_vote_submit': {
        const nextVotesA = snapshot.votesA + (p.voteFor === 'A' ? 1 : 0);
        const nextVotesB = snapshot.votesB + (p.voteFor === 'B' ? 1 : 0);
        return {
          ...snapshot,
          votesA: nextVotesA,
          votesB: nextVotesB,
          phase: 'verdict',
          winner: nextVotesA === nextVotesB ? 'Beautiful Draw' : nextVotesA > nextVotesB ? 'Side A' : 'Side B',
          status: 'completed',
          completed: true,
        };
      }
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'debate',
      completed: snapshot.completed,
      summary: { topic: snapshot.topic, winner: snapshot.winner },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { topic: string; winner: string };
    return {
      kind: 'activity',
      title: `The Daily Us Gazette · Verdict on "${sum.topic.slice(0, 30)}..."`,
      metadata: { activityType: 'debate', ...sum },
    };
  },
};
export const debateActivityAdapter: RealtimeActivityAdapter<DebateSnapshot> =
  createAdapterFromDefinition(debateActivityDefinition);

// ==========================================
// 8. SNAP HUNT ADAPTER
// ==========================================
export interface HuntSnapshot {
  [key: string]: unknown;
  activityType: 'hunt';
  schemaVersion: number;
  status: StandardSessionState;
  prompt: string;
  roundIndex: number;
  proofASubmitted: boolean;
  proofBSubmitted: boolean;
  proofAUrl: string | null;
  proofBUrl: string | null;
  deadlineAt: string | null;
  revealed: boolean;
  scoreA: number;
  scoreB: number;
  completed: boolean;
}

const HUNT_EVENTS = [
  'hunt_prompt_start',
  'hunt_proof_submit',
  'hunt_proof_reveal',
  'hunt_react',
  'hunt_next_round',
] as const;

export const huntActivityDefinition: ActivityDefinition<HuntSnapshot, RealtimeActivityEvent> = {
  activityType: 'hunt',
  schemaVersion: 1,
  durableEvents: HUNT_EVENTS,
  transientEvents: ['hunt_search_presence'],
  privateFields: ['proofAUrl', 'proofBUrl'],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): HuntSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'hunt',
      schemaVersion: 1,
      status: 'active',
      prompt: String(opts.prompt || 'Something that makes you think of our first date'),
      roundIndex: 0,
      proofASubmitted: false,
      proofBSubmitted: false,
      proofAUrl: null,
      proofBUrl: null,
      deadlineAt: null,
      revealed: false,
      scoreA: 0,
      scoreB: 0,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(HUNT_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'hunt_prompt_start':
        return {
          ...snapshot,
          prompt: String(p.prompt || snapshot.prompt),
          deadlineAt: String(p.deadlineAt || snapshot.deadlineAt || ''),
        };
      case 'hunt_proof_submit':
        return {
          ...snapshot,
          proofASubmitted: p.isA ? true : snapshot.proofASubmitted,
          proofBSubmitted: !p.isA ? true : snapshot.proofBSubmitted,
          proofAUrl: p.isA ? String(p.signedUrl || snapshot.proofAUrl || '') : snapshot.proofAUrl,
          proofBUrl: !p.isA ? String(p.signedUrl || snapshot.proofBUrl || '') : snapshot.proofBUrl,
        };
      case 'hunt_proof_reveal':
        return { ...snapshot, revealed: true };
      case 'hunt_react':
        return {
          ...snapshot,
          scoreA: Math.max(snapshot.scoreA, Number(p.scoreA ?? snapshot.scoreA)),
          scoreB: Math.max(snapshot.scoreB, Number(p.scoreB ?? snapshot.scoreB)),
        };
      case 'hunt_next_round':
        return {
          ...snapshot,
          roundIndex: snapshot.roundIndex + 1,
          prompt: String(p.prompt || snapshot.prompt),
          proofASubmitted: false,
          proofBSubmitted: false,
          proofAUrl: null,
          proofBUrl: null,
          deadlineAt: String(p.deadlineAt || ''),
          revealed: false,
        };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'hunt',
      completed: snapshot.scoreA > 0 || snapshot.scoreB > 0,
      summary: { rounds: snapshot.roundIndex + 1, scoreA: snapshot.scoreA, scoreB: snapshot.scoreB },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { rounds: number; scoreA: number; scoreB: number };
    return {
      kind: 'activity',
      title: `Snap Hunt Contact Sheet · ${sum.rounds} Rounds Explored`,
      metadata: { activityType: 'hunt', ...sum },
    };
  },
};
export const huntActivityAdapter: RealtimeActivityAdapter<HuntSnapshot> =
  createAdapterFromDefinition(huntActivityDefinition);

// ==========================================
// 9. OUR FUTURE ADAPTER
// ==========================================
export interface FutureSnapshot {
  [key: string]: unknown;
  activityType: 'future';
  schemaVersion: number;
  status: StandardSessionState;
  dreams: Array<{ id: string; title: string; column: 'someday' | 'exploring' | 'planning' | 'done'; creatorId?: string }>;
  completed: boolean;
}

const FUTURE_EVENTS = [
  'future_dream_add',
  'future_dream_move',
  'future_dream_update',
  'future_dream_archive',
] as const;

export const futureActivityDefinition: ActivityDefinition<FutureSnapshot, RealtimeActivityEvent> = {
  activityType: 'future',
  schemaVersion: 1,
  durableEvents: FUTURE_EVENTS,
  transientEvents: ['future_card_drag'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(): FutureSnapshot {
    return {
      activityType: 'future',
      schemaVersion: 1,
      status: 'active',
      dreams: [
        { id: '1', title: 'Our first seaside cottage weekend', column: 'someday' },
        { id: '2', title: 'Adopting a rescue dog together', column: 'exploring' },
      ],
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(FUTURE_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'future_dream_add':
        return { ...snapshot, dreams: [...snapshot.dreams, p.dream as any] };
      case 'future_dream_move':
        return {
          ...snapshot,
          dreams: snapshot.dreams.map((d) => (d.id === p.id ? { ...d, column: p.column as any } : d)),
        };
      case 'future_dream_archive':
        return { ...snapshot, dreams: snapshot.dreams.filter((d) => d.id !== p.id) };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'future',
      completed: snapshot.dreams.length > 0,
      summary: { totalDreams: snapshot.dreams.length },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { totalDreams: number };
    return {
      kind: 'activity',
      title: `Our Future Wall · ${sum.totalDreams} Dreams Shared`,
      metadata: { activityType: 'future', ...sum },
    };
  },
};
export const futureActivityAdapter: RealtimeActivityAdapter<FutureSnapshot> =
  createAdapterFromDefinition(futureActivityDefinition);

// ==========================================
// 10. BIRTHDAY GIFT ADAPTER
// ==========================================
export interface BirthdaySnapshot {
  [key: string]: unknown;
  activityType: 'birthday';
  schemaVersion: number;
  status: StandardSessionState;
  templateId: string;
  recipientName: string;
  sectionsCount: number;
  isRevealed: boolean;
  completed: boolean;
}

const BIRTHDAY_EVENTS = [
  'birthday_template_select',
  'birthday_section_update',
  'birthday_reveal',
] as const;

export const birthdayActivityDefinition: ActivityDefinition<BirthdaySnapshot, RealtimeActivityEvent> = {
  activityType: 'birthday',
  schemaVersion: 1,
  durableEvents: BIRTHDAY_EVENTS,
  transientEvents: ['birthday_preview_ping'],
  privateFields: ['giftContent'],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): BirthdaySnapshot {
    const opts = input.options || {};
    return {
      activityType: 'birthday',
      schemaVersion: 1,
      status: 'active',
      templateId: String(opts.templateId || 'parcel'),
      recipientName: String(opts.recipientName || 'My Love'),
      sectionsCount: 3,
      isRevealed: false,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(BIRTHDAY_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'birthday_template_select':
        return { ...snapshot, templateId: String(p.templateId || snapshot.templateId) };
      case 'birthday_section_update':
        return { ...snapshot, sectionsCount: Math.max(1, Number(p.sectionsCount || snapshot.sectionsCount)) };
      case 'birthday_reveal':
        return { ...snapshot, isRevealed: true, status: 'completed', completed: true };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'birthday',
      completed: snapshot.isRevealed,
      summary: { recipient: snapshot.recipientName, template: snapshot.templateId },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { recipient: string; template: string };
    return {
      kind: 'activity',
      title: `Birthday Gift · Wrapped Surprise for ${sum.recipient}`,
      metadata: { activityType: 'birthday', ...sum },
    };
  },
};
export const birthdayActivityAdapter: RealtimeActivityAdapter<BirthdaySnapshot> =
  createAdapterFromDefinition(birthdayActivityDefinition);

// ==========================================
// 11. FASHION SHOW ADAPTER
// ==========================================
export interface FashionSnapshot {
  [key: string]: unknown;
  activityType: 'fashion';
  schemaVersion: number;
  status: StandardSessionState;
  round: number;
  brief: string;
  lockedA: boolean;
  lockedB: boolean;
  revealed: boolean;
  scoreA: number;
  scoreB: number;
  completed: boolean;
}

const FASHION_EVENTS = [
  'fashion_brief_start',
  'fashion_look_lock',
  'fashion_reveal',
  'fashion_vote',
  'fashion_next_round',
] as const;

export const fashionActivityDefinition: ActivityDefinition<FashionSnapshot, RealtimeActivityEvent> = {
  activityType: 'fashion',
  schemaVersion: 1,
  durableEvents: FASHION_EVENTS,
  transientEvents: ['fashion_styling_presence'],
  privateFields: ['outfitA', 'outfitB'],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): FashionSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'fashion',
      schemaVersion: 1,
      status: 'active',
      round: 1,
      brief: String(opts.brief || 'First Date Coffee at 10 AM'),
      lockedA: false,
      lockedB: false,
      revealed: false,
      scoreA: 0,
      scoreB: 0,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(FASHION_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'fashion_look_lock':
        return {
          ...snapshot,
          lockedA: p.isA ? true : snapshot.lockedA,
          lockedB: !p.isA ? true : snapshot.lockedB,
        };
      case 'fashion_reveal':
        return { ...snapshot, revealed: true };
      case 'fashion_vote':
        return {
          ...snapshot,
          scoreA: snapshot.scoreA + Number(p.scoreA || 0),
          scoreB: snapshot.scoreB + Number(p.scoreB || 0),
        };
      case 'fashion_next_round': {
        const nextRound = snapshot.round + 1;
        const isDone = nextRound > 3;
        return {
          ...snapshot,
          round: nextRound,
          brief: String(p.brief || 'Sunday Stroll & Market'),
          lockedA: false,
          lockedB: false,
          revealed: false,
          status: isDone ? 'completed' : 'active',
          completed: isDone,
        };
      }
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'fashion',
      completed: snapshot.completed,
      summary: { rounds: snapshot.round, scoreA: snapshot.scoreA, scoreB: snapshot.scoreB },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { rounds: number; scoreA: number; scoreB: number };
    return {
      kind: 'activity',
      title: `Runway Programme · 3 Rounds (${sum.scoreA} vs ${sum.scoreB})`,
      metadata: { activityType: 'fashion', ...sum },
    };
  },
};
export const fashionActivityAdapter: RealtimeActivityAdapter<FashionSnapshot> =
  createAdapterFromDefinition(fashionActivityDefinition);

// ==========================================
// 12. MATCHING SHIRTS ADAPTER
// ==========================================
export interface ShirtsSnapshot {
  [key: string]: unknown;
  activityType: 'shirts';
  schemaVersion: number;
  status: StandardSessionState;
  motifId: string;
  phrase: string;
  colorA: string;
  colorB: string;
  view: 'front' | 'back';
  completed: boolean;
}

const SHIRTS_EVENTS = [
  'shirts_motif_select',
  'shirts_text_update',
  'shirts_color_update',
  'shirts_view_switch',
] as const;

export const shirtsActivityDefinition: ActivityDefinition<ShirtsSnapshot, RealtimeActivityEvent> = {
  activityType: 'shirts',
  schemaVersion: 1,
  durableEvents: SHIRTS_EVENTS,
  transientEvents: ['shirts_preview_sync'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): ShirtsSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'shirts',
      schemaVersion: 1,
      status: 'active',
      motifId: String(opts.motifId || 'connected-line'),
      phrase: String(opts.phrase || 'Better Together'),
      colorA: '#2d2627',
      colorB: '#faf6ee',
      view: 'front',
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(SHIRTS_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'shirts_motif_select':
        return { ...snapshot, motifId: String(p.motifId || snapshot.motifId) };
      case 'shirts_text_update':
        return { ...snapshot, phrase: String(p.phrase || snapshot.phrase) };
      case 'shirts_color_update':
        return {
          ...snapshot,
          colorA: p.colorA ? String(p.colorA) : snapshot.colorA,
          colorB: p.colorB ? String(p.colorB) : snapshot.colorB,
        };
      case 'shirts_view_switch':
        return { ...snapshot, view: (p.view as any) || (snapshot.view === 'front' ? 'back' : 'front') };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'shirts',
      completed: true,
      summary: { motif: snapshot.motifId, phrase: snapshot.phrase },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { motif: string; phrase: string };
    return {
      kind: 'activity',
      title: `Matching Shirts Design · "${sum.phrase}"`,
      metadata: { activityType: 'shirts', ...sum },
    };
  },
};
export const shirtsActivityAdapter: RealtimeActivityAdapter<ShirtsSnapshot> =
  createAdapterFromDefinition(shirtsActivityDefinition);

// ==========================================
// 13. LOVE FORECAST ADAPTER
// ==========================================
export interface ForecastSnapshot {
  [key: string]: unknown;
  activityType: 'forecast';
  schemaVersion: number;
  status: StandardSessionState;
  date: string;
  checkedInA: boolean;
  checkedInB: boolean;
  condition: string | null;
  completed: boolean;
}

const FORECAST_EVENTS = [
  'forecast_checkin_submit',
  'forecast_reveal',
] as const;

export const forecastActivityDefinition: ActivityDefinition<ForecastSnapshot, RealtimeActivityEvent> = {
  activityType: 'forecast',
  schemaVersion: 1,
  durableEvents: FORECAST_EVENTS,
  transientEvents: ['forecast_typing'],
  privateFields: ['metricsA', 'metricsB'],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(): ForecastSnapshot {
    return {
      activityType: 'forecast',
      schemaVersion: 1,
      status: 'active',
      date: new Date().toISOString().slice(0, 10),
      checkedInA: false,
      checkedInB: false,
      condition: null,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(FORECAST_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'forecast_checkin_submit':
        return {
          ...snapshot,
          checkedInA: p.isA ? true : snapshot.checkedInA,
          checkedInB: !p.isA ? true : snapshot.checkedInB,
        };
      case 'forecast_reveal':
        return {
          ...snapshot,
          condition: String(p.condition || 'Soft Morning With Clear Skies'),
          status: 'completed',
          completed: true,
        };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'forecast',
      completed: Boolean(snapshot.condition),
      summary: { date: snapshot.date, condition: snapshot.condition },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { date: string; condition: string };
    return {
      kind: 'activity',
      title: `Love Forecast · ${sum.condition || 'Soft Morning'} (${sum.date})`,
      metadata: { activityType: 'forecast', ...sum },
    };
  },
};
export const forecastActivityAdapter: RealtimeActivityAdapter<ForecastSnapshot> =
  createAdapterFromDefinition(forecastActivityDefinition);

// ==========================================
// 14. TIMEZONE & REUNION ADAPTER
// ==========================================
export interface TimezoneSnapshot {
  [key: string]: unknown;
  activityType: 'timezone';
  schemaVersion: number;
  status: StandardSessionState;
  cityA: string;
  timezoneA: string;
  cityB: string;
  timezoneB: string;
  reunionDate: string | null;
  packingItems: Array<{ id: string; text: string; done: boolean }>;
  completed: boolean;
}

const TIMEZONE_EVENTS = [
  'timezone_city_update',
  'timezone_reunion_set',
  'timezone_packing_toggle',
  'timezone_packing_add',
] as const;

export const timezoneActivityDefinition: ActivityDefinition<TimezoneSnapshot, RealtimeActivityEvent> = {
  activityType: 'timezone',
  schemaVersion: 1,
  durableEvents: TIMEZONE_EVENTS,
  transientEvents: ['timezone_globe_rotate'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(input: StartActivityInput): TimezoneSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'timezone',
      schemaVersion: 1,
      status: 'active',
      cityA: String(opts.cityA || 'Tokyo'),
      timezoneA: String(opts.timezoneA || 'Asia/Tokyo'),
      cityB: String(opts.cityB || 'San Francisco'),
      timezoneB: String(opts.timezoneB || 'America/Los_Angeles'),
      reunionDate: String(opts.reunionDate || '2026-10-15'),
      packingItems: [
        { id: '1', text: 'Comfortable hoodie for flight', done: true },
        { id: '2', text: 'Camera charger', done: false },
      ],
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(TIMEZONE_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'timezone_city_update':
        return {
          ...snapshot,
          cityA: p.cityA ? String(p.cityA) : snapshot.cityA,
          timezoneA: p.timezoneA ? String(p.timezoneA) : snapshot.timezoneA,
          cityB: p.cityB ? String(p.cityB) : snapshot.cityB,
          timezoneB: p.timezoneB ? String(p.timezoneB) : snapshot.timezoneB,
        };
      case 'timezone_reunion_set':
        return { ...snapshot, reunionDate: String(p.reunionDate || snapshot.reunionDate) };
      case 'timezone_packing_toggle':
        return {
          ...snapshot,
          packingItems: snapshot.packingItems.map((item) => (item.id === p.id ? { ...item, done: !item.done } : item)),
        };
      case 'timezone_packing_add':
        return {
          ...snapshot,
          packingItems: [...snapshot.packingItems, { id: crypto.randomUUID(), text: String(p.text || ''), done: false }],
        };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'timezone',
      completed: Boolean(snapshot.reunionDate),
      summary: { cityA: snapshot.cityA, cityB: snapshot.cityB, reunionDate: snapshot.reunionDate },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { cityA: string; cityB: string; reunionDate: string };
    return {
      kind: 'activity',
      title: `Countdown to Reunion · ${sum.cityA} ✈️ ${sum.cityB}`,
      metadata: { activityType: 'timezone', ...sum },
    };
  },
};
export const timezoneActivityAdapter: RealtimeActivityAdapter<TimezoneSnapshot> =
  createAdapterFromDefinition(timezoneActivityDefinition);

// ==========================================
// 15. 100 DATES BUCKET LIST ADAPTER
// ==========================================
export interface BucketSnapshot {
  [key: string]: unknown;
  activityType: 'bucket';
  schemaVersion: number;
  status: StandardSessionState;
  completedIds: string[];
  plannedIds: string[];
  favouriteIds: string[];
  completed: boolean;
}

const BUCKET_EVENTS = [
  'bucket_status_change',
  'bucket_scratch_reveal',
] as const;

export const bucketActivityDefinition: ActivityDefinition<BucketSnapshot, RealtimeActivityEvent> = {
  activityType: 'bucket',
  schemaVersion: 1,
  durableEvents: BUCKET_EVENTS,
  transientEvents: ['bucket_filter_change'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(): BucketSnapshot {
    return {
      activityType: 'bucket',
      schemaVersion: 1,
      status: 'active',
      completedIds: ['1', '5'],
      plannedIds: ['2', '8'],
      favouriteIds: ['1'],
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(BUCKET_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    const id = String(p.id || '');
    switch (event.type) {
      case 'bucket_status_change': {
        const isCompleted = Boolean(p.isCompleted);
        const nextCompleted = isCompleted
          ? [...new Set([...snapshot.completedIds, id])]
          : snapshot.completedIds.filter((x) => x !== id);
        return { ...snapshot, completedIds: nextCompleted };
      }
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'bucket',
      completed: snapshot.completedIds.length > 0,
      summary: { completedCount: snapshot.completedIds.length },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { completedCount: number };
    return {
      kind: 'activity',
      title: `100 Dates Milestone · ${sum.completedCount} Adventures Done`,
      metadata: { activityType: 'bucket', ...sum },
    };
  },
};
export const bucketActivityAdapter: RealtimeActivityAdapter<BucketSnapshot> =
  createAdapterFromDefinition(bucketActivityDefinition);

// ==========================================
// 16. DATE NIGHT PLANNER ADAPTER
// ==========================================
export interface DatePlannerSnapshot {
  [key: string]: unknown;
  activityType: 'date';
  schemaVersion: number;
  status: StandardSessionState;
  itinerary: Array<{ id: string; title: string; duration: number; path: string; done: boolean }>;
  activeStep: number;
  isLive: boolean;
  deadlineAt: string | null;
  remainingSeconds: number;
  completed: boolean;
}

const DATE_PLANNER_EVENTS = [
  'date_itinerary_build',
  'date_itinerary_reorder',
  'date_step_start',
  'date_step_complete',
  'date_finish',
] as const;

export const datePlannerActivityDefinition: ActivityDefinition<DatePlannerSnapshot, RealtimeActivityEvent> = {
  activityType: 'date',
  schemaVersion: 1,
  durableEvents: DATE_PLANNER_EVENTS,
  transientEvents: ['date_timer_sync'],
  privateFields: [],
  reconnectBehavior: 'loading_snapshot',

  initialSnapshot(): DatePlannerSnapshot {
    return {
      activityType: 'date',
      schemaVersion: 1,
      status: 'active',
      itinerary: [
        { id: '1', title: 'Honest Cards: Warm Up', duration: 15, path: '/cards', done: false },
        { id: '2', title: 'The Photobooth Strip', duration: 15, path: '/photobooth', done: false },
        { id: '3', title: 'Letters to Tomorrow', duration: 20, path: '/letter', done: false },
      ],
      activeStep: 0,
      isLive: false,
      deadlineAt: null,
      remainingSeconds: 0,
      completed: false,
    };
  },

  validateEvent(event) {
    return validateEventSet(DATE_PLANNER_EVENTS, event);
  },

  reduce(snapshot, event) {
    const p = (event.payload as Record<string, unknown>) || {};
    switch (event.type) {
      case 'date_itinerary_build':
        return { ...snapshot, itinerary: (p.itinerary as any) || snapshot.itinerary };
      case 'date_step_start':
        return {
          ...snapshot,
          activeStep: Number(p.stepIndex ?? snapshot.activeStep),
          isLive: Boolean(p.isLive ?? true),
          deadlineAt: p.deadlineAt ? String(p.deadlineAt) : null,
          remainingSeconds: Number(p.remainingSeconds || snapshot.remainingSeconds),
        };
      case 'date_step_complete': {
        const idx = Number(p.stepIndex ?? snapshot.activeStep);
        const updated = snapshot.itinerary.map((item, i) => (i === idx ? { ...item, done: true } : item));
        const allDone = updated.every((item) => item.done);
        return {
          ...snapshot,
          itinerary: updated,
          activeStep: Math.min(updated.length - 1, idx + 1),
          status: allDone ? 'completed' : 'active',
          completed: allDone,
          deadlineAt: null,
          remainingSeconds: 0,
        };
      }
      case 'date_finish':
        return { ...snapshot, status: 'completed', completed: true };
      default:
        return snapshot;
    }
  },

  transitionRules: (_s, _a, userId) => Boolean(userId),

  summarize(snapshot): ActivityResult {
    return {
      activityType: 'date',
      completed: snapshot.completed,
      summary: { stepsCompleted: snapshot.itinerary.filter((s) => s.done).length, totalSteps: snapshot.itinerary.length },
    };
  },

  buildKeepsake(result): KeepsakeDraft | null {
    const sum = result.summary as { stepsCompleted: number; totalSteps: number };
    return {
      kind: 'activity',
      title: `Date Night Itinerary Receipt · ${sum.stepsCompleted}/${sum.totalSteps} Acts Completed`,
      metadata: { activityType: 'date', ...sum },
    };
  },
};
export const datePlannerActivityAdapter: RealtimeActivityAdapter<DatePlannerSnapshot> =
  createAdapterFromDefinition(datePlannerActivityDefinition);

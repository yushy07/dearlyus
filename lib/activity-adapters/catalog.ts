'use client';

import type {
  RealtimeActivityAdapter,
  StartActivityInput,
  ValidationResult,
  ActivityResult,
  KeepsakeDraft,
} from './types';

// ==========================================
// 1. CARDS ADAPTER
// ==========================================
export interface CardsSnapshot {
  [key: string]: unknown;
  activityType: 'cards';
  schemaVersion: number;
  deckId: string;
  cardIndex: number;
  flipped: boolean;
  totalCards: number;
  completed: boolean;
}

export const cardsActivityAdapter: RealtimeActivityAdapter<CardsSnapshot> = {
  activityType: 'cards',
  schemaVersion: 1,
  createInitialSnapshot(input: StartActivityInput): CardsSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'cards',
      schemaVersion: 1,
      deckId: String(opts.deckId || 'deep-water'),
      cardIndex: Number(opts.cardIndex || 0),
      flipped: false,
      totalCards: Number(opts.totalCards || 20),
      completed: false,
    };
  },
  validateEvent(event): ValidationResult {
    const allowed = ['cards_draw', 'cards_flip', 'cards_next', 'cards_scratch', 'gentle_skip'];
    return allowed.includes(event.type)
      ? { valid: true }
      : { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} not allowed for cards.` };
  },
  reduce(snapshot: CardsSnapshot, event): CardsSnapshot {
    switch (event.type) {
      case 'cards_flip':
        return { ...snapshot, flipped: true };
      case 'cards_scratch':
        return { ...snapshot, flipped: true };
      case 'cards_next': {
        const nextIdx = (snapshot.cardIndex + 1);
        const isDone = nextIdx >= snapshot.totalCards;
        return { ...snapshot, cardIndex: nextIdx, flipped: false, completed: isDone };
      }
      case 'gentle_skip':
        return { ...snapshot, cardIndex: snapshot.cardIndex + 1, flipped: false };
      default:
        return snapshot;
    }
  },
  canTransition(snapshot, action, userId): boolean {
    return Boolean(userId);
  },
  summarize(snapshot: CardsSnapshot): ActivityResult {
    return {
      activityType: 'cards',
      completed: snapshot.completed,
      summary: { deckId: snapshot.deckId, cardsExplored: snapshot.cardIndex, totalCards: snapshot.totalCards },
    };
  },
  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const sum = result.summary as { deckId: string; cardsExplored: number };
    return {
      kind: 'activity',
      title: `Deck of Truths · ${sum.cardsExplored} Moments`,
      metadata: { activityType: 'cards', deckId: sum.deckId, cardsExplored: sum.cardsExplored },
    };
  },
};

// ==========================================
// 2. HOST MODE ADAPTER
// ==========================================
export interface HostSnapshot {
  [key: string]: unknown;
  activityType: 'host';
  schemaVersion: number;
  promptIndex: number;
  activeSpeaker: string;
  theme: string;
  commentary: string[];
  completed: boolean;
}

export const hostActivityAdapter: RealtimeActivityAdapter<HostSnapshot> = {
  activityType: 'host',
  schemaVersion: 1,
  createInitialSnapshot(input: StartActivityInput): HostSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'host',
      schemaVersion: 1,
      promptIndex: Number(opts.promptIndex || 0),
      activeSpeaker: String(opts.activeSpeaker || input.userId),
      theme: String(opts.theme || 'Romantic Intimacy'),
      commentary: [],
      completed: false,
    };
  },
  validateEvent(event): ValidationResult {
    const allowed = ['host_prompt_change', 'host_speaker_switch', 'host_commentary', 'host_finish'];
    return allowed.includes(event.type)
      ? { valid: true }
      : { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} not allowed for host.` };
  },
  reduce(snapshot: HostSnapshot, event): HostSnapshot {
    switch (event.type) {
      case 'host_prompt_change': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return { ...snapshot, promptIndex: Number(payload.promptIndex ?? snapshot.promptIndex + 1) };
      }
      case 'host_speaker_switch': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return { ...snapshot, activeSpeaker: String(payload.activeSpeaker || '') };
      }
      case 'host_commentary': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return { ...snapshot, commentary: [...snapshot.commentary, String(payload.text || '')] };
      }
      case 'host_finish':
        return { ...snapshot, completed: true };
      default:
        return snapshot;
    }
  },
  canTransition(snapshot, action, userId): boolean {
    return Boolean(userId);
  },
  summarize(snapshot: HostSnapshot): ActivityResult {
    return {
      activityType: 'host',
      completed: snapshot.completed,
      summary: { theme: snapshot.theme, promptsDiscussed: snapshot.promptIndex, commentaryCount: snapshot.commentary.length },
    };
  },
  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const sum = result.summary as { theme: string; promptsDiscussed: number };
    return {
      kind: 'activity',
      title: `AI Host Night · ${sum.theme}`,
      metadata: { activityType: 'host', theme: sum.theme, promptsDiscussed: sum.promptsDiscussed },
    };
  },
};

// ==========================================
// 3. MATCH ADAPTER
// ==========================================
export interface MatchSnapshot {
  [key: string]: unknown;
  activityType: 'match';
  schemaVersion: number;
  pairIndex: number;
  score: number;
  totalPairs: number;
  completed: boolean;
}

export const matchActivityAdapter: RealtimeActivityAdapter<MatchSnapshot> = {
  activityType: 'match',
  schemaVersion: 1,
  createInitialSnapshot(input: StartActivityInput): MatchSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'match',
      schemaVersion: 1,
      pairIndex: 0,
      score: 0,
      totalPairs: Number(opts.totalPairs || 10),
      completed: false,
    };
  },
  validateEvent(event): ValidationResult {
    const allowed = ['match_select', 'match_reveal', 'match_next'];
    return allowed.includes(event.type)
      ? { valid: true }
      : { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} not allowed for match.` };
  },
  reduce(snapshot: MatchSnapshot, event): MatchSnapshot {
    switch (event.type) {
      case 'match_reveal': {
        const payload = (event.payload as Record<string, unknown>) || {};
        const isMatch = Boolean(payload.isMatch);
        return { ...snapshot, score: isMatch ? snapshot.score + 1 : snapshot.score };
      }
      case 'match_next': {
        const next = snapshot.pairIndex + 1;
        return { ...snapshot, pairIndex: next, completed: next >= snapshot.totalPairs };
      }
      default:
        return snapshot;
    }
  },
  canTransition(snapshot, action, userId): boolean {
    return Boolean(userId);
  },
  summarize(snapshot: MatchSnapshot): ActivityResult {
    return {
      activityType: 'match',
      completed: snapshot.completed,
      summary: { score: snapshot.score, totalPairs: snapshot.totalPairs },
    };
  },
  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const sum = result.summary as { score: number; totalPairs: number };
    return {
      kind: 'activity',
      title: `Match Telepathy · ${sum.score}/${sum.totalPairs}`,
      metadata: { activityType: 'match', score: sum.score, totalPairs: sum.totalPairs },
    };
  },
};

// ==========================================
// 4. DEBATE & COURT ADAPTER
// ==========================================
export interface CourtSnapshot {
  [key: string]: unknown;
  activityType: 'court';
  schemaVersion: number;
  caseTitle: string;
  defendant: string;
  plaintiff: string;
  plea: string;
  verdict: string | null;
  penalty: string | null;
  stage: 'filing' | 'arguments' | 'verdict' | 'closed';
  completed: boolean;
}

export const courtActivityAdapter: RealtimeActivityAdapter<CourtSnapshot> = {
  activityType: 'court',
  schemaVersion: 1,
  createInitialSnapshot(input: StartActivityInput): CourtSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'court',
      schemaVersion: 1,
      caseTitle: String(opts.caseTitle || 'The Case of the Missing Blankets 🧸'),
      defendant: String(opts.defendant || 'Partner B'),
      plaintiff: String(opts.plaintiff || 'Partner A'),
      plea: '',
      verdict: null,
      penalty: null,
      stage: 'filing',
      completed: false,
    };
  },
  validateEvent(event): ValidationResult {
    const allowed = ['court_plea', 'court_argument', 'court_verdict', 'court_close'];
    return allowed.includes(event.type)
      ? { valid: true }
      : { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} not allowed for court.` };
  },
  reduce(snapshot: CourtSnapshot, event): CourtSnapshot {
    switch (event.type) {
      case 'court_plea': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return { ...snapshot, plea: String(payload.plea || ''), stage: 'arguments' };
      }
      case 'court_verdict': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return {
          ...snapshot,
          verdict: String(payload.verdict || 'GUILTY OF BEING ADORABLE'),
          penalty: String(payload.penalty || '30-minute cuddle tax'),
          stage: 'verdict',
        };
      }
      case 'court_close':
        return { ...snapshot, stage: 'closed', completed: true };
      default:
        return snapshot;
    }
  },
  canTransition(snapshot, action, userId): boolean {
    return Boolean(userId);
  },
  summarize(snapshot: CourtSnapshot): ActivityResult {
    return {
      activityType: 'court',
      completed: snapshot.completed,
      summary: { caseTitle: snapshot.caseTitle, verdict: snapshot.verdict, penalty: snapshot.penalty },
    };
  },
  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const sum = result.summary as { caseTitle: string; verdict: string; penalty: string };
    return {
      kind: 'activity',
      title: `Love Court Ruling · ${sum.caseTitle}`,
      metadata: { activityType: 'court', verdict: sum.verdict, penalty: sum.penalty },
    };
  },
};

// ==========================================
// 5. DARE ADAPTER
// ==========================================
export interface DareSnapshot {
  [key: string]: unknown;
  activityType: 'dare';
  schemaVersion: number;
  currentDare: string;
  category: string;
  status: 'pending' | 'accepted' | 'completed' | 'rerolled';
  completedCount: number;
  completed: boolean;
}

export const dareActivityAdapter: RealtimeActivityAdapter<DareSnapshot> = {
  activityType: 'dare',
  schemaVersion: 1,
  createInitialSnapshot(input: StartActivityInput): DareSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'dare',
      schemaVersion: 1,
      currentDare: String(opts.currentDare || 'Sing the chorus of our favorite song without smiling! 🎤'),
      category: String(opts.category || 'Playful'),
      status: 'pending',
      completedCount: 0,
      completed: false,
    };
  },
  validateEvent(event): ValidationResult {
    const allowed = ['dare_accept', 'dare_complete', 'dare_reroll', 'dare_finish'];
    return allowed.includes(event.type)
      ? { valid: true }
      : { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} not allowed for dare.` };
  },
  reduce(snapshot: DareSnapshot, event): DareSnapshot {
    switch (event.type) {
      case 'dare_accept':
        return { ...snapshot, status: 'accepted' };
      case 'dare_complete':
        return { ...snapshot, status: 'completed', completedCount: snapshot.completedCount + 1 };
      case 'dare_reroll': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return {
          ...snapshot,
          currentDare: String(payload.newDare || 'Send a photo making your funniest face 🤪'),
          status: 'pending',
        };
      }
      case 'dare_finish':
        return { ...snapshot, completed: true };
      default:
        return snapshot;
    }
  },
  canTransition(snapshot, action, userId): boolean {
    return Boolean(userId);
  },
  summarize(snapshot: DareSnapshot): ActivityResult {
    return {
      activityType: 'dare',
      completed: snapshot.completed,
      summary: { completedCount: snapshot.completedCount },
    };
  },
  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const sum = result.summary as { completedCount: number };
    return {
      kind: 'activity',
      title: `Couple Dare Night · ${sum.completedCount} Dares Conquered`,
      metadata: { activityType: 'dare', count: sum.completedCount },
    };
  },
};

// ==========================================
// 6. PHOTOBOOTH TIMING ADAPTER
// ==========================================
export interface PhotoboothSnapshot {
  [key: string]: unknown;
  activityType: 'photobooth';
  schemaVersion: number;
  countdownSeconds: number;
  activeFilter: string;
  frameStyle: string;
  photoCount: number;
  status: 'standby' | 'countdown' | 'flash' | 'review';
  completed: boolean;
}

export const photoboothActivityAdapter: RealtimeActivityAdapter<PhotoboothSnapshot> = {
  activityType: 'photobooth',
  schemaVersion: 1,
  createInitialSnapshot(input: StartActivityInput): PhotoboothSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'photobooth',
      schemaVersion: 1,
      countdownSeconds: 3,
      activeFilter: String(opts.filter || 'vintage-film'),
      frameStyle: String(opts.frameStyle || 'classic-white'),
      photoCount: 0,
      status: 'standby',
      completed: false,
    };
  },
  validateEvent(event): ValidationResult {
    const allowed = ['photo_start_countdown', 'photo_tick', 'photo_shutter', 'photo_filter', 'photo_finish'];
    return allowed.includes(event.type)
      ? { valid: true }
      : { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} not allowed for photobooth.` };
  },
  reduce(snapshot: PhotoboothSnapshot, event): PhotoboothSnapshot {
    switch (event.type) {
      case 'photo_start_countdown':
        return { ...snapshot, status: 'countdown', countdownSeconds: 3 };
      case 'photo_tick': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return { ...snapshot, countdownSeconds: Number(payload.seconds ?? snapshot.countdownSeconds - 1) };
      }
      case 'photo_shutter':
        return { ...snapshot, status: 'flash', photoCount: snapshot.photoCount + 1 };
      case 'photo_filter': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return { ...snapshot, activeFilter: String(payload.filter || snapshot.activeFilter) };
      }
      case 'photo_finish':
        return { ...snapshot, status: 'review', completed: true };
      default:
        return snapshot;
    }
  },
  canTransition(snapshot, action, userId): boolean {
    return Boolean(userId);
  },
  summarize(snapshot: PhotoboothSnapshot): ActivityResult {
    return {
      activityType: 'photobooth',
      completed: snapshot.completed,
      summary: { photoCount: snapshot.photoCount, filter: snapshot.activeFilter },
    };
  },
  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const sum = result.summary as { photoCount: number; filter: string };
    return {
      kind: 'activity',
      title: `Vintage Photostrip · ${sum.photoCount} Shots`,
      metadata: { activityType: 'photobooth', filter: sum.filter, count: sum.photoCount },
    };
  },
};

// ==========================================
// 7. PASSPORT & SCRAPBOOK ADAPTER
// ==========================================
export interface PassportSnapshot {
  [key: string]: unknown;
  activityType: 'passport';
  schemaVersion: number;
  stampsCount: number;
  entriesCount: number;
  activePage: number;
  completed: boolean;
}

export const passportActivityAdapter: RealtimeActivityAdapter<PassportSnapshot> = {
  activityType: 'passport',
  schemaVersion: 1,
  createInitialSnapshot(input: StartActivityInput): PassportSnapshot {
    const opts = input.options || {};
    return {
      activityType: 'passport',
      schemaVersion: 1,
      stampsCount: Number(opts.stampsCount || 0),
      entriesCount: Number(opts.entriesCount || 0),
      activePage: 1,
      completed: false,
    };
  },
  validateEvent(event): ValidationResult {
    const allowed = ['passport_stamp_add', 'scrapbook_entry_add', 'page_turn'];
    return allowed.includes(event.type)
      ? { valid: true }
      : { valid: false, code: 'INVALID_EVENT', message: `Event ${event.type} not allowed for passport.` };
  },
  reduce(snapshot: PassportSnapshot, event): PassportSnapshot {
    switch (event.type) {
      case 'passport_stamp_add':
        return { ...snapshot, stampsCount: snapshot.stampsCount + 1 };
      case 'scrapbook_entry_add':
        return { ...snapshot, entriesCount: snapshot.entriesCount + 1 };
      case 'page_turn': {
        const payload = (event.payload as Record<string, unknown>) || {};
        return { ...snapshot, activePage: Number(payload.page ?? snapshot.activePage + 1) };
      }
      default:
        return snapshot;
    }
  },
  canTransition(snapshot, action, userId): boolean {
    return Boolean(userId);
  },
  summarize(snapshot: PassportSnapshot): ActivityResult {
    return {
      activityType: 'passport',
      completed: true,
      summary: { stampsCount: snapshot.stampsCount, entriesCount: snapshot.entriesCount },
    };
  },
  buildKeepsake(result: ActivityResult): KeepsakeDraft | null {
    const sum = result.summary as { stampsCount: number; entriesCount: number };
    return {
      kind: 'activity',
      title: `Love Passport & Scrapbook · ${sum.stampsCount} Stamps`,
      metadata: { activityType: 'passport', stamps: sum.stampsCount, entries: sum.entriesCount },
    };
  },
};

// ==========================================
// REGISTRY
// ==========================================
export const catalogActivityAdapters: Record<string, RealtimeActivityAdapter> = {
  cards: cardsActivityAdapter,
  host: hostActivityAdapter,
  match: matchActivityAdapter,
  court: courtActivityAdapter,
  debate: courtActivityAdapter,
  dare: dareActivityAdapter,
  photobooth: photoboothActivityAdapter,
  passport: passportActivityAdapter,
  scrapbook: passportActivityAdapter,
};

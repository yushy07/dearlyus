/**
 * Cupidot Shared-Pet State & Progression Engine
 * Source of truth: Cupidot_Features_and_Functionality.md
 */

import {
  CupidotProductState,
  CupidotState,
  CupidotMood,
  CupidotChapter,
  CHAPTER_DEFINITIONS,
  SafePresenceState,
  HomeRewardItem,
  CoupleRitual,
  MemorySeed,
  CupidotHomeState,
  GuidanceMode,
  RomanceLevel,
} from '@/types/cupidot';

import { getCuratedDialogue } from './cupidot-behavior';

export {
  computeEffectiveRomanceLevel,
  downgradeRomanceLevel,
  canIncludeInNotification,
  CURATED_DIALOGUE_LIBRARY,
  getCuratedDialogue,
  canCupidotSpeak,
  createDefaultInterruptionBudget,
  handleActivitySkip,
  handleSafetyBoundary,
  validateStructuredAiOutput,
} from './cupidot-behavior';

// Prohibited guilt phrases as specified by the blueprint
export const PROHIBITED_GUILT_PHRASES = [
  'cupidot is lonely',
  'your partner is disappointed',
  'you are losing your streak',
  'why haven’t you replied',
  'why haven\'t you replied',
  'missed streak',
  'streak broken',
  'neglected',
  'punishment',
  'penalty',
  'you failed',
];

/** Check if any text accidentally contains guilt language. */
export function containsGuiltPhrasing(text: string): boolean {
  const lower = text.toLowerCase();
  return PROHIBITED_GUILT_PHRASES.some((phrase) => lower.includes(phrase));
}

/** Sanitize safe presence (guarantees no device, IP, location, or tab telemetry is exposed). */
export function sanitizeSafePresence(
  onlineOrPayload?: boolean | Record<string, unknown>,
  interaction?: string | null,
  isReconnecting = false
): SafePresenceState & { state: SafePresenceState } {
  const safeStates: SafePresenceState[] = [
    'here',
    'ready',
    'choosing',
    'writing',
    'drawing',
    'reconnecting',
    'away',
  ];

  let resolved: SafePresenceState = 'here';

  if (typeof onlineOrPayload === 'object' && onlineOrPayload !== null) {
    const raw = typeof onlineOrPayload.state === 'string' ? onlineOrPayload.state : undefined;
    resolved = safeStates.includes(raw as SafePresenceState) ? (raw as SafePresenceState) : 'here';
  } else {
    const online = Boolean(onlineOrPayload ?? true);
    if (isReconnecting) {
      resolved = 'reconnecting';
    } else if (!online) {
      resolved = 'away';
    } else {
      switch (interaction) {
        case 'ready':
          resolved = 'ready';
          break;
        case 'choosing':
          resolved = 'choosing';
          break;
        case 'writing':
          resolved = 'writing';
          break;
        case 'drawing':
          resolved = 'drawing';
          break;
        default:
          resolved = 'here';
      }
    }
  }

  const strObj = new String(resolved);
  (strObj as any).state = resolved;
  return strObj as any;
}

/** Built-in Home Collectibles & Souvenirs across Chapters 1 to 5. */
export const HOME_COLLECTION_CATALOG: HomeRewardItem[] = [
  // Chapter 1
  {
    id: 'decor_cozy_cushion',
    name: 'Rose Velvet Floor Cushion',
    category: 'home_object',
    icon: '🛋️',
    description: 'A plush corner cushion where Cupidot curls up for quiet evenings.',
    unlockedAtChapter: 1,
  },
  {
    id: 'decor_welcome_plant',
    name: 'Heartleaf Philodendron',
    category: 'home_object',
    icon: '🪴',
    description: 'A little shared plant that thrives on calm, intentional moments together.',
    unlockedAtChapter: 1,
  },
  {
    id: 'souvenir_first_strip',
    name: '4-Cut Photostrip Frame',
    category: 'activity_souvenir',
    icon: '📸',
    description: 'A polished acrylic frame preserving your first photobooth memories.',
    unlockedAtChapter: 1,
  },

  // Chapter 2
  {
    id: 'decor_lantern',
    name: 'Sunset Glass Lantern',
    category: 'home_object',
    icon: '🏮',
    description: 'Casts a gentle amber light across the room during evening check-ins.',
    unlockedAtChapter: 2,
  },
  {
    id: 'souvenir_quiz_charm',
    name: 'Telepathy Star Charm',
    category: 'activity_souvenir',
    icon: '✨',
    description: 'Celebrates answers locked in secretly and revealed in tandem.',
    unlockedAtChapter: 2,
  },
  {
    id: 'theme_cozy_rain',
    name: 'Gentle Window Rain Ambience',
    category: 'ambient_theme',
    icon: '🌧️',
    description: 'Soft raindrops tapping against the sanctuary glass for quiet sessions.',
    unlockedAtChapter: 2,
  },

  // Chapter 3
  {
    id: 'decor_bookshelf',
    name: 'Mini Cedar Memory Shelf',
    category: 'home_object',
    icon: '📚',
    description: 'Holds time capsule letters, date receipts, and shared passport stamps.',
    unlockedAtChapter: 3,
  },
  {
    id: 'souvenir_canvas_palette',
    name: 'Dual Brush Palette',
    category: 'activity_souvenir',
    icon: '🎨',
    description: 'Commemorates strokes drawn live on the same canvas across the miles.',
    unlockedAtChapter: 3,
  },
  {
    id: 'ritual_shared_tea',
    name: 'Steaming Ceramic Teapot',
    category: 'ritual_symbol',
    icon: '🍵',
    description: 'A warm tradition token for weekend check-ins and Sunday reviews.',
    unlockedAtChapter: 3,
  },

  // Chapter 4
  {
    id: 'decor_constellation_globe',
    name: 'Celestial Relationship Globe',
    category: 'home_object',
    icon: '🔮',
    description: 'Glows with stars representing milestones you two deliberately pinned.',
    unlockedAtChapter: 4,
  },
  {
    id: 'theme_firelight',
    name: 'Crackling Hearth Light',
    category: 'ambient_theme',
    icon: '🪵',
    description: 'Warm, flickering fireplace glow for late-night deep conversations.',
    unlockedAtChapter: 4,
  },

  // Chapter 5
  {
    id: 'decor_clockwork_bridge',
    name: 'Dual Timezone Meridian Ring',
    category: 'home_object',
    icon: '🕰️',
    description: 'A golden ring tracking sunrise and sunset across both of your horizons.',
    unlockedAtChapter: 5,
  },
  {
    id: 'souvenir_reunion_key',
    name: 'Always Finding Each Other Key',
    category: 'ritual_symbol',
    icon: '🗝️',
    description: 'Symbol of every flight boarded, call answered, and distance closed.',
    unlockedAtChapter: 5,
  },
];

/** Calculate current chapter based on growth sparks. */
export function calculateChapter(growthSparks: number): CupidotChapter & {
  chapterNumber: CupidotChapter;
  title: string;
  subtitle: string;
  sparksRequired: number;
} {
  let num: CupidotChapter = 1;
  if (growthSparks >= 1000) num = 5;
  else if (growthSparks >= 500) num = 4;
  else if (growthSparks >= 250) num = 3;
  else if (growthSparks >= 100) num = 2;
  else num = 1;

  const def = CHAPTER_DEFINITIONS[num] || CHAPTER_DEFINITIONS[1];
  const numObj = new Number(num);
  (numObj as any).chapterNumber = num;
  (numObj as any).title = def.title;
  (numObj as any).subtitle = def.subtitle;
  (numObj as any).sparksRequired = def.sparksRequired;

  return numObj as any;
}

/** Calculate progress to next chapter. */
export function getChapterProgress(growthSparks: number): {
  currentChapter: CupidotChapter;
  nextChapter: CupidotChapter | null;
  currentSparks: number;
  neededForNext: number;
  progressPercent: number;
  readablePrompt: string;
} {
  const currentChapter = Number(calculateChapter(growthSparks)) as CupidotChapter;
  const nextChapter = currentChapter < 5 ? ((currentChapter + 1) as CupidotChapter) : null;

  if (!nextChapter) {
    return {
      currentChapter,
      nextChapter: null,
      currentSparks: growthSparks,
      neededForNext: 0,
      progressPercent: 100,
      readablePrompt: 'Your shared sanctuary is rich with history and milestones. ♡',
    };
  }

  const currentBase = CHAPTER_DEFINITIONS[currentChapter].sparksRequired;
  const target = CHAPTER_DEFINITIONS[nextChapter].sparksRequired;
  const inChapterSparks = Math.max(0, growthSparks - currentBase);
  const totalInChapter = target - currentBase;
  const progressPercent = Math.min(100, Math.round((inChapterSparks / totalInChapter) * 100));
  const remaining = Math.max(0, target - growthSparks);

  const momentsWord = remaining === 1 ? 'shared moment' : 'shared moments';
  const readablePrompt = `${remaining} ${momentsWord} until Chapter ${nextChapter}: ${CHAPTER_DEFINITIONS[nextChapter].title}`;

  return {
    currentChapter,
    nextChapter,
    currentSparks: growthSparks,
    neededForNext: remaining,
    progressPercent,
    readablePrompt,
  };
}

/** Anti-grind soft cap: maximum sparks awarded per session before gentle pause. */
export const SESSION_SPARK_SOFT_CAP = 45;

export interface SparkAwardResult {
  awarded: boolean;
  sparksAdded: number;
  sparksAwarded: number;
  totalSparks: number;
  sessionSparks: number;
  newSessionSparks: number;
  chapterAdvanced: boolean;
  newChapter?: CupidotChapter;
  isDuplicate: boolean;
  softCapReached: boolean;
  note: string;
}

/**
 * Idempotently awards growth sparks for an eligible shared event.
 */
export function awardGrowthSparks(
  currentTotalOrSession: number,
  actionTypeOrSessionCurrent: any,
  seenActionKeysOrEventId?: any,
  actionKeyOrProcessedSet?: any,
  maybeActionKey?: string
): SparkAwardResult {
  let currentTotal = 0;
  let sessionCurrent = 0;
  let actionType = '';
  let seenActionKeys: Set<string>;
  let actionKey = '';

  if (typeof actionTypeOrSessionCurrent === 'number') {
    // 5-argument style
    currentTotal = currentTotalOrSession;
    sessionCurrent = actionTypeOrSessionCurrent;
    actionType = String(seenActionKeysOrEventId || '');
    seenActionKeys = actionKeyOrProcessedSet instanceof Set ? actionKeyOrProcessedSet : new Set<string>();
    actionKey = String(maybeActionKey || '');
  } else {
    // 4-argument style: (sessionCurrent, actionType, actionKey, seenActionKeys)
    sessionCurrent = currentTotalOrSession;
    currentTotal = currentTotalOrSession;
    actionType = String(actionTypeOrSessionCurrent || '');
    actionKey = String(seenActionKeysOrEventId || '');
    seenActionKeys = actionKeyOrProcessedSet instanceof Set ? actionKeyOrProcessedSet : new Set<string>();
  }

  // Idempotency check: duplicate event calls do not re-award
  if (seenActionKeys.has(actionKey)) {
    return {
      awarded: false,
      sparksAdded: 0,
      sparksAwarded: 0,
      totalSparks: currentTotal,
      sessionSparks: sessionCurrent,
      newSessionSparks: sessionCurrent,
      chapterAdvanced: false,
      isDuplicate: true,
      softCapReached: false,
      note: 'Already recorded for this moment.',
    };
  }

  seenActionKeys.add(actionKey);

  // Soft cap check: communicate warmly without punishing
  if (sessionCurrent >= SESSION_SPARK_SOFT_CAP) {
    return {
      awarded: false,
      sparksAdded: 0,
      sparksAwarded: 0,
      totalSparks: currentTotal,
      sessionSparks: sessionCurrent,
      newSessionSparks: sessionCurrent,
      chapterAdvanced: false,
      isDuplicate: false,
      softCapReached: true,
      note: 'Cupidot is glowing warmly after our moments together. Any more time today is purely for joy! ✨',
    };
  }

  let baseSparks = 15;
  if (actionType.includes('activity')) {
    baseSparks = 15;
  } else if (actionType.includes('ritual')) {
    baseSparks = 10;
  } else if (actionType === 'reunion_return') {
    baseSparks = 5;
  } else {
    baseSparks = 10;
  }

  const sparksToAdd = Math.min(baseSparks, SESSION_SPARK_SOFT_CAP - sessionCurrent);
  const nextTotal = currentTotal + sparksToAdd;
  const nextSession = sessionCurrent + sparksToAdd;

  const prevChapter = Number(calculateChapter(currentTotal));
  const newChapter = Number(calculateChapter(nextTotal)) as CupidotChapter;
  const chapterAdvanced = newChapter > prevChapter;

  return {
    awarded: true,
    sparksAdded: sparksToAdd,
    sparksAwarded: sparksToAdd,
    totalSparks: nextTotal,
    sessionSparks: nextSession,
    newSessionSparks: nextSession,
    chapterAdvanced,
    newChapter: chapterAdvanced ? newChapter : undefined,
    isDuplicate: false,
    softCapReached: nextSession >= SESSION_SPARK_SOFT_CAP,
    note: chapterAdvanced
      ? `Spark unlocked! You reached Chapter ${newChapter}: ${CHAPTER_DEFINITIONS[newChapter].title}! 🌸`
      : `Cupidot gained a little warmth (+${sparksToAdd} sparks).`,
  };
}

/**
 * Return experience evaluation with ZERO guilt language.
 * No absence counter, no loss, no streak decay.
 */
export function getReturnExperience(lastReturnAtISO?: string | number | null): {
  greeting: string;
  subtext: string;
  mood: CupidotMood;
  state: CupidotState;
  isWarm: boolean;
  lines: string[];
} {
  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 5;

  const greeting = isLateNight
    ? 'Resting together in the quiet hours.'
    : 'Welcome back to your little world.';
  const subtext = isLateNight
    ? 'No rush, no demands. Cupidot is curled up, keeping your sanctuary calm.'
    : 'Everything you two built is right here, safe and warm.';

  return {
    greeting,
    subtext,
    mood: isLateNight ? 'cozy' : 'curious',
    state: isLateNight ? 'resting' : 'welcoming',
    isWarm: true,
    lines: [greeting, subtext],
  };
}

/**
 * State Priority Hierarchy (from highest to lowest):
 * 1. privacy/consent alert
 * 2. connection recovery
 * 3. activity-critical instruction
 * 4. direct user action
 * 5. shared milestone
 * 6. suggestion
 * 7. decorative idle behavior
 */
export type StatePriorityCategory =
  | 'privacy_alert'
  | 'connection_recovery'
  | 'activity_instruction'
  | 'user_action'
  | 'shared_milestone'
  | 'suggestion'
  | 'idle';

export const STATE_PRIORITY_ORDER = [
  'privacy_alert',
  'recovery',
  'activity_instruction',
  'direct_user_action',
  'shared_milestone',
  'suggestion',
  'idle',
] as const;

export const STATE_PRIORITY_MAP: Record<string, number> = {
  privacy_alert: 7,
  recovery: 6,
  connection_recovery: 6,
  activity_instruction: 5,
  direct_user_action: 4,
  user_action: 4,
  shared_milestone: 3,
  suggestion: 2,
  idle: 1,
};

export interface BehaviorResolution {
  productState: CupidotProductState;
  intent: import('@/types/cupidot').CupidotBehaviorIntent;
  mood: CupidotMood;
  priorityCategory: StatePriorityCategory;
  speechCue: string;
  dialogue: string[];
}

/**
 * Layer 1 -> Layer 2:
 * Maps abstract Product State + context into Behavior Intent and Safe Mood.
 * Guarantees mood is derived from safe product state rather than arbitrary manipulation.
 */
export function productStateToBehavior(
  state: CupidotProductState,
  context: {
    partnerOnline?: boolean;
    isRoomActive?: boolean;
    guidanceMode?: GuidanceMode;
    romanceLevel?: RomanceLevel;
    isLateNight?: boolean;
    hasNewUnopenedMemory?: boolean;
    hasConsentAlert?: boolean;
  } = {}
): BehaviorResolution {
  if (context.hasConsentAlert) {
    const cue = 'Privacy confirmed. Everything in your room stays sealed until you both choose.';
    return {
      productState: state,
      intent: 'privacy_confirmation',
      mood: 'focused',
      priorityCategory: 'privacy_alert',
      speechCue: cue,
      dialogue: [cue],
    };
  }

  let intent: import('@/types/cupidot').CupidotBehaviorIntent;
  let mood: CupidotMood;
  let priorityCategory: StatePriorityCategory;
  let speechCue: string;

  switch (state) {
    case 'reconnecting':
      intent = 'recover_connection';
      mood = 'focused';
      priorityCategory = 'connection_recovery';
      speechCue = 'Holding your place while connection restores. Nothing was lost.';
      break;
    case 'anticipating_reveal':
      intent = 'reveal_anticipation';
      mood = 'excited';
      priorityCategory = 'activity_instruction';
      speechCue = 'Both answers are sealed! Ready to reveal together.';
      break;
    case 'focused':
      intent = 'wait';
      mood = 'focused';
      priorityCategory = 'activity_instruction';
      speechCue = 'Drafting quietly. Private choices remain sealed.';
      break;
    case 'hosting':
      intent = 'host';
      mood = 'playful';
      priorityCategory = 'activity_instruction';
      speechCue = 'Guiding tonight’s moment for you two.';
      break;
    case 'celebrating':
      intent = 'celebrate';
      mood = 'proud';
      priorityCategory = 'shared_milestone';
      speechCue = 'Milestone celebrated together! A warm growth spark unlocked.';
      break;
    case 'curating_memory':
      intent = 'curate_memory';
      mood = 'dreamy';
      priorityCategory = 'shared_milestone';
      speechCue = 'Turning this shared moment into a lasting keepsake.';
      break;
    case 'reunion':
      intent = 'reunion';
      mood = 'excited';
      priorityCategory = 'user_action';
      speechCue = 'Both hearts are here in sanctuary. Welcome back together.';
      break;
    case 'welcoming':
      intent = 'welcome';
      mood = 'curious';
      priorityCategory = 'user_action';
      speechCue = 'Welcome back to your shared world.';
      break;
    case 'waiting':
      intent = 'wait';
      mood = 'cozy';
      priorityCategory = 'idle';
      speechCue = 'Keeping the hearth warm while your person gets settled.';
      break;
    case 'curious':
      intent = 'suggest';
      mood = 'curious';
      priorityCategory = 'suggestion';
      speechCue = 'There is a fresh moment or memory waiting for you two.';
      break;
    case 'settling_for_night':
      intent = 'settle';
      mood = 'cozy';
      priorityCategory = 'idle';
      speechCue = 'Settling in for the night. Sweet dreams to you both.';
      break;
    case 'resting':
    default:
      intent = 'settle';
      mood = 'resting';
      priorityCategory = 'idle';
      speechCue = 'Resting peacefully in sanctuary.';
      break;
  }

  if (context.romanceLevel) {
    speechCue = getCuratedDialogue(intent, context.romanceLevel);
  }

  return {
    productState: state,
    intent,
    mood,
    priorityCategory,
    speechCue,
    dialogue: [speechCue],
  };
}

/**
 * Layer 2 -> Layer 3:
 * Maps Behavior Intent + Mood to Visual Presentation for current 3D/2D models.
 * Decoupled so future character redesign does not touch product/state logic.
 */
export function behaviorToPresentation(
  intent: import('@/types/cupidot').CupidotBehaviorIntent,
  mood?: CupidotMood
): {
  botState: 'idle' | 'happy' | 'love' | 'thinking' | 'talking' | 'sleeping' | 'celebration';
  face2D: string;
  animationHint: string;
  animationSpeed: number;
  particles: boolean;
  ariaLiveText: string;
} {
  switch (intent) {
    case 'celebrate':
      return {
        botState: 'celebration',
        face2D: '٩( ᐛ )و 💖',
        animationHint: 'celebrate_bounce',
        animationSpeed: 1.2,
        particles: true,
        ariaLiveText: 'Cupidot is bouncing with celebration for you two!',
      };
    case 'reunion':
    case 'reveal_anticipation':
    case 'curate_memory':
      return {
        botState: 'love',
        face2D: '( ✧ ‿ ✧ ) ✨',
        animationHint: 'tender_pulse',
        animationSpeed: 1.0,
        particles: true,
        ariaLiveText: 'Cupidot glows warmly with heartfelt connection.',
      };
    case 'welcome':
      return {
        botState: 'happy',
        face2D: '(˶ᵔ ᵕ ᵔ˶) ♡',
        animationHint: 'welcome_float',
        animationSpeed: 1.0,
        particles: false,
        ariaLiveText: 'Cupidot smiles and welcomes you into the space.',
      };
    case 'host':
      return {
        botState: 'talking',
        face2D: '( ˆ ᗜ ˆ ) 🎤',
        animationHint: 'host_gesture',
        animationSpeed: 1.0,
        particles: false,
        ariaLiveText: 'Cupidot is gently guiding tonight’s activity.',
      };
    case 'suggest':
    case 'recover_connection':
      return {
        botState: 'thinking',
        face2D: '( • ‿ • ) 🔍',
        animationHint: 'curious_tilt',
        animationSpeed: 0.9,
        particles: false,
        ariaLiveText: 'Cupidot is checking in thoughtfully.',
      };
    case 'settle':
      return {
        botState: 'sleeping',
        face2D: '( ˘͈ ᵕ ˘͈ ) 💤',
        animationHint: 'gentle_breath',
        animationSpeed: 0.7,
        particles: false,
        ariaLiveText: 'Cupidot is resting peacefully.',
      };
    case 'wait':
    case 'privacy_confirmation':
    default:
      if (mood === 'excited') {
        return {
          botState: 'happy',
          face2D: '( ≧ ◡ ≦ ) 🌸',
          animationHint: 'excited_sway',
          animationSpeed: 1.1,
          particles: true,
          ariaLiveText: 'Cupidot is full of excitement.',
        };
      }
      if (mood === 'cozy' || mood === 'resting') {
        return {
          botState: 'sleeping',
          face2D: '( ˘͈ ᵕ ˘͈ ) ☕',
          animationHint: 'calm_still',
          animationSpeed: 0.7,
          particles: false,
          ariaLiveText: 'Cupidot is resting cozy and still.',
        };
      }
      return {
        botState: 'idle',
        face2D: '( ◕ ‿ ◕ ) 🌸',
        animationHint: 'idle_float',
        animationSpeed: 1.0,
        particles: false,
        ariaLiveText: 'Cupidot floats gently in your sanctuary.',
      };
  }
}

/**
 * Multi-tab celebration deduplication guard.
 * Prevents multiple open tabs from triggering duplicate audio/confetti blasts.
 */
const recentCelebrations = new Map<string, number>();

export function shouldSuppressDuplicateCelebration(
  celebrationId: string,
  lastTriggeredTimestamp = 0,
  currentTimestamp = Date.now(),
  debounceMs = 5000
): boolean {
  if (lastTriggeredTimestamp > 0) {
    return currentTimestamp - lastTriggeredTimestamp < debounceMs;
  }
  const last = recentCelebrations.get(celebrationId);
  if (last && currentTimestamp - last < debounceMs) {
    return true; // Suppress duplicate celebration in secondary tabs
  }
  recentCelebrations.set(celebrationId, currentTimestamp);
  return false;
}

/**
 * Derive the 12 Cupidot states based on current room and presence context.
 */
export function deriveCupidotState(params: {
  isRoomActive: boolean;
  roomStatus?: string | null;
  partnerOnline: boolean;
  ownReady?: boolean;
  partnerReady?: boolean;
  isPrivateDrafting?: boolean;
  isRevealing?: boolean;
  isCelebrating?: boolean;
  isCuratingMemory?: boolean;
  isReconnecting?: boolean;
  isLateNight?: boolean;
}): CupidotProductState {
  const {
    isRoomActive,
    roomStatus,
    partnerOnline,
    ownReady,
    partnerReady,
    isPrivateDrafting,
    isRevealing,
    isCelebrating,
    isCuratingMemory,
    isReconnecting,
    isLateNight,
  } = params;

  // Strict priority order:
  if (isReconnecting) return 'reconnecting';
  if (isCuratingMemory) return 'curating_memory';
  if (isCelebrating) return 'celebrating';
  if (isRevealing) return 'anticipating_reveal';

  if (isRoomActive) {
    if (ownReady && partnerReady) return 'anticipating_reveal';
    if (isPrivateDrafting) return 'focused';
    if (roomStatus === 'lobby') {
      return partnerOnline ? 'reunion' : 'waiting';
    }
    return 'hosting';
  }

  if (partnerOnline) return 'reunion';
  if (isLateNight) return 'settling_for_night';
  return 'resting';
}

/**
 * Storage helpers for local durable Cupidot home state (backed by localStorage).
 */
const STORAGE_KEY = 'dearly_cupidot_home_v1';

export function loadStoredCupidotHome(coupleId?: string): CupidotHomeState {
  if (typeof window === 'undefined') {
    return createDefaultHomeState();
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${coupleId || 'local'}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...createDefaultHomeState(),
        ...parsed,
        lastReturnAt: new Date().toISOString(),
      };
    }
  } catch {}

  return createDefaultHomeState();
}

export function saveStoredCupidotHome(state: CupidotHomeState, coupleId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${coupleId || 'local'}`, JSON.stringify(state));
  } catch {}
}

export function createDefaultHomeState(): CupidotHomeState {
  return {
    state: 'welcoming',
    mood: 'curious',
    chapter: 1,
    growthSparks: 0,
    sparksThisSession: 0,
    partnerPresence: 'away',
    guidanceMode: 'gentle',
    romanceLevel: 'romantic',
    lastReturnAt: new Date().toISOString(),
    placedDecorIds: ['decor_cozy_cushion', 'decor_welcome_plant'],
    upcomingRitual: null,
    activeMemorySeed: null,
  };
}

export const HOME_REWARD_CATALOG = HOME_COLLECTION_CATALOG;

export const deriveProductState = deriveCupidotState;

export function deriveSafeMood(state: CupidotProductState): CupidotMood {
  switch (state) {
    case 'reunion':
      return 'excited';
    case 'celebrating':
      return 'proud';
    case 'focused':
      return 'focused';
    case 'anticipating_reveal':
      return 'playful';
    case 'curious':
      return 'curious';
    case 'curating_memory':
      return 'dreamy';
    case 'settling_for_night':
      return 'dreamy';
    case 'resting':
      return 'resting';
    case 'welcoming':
      return 'curious';
    case 'waiting':
      return 'cozy';
    case 'hosting':
      return 'playful';
    case 'reconnecting':
      return 'focused';
    default:
      return 'cozy';
  }
}

export function placeHomeDecor(placedIds: string[], decorId: string): string[] {
  if (placedIds.includes(decorId)) return placedIds;
  return [...placedIds, decorId];
}

export function undoHomeDecorPlacement(placedIds: string[], decorId: string): string[] {
  return placedIds.filter((id) => id !== decorId);
}

export function proposeMemorySeed(input: {
  title: string;
  kind?: string;
  activityPath?: string;
  partnerAId: string;
  partnerAName: string;
  partnerBId: string;
  partnerBName: string;
  caption?: string;
  previewUrl?: string;
}): MemorySeed {
  const seedId = `seed-${Date.now()}`;
  return {
    seedId,
    id: seedId,
    title: input.title,
    kind: input.kind || 'activity',
    activityType: input.kind || 'activity',
    activityTitle: input.title,
    activityPath: input.activityPath,
    partnerAId: input.partnerAId,
    partnerAName: input.partnerAName,
    partnerBId: input.partnerBId,
    partnerBName: input.partnerBName,
    caption: input.caption || '',
    draftCaption: input.caption || '',
    highlightText: input.title,
    previewUrl: input.previewUrl,
    proposedAt: new Date().toISOString(),
    occurredAt: new Date().toISOString(),
    status: 'proposed',
    approvalStatus: 'proposed',
    chosenMood: 'playful',
    proposedBy: input.partnerAName,
    approvedByPartnerA: true,
    approvedByPartnerB: false,
  };
}

export function approveMemorySeed(seed: MemorySeed, partnerId: string): MemorySeed {
  const isA = partnerId === seed.partnerAId;
  const isB = partnerId === seed.partnerBId;
  const approvedByPartnerA = isA ? true : seed.approvedByPartnerA;
  const approvedByPartnerB = isB ? true : seed.approvedByPartnerB;
  const mutuallyApproved = approvedByPartnerA && approvedByPartnerB;

  return {
    ...seed,
    approvedByPartnerA,
    approvedByPartnerB,
    status: mutuallyApproved ? 'mutually_approved' : seed.status,
  };
}

export function declineMemorySeed(seed: MemorySeed, _partnerId: string): MemorySeed {
  return {
    ...seed,
    status: 'declined',
  };
}

export function snoozeRitual(ritual: CoupleRitual, snoozeMinutes = 30): CoupleRitual {
  const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
  return {
    ...ritual,
    snoozedUntil,
  };
}

export function rescheduleRitual(ritual: CoupleRitual, newTime: string): CoupleRitual {
  return {
    ...ritual,
    rescheduledTo: newTime,
    snoozedUntil: null,
  };
}

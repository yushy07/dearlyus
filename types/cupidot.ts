/**
 * Cupidot Shared-Pet Types & Constants
 * Source of truth: Cupidot_Features_and_Functionality.md
 */

/** The 12 core product states of Cupidot as defined by the blueprint. */
export type CupidotProductState =
  | 'resting'             // Calm default, low-energy visits, reduced motion
  | 'welcoming'           // Warm greeting on arrival, single or reunited
  | 'waiting'             // Waiting gently for partner, or partner drafting privately
  | 'reunion'             // Both partners arrive or reconnect
  | 'curious'             // New activity or unopened memory available
  | 'hosting'             // Guiding active session / activity transitions
  | 'focused'             // Partners are drafting, drawing, or choosing privately
  | 'anticipating_reveal' // Both answers locked in, parchment ready to open
  | 'celebrating'         // Activity or milestone completed, joy and sparkle
  | 'curating_memory'     // Offering or reviewing a mutual keepsake seed
  | 'reconnecting'        // Connection loss recovery in progress
  | 'settling_for_night'; // End of session, cozy wind-down, goodnight tap

/** Compatibility alias for product states. */
export type CupidotState = CupidotProductState;

/** Behavior layer: intent representing how Cupidot acts towards the couple. */
export type CupidotBehaviorIntent =
  | 'welcome'
  | 'reunion'
  | 'suggest'
  | 'explain'
  | 'confirm_privacy'
  | 'privacy_confirmation'
  | 'host'
  | 'wait'
  | 'reveal'
  | 'reveal_anticipation'
  | 'celebrate'
  | 'curate_memory'
  | 'offer_keepsake'
  | 'recover_connection'
  | 'close_session'
  | 'settle'
  | 'soften_intensity'
  | 'refuse_unsafe';

/** Romance Spectrum Levels (Blueprint Section 3) */
export type RomanceLevel =
  | 'quiet'    // Level 0 — Quiet companion (operational, recovery, zero flirtation)
  | 'warm'     // Level 1 — Warm (kind, cozy, togetherness without flirtation)
  | 'romantic' // Level 2 — Romantic (soft sparks, date atmosphere, default)
  | 'cheeky'   // Level 3 — Cheeky (harmless teasing, bold energy, winks)
  | 'flirty'   // Level 4 — Flirty (suggestive double meanings, requires mutual opt-in & 18+)
  | 'spicy';   // Level 5 — Spicy (adult-only, private, deliberate, session-scoped, easy exit)

export const ROMANCE_LEVEL_RANK: Record<RomanceLevel, number> = {
  quiet: 0,
  warm: 1,
  romantic: 2,
  cheeky: 3,
  flirty: 4,
  spicy: 5,
};

export interface RomanceLevelDefinition {
  level: RomanceLevel;
  rank: number;
  name: string;
  tagline: string;
  description: string;
  exampleLine: string;
  minAgeRequired: number;
  requiresMutualOptIn: boolean;
  requiresSessionReconfirmation: boolean;
  allowedInNotifications: boolean;
}

export const ROMANCE_LEVEL_DEFINITIONS: Record<RomanceLevel, RomanceLevelDefinition> = {
  quiet: {
    level: 'quiet',
    rank: 0,
    name: 'Quiet Companion',
    tagline: 'Calm presence & operational clarity only',
    description: 'Minimal emotional language, no teasing or flirtation. Pure guidance and recovery.',
    exampleLine: 'Both of you are ready. Reveal when you want.',
    minAgeRequired: 0,
    requiresMutualOptIn: false,
    requiresSessionReconfirmation: false,
    allowedInNotifications: true,
  },
  warm: {
    level: 'warm',
    rank: 1,
    name: 'Warm',
    tagline: 'Kind, cozy, and gently encouraging',
    description: 'Celebrates togetherness warmly without flirtation or romantic pressure.',
    exampleLine: 'You found your way back to your little corner.',
    minAgeRequired: 0,
    requiresMutualOptIn: false,
    requiresSessionReconfirmation: false,
    allowedInNotifications: true,
  },
  romantic: {
    level: 'romantic',
    rank: 2,
    name: 'Romantic',
    tagline: 'Soft sparks, date atmosphere, sincere affection',
    description: 'The standard date night default. Atmosphere, gentle anticipation, and heartfelt joy.',
    exampleLine: 'Two answers, one tiny drumroll. Ready?',
    minAgeRequired: 0,
    requiresMutualOptIn: false,
    requiresSessionReconfirmation: false,
    allowedInNotifications: true,
  },
  cheeky: {
    level: 'cheeky',
    rank: 3,
    name: 'Cheeky',
    tagline: 'Playful challenges, winks, and bold humor',
    description: 'Confident winks, harmless situational teasing, and mischievous A/B dilemmas.',
    exampleLine: 'Interesting. You both look very confident for people whose answers are still sealed.',
    minAgeRequired: 0,
    requiresMutualOptIn: false,
    requiresSessionReconfirmation: false,
    allowedInNotifications: false,
  },
  flirty: {
    level: 'flirty',
    rank: 4,
    name: 'Flirty',
    tagline: 'Suggestive double meanings & playful tension',
    description: 'Flirt-forward prompts approved by both partners. Requires mutual opt-in and adult eligibility.',
    exampleLine: 'Should I bring the sweet questions… or the ones that make eye contact suspicious?',
    minAgeRequired: 18,
    requiresMutualOptIn: true,
    requiresSessionReconfirmation: false,
    allowedInNotifications: false,
  },
  spicy: {
    level: 'spicy',
    rank: 5,
    name: 'Spicy',
    tagline: 'Adult-only, private, deliberate, session-scoped',
    description: 'Sensual tension without coercion or unsafe content. Reconfirmation required per session; one-tap exit.',
    exampleLine: 'I can turn up the temperature—but only if both troublemakers say yes.',
    minAgeRequired: 18,
    requiresMutualOptIn: true,
    requiresSessionReconfirmation: true,
    allowedInNotifications: false,
  },
};

export interface CoupleRomancePreferences {
  partnerALevel: RomanceLevel;
  partnerBLevel: RomanceLevel;
  effectiveLevel: RomanceLevel;
  isAdultA: boolean;
  isAdultB: boolean;
  spicySessionActive: boolean;
  spicyActivatedAt?: string | null;
}

export interface CupidotStructuredOutput {
  intent: CupidotBehaviorIntent;
  tone: RomanceLevel;
  message: string;
  emotion: string;
  suggested_action_id?: string;
  context_used: string[];
  requires_confirmation: boolean;
}

export interface InterruptionBudget {
  proactiveWelcomeGiven: boolean;
  lastSpokenTimestamp: number;
  recentSpokenIntents: Array<{ intent: string; timestamp: number }>;
  dismissedSuggestionKeys: string[];
  quietSessionActive: boolean;
}

/** The 8 readable momentary moods. */
export type CupidotMood =
  | 'cozy'
  | 'curious'
  | 'playful'
  | 'excited'
  | 'focused'
  | 'proud'
  | 'dreamy'
  | 'resting';

/** The 5 progressive growth chapters. */
export type CupidotChapter =
  | 1 // "A New Little Home"
  | 2 // "Learning Your Rhythm"
  | 3 // "Making Traditions"
  | 4 // "A Home Full of Stories"
  | 5; // "Always Finding Each Other"

export interface ChapterDefinition {
  chapter: CupidotChapter;
  title: string;
  subtitle: string;
  sparksRequired: number;
}

export type ChapterInfo = ChapterDefinition;

export const CHAPTER_DEFINITIONS: Record<CupidotChapter, ChapterDefinition> = {
  1: {
    chapter: 1,
    title: 'Arrival & First Spark',
    subtitle: 'Stepping into your sanctuary together',
    sparksRequired: 0,
  },
  2: {
    chapter: 2,
    title: 'Deepening Rhythms',
    subtitle: 'Building traditions across the distance',
    sparksRequired: 100,
  },
  3: {
    chapter: 3,
    title: 'Shared Milestones',
    subtitle: 'Treasuring our sealed letters and artwork',
    sparksRequired: 250,
  },
  4: {
    chapter: 4,
    title: 'Celestial Harmony',
    subtitle: 'Every late night conversation honored',
    sparksRequired: 500,
  },
  5: {
    chapter: 5,
    title: 'Always Together',
    subtitle: 'No distance can diminish what we share',
    sparksRequired: 1000,
  },
};

export const CHAPTER_LIST: ChapterDefinition[] = Object.values(CHAPTER_DEFINITIONS);

/** The 6 togetherness modes. */
export type TogethernessMode =
  | 'quick_spark'     // 2-5 min quick question or reaction exchange
  | 'date_night'      // Planned/spontaneous multi-activity session
  | 'quiet_together'  // Shared timer, ambience, gentle reactions, zero pressure
  | 'deep_connection' // Slower vulnerability prompts, no auto-save, easy exit
  | 'make_something'  // Draw, scrapbook, letter, photostrip
  | 'surprise_us';    // Safe auto-selection respecting preferences

export interface TogethernessModeOption {
  id: TogethernessMode;
  name: string;
  duration: string;
  expectedDuration: string;
  energy: string;
  icon: string;
  tagline: string;
  description: string;
  suggestedActionLabel: string;
  requiredPermissions: string[];
  whatRemainsPrivate: string;
  canCreateKeepsake: boolean;
  isAiInvolved: boolean;
}

export const TOGETHERNESS_MODES: TogethernessModeOption[] = [
  {
    id: 'quick_spark',
    name: 'Quick Spark',
    duration: '2–5 mins',
    expectedDuration: '2–5 mins',
    energy: 'Playful & Light',
    icon: '⚡',
    tagline: 'Tiny playful moment for busy days',
    description: 'One playful question, reaction exchange, or tiny drawing designed for busy days and distant time zones.',
    suggestedActionLabel: 'Start Quick Spark →',
    requiredPermissions: ['None'],
    whatRemainsPrivate: 'Unsubmitted drafts and typing telemetry are strictly sealed.',
    canCreateKeepsake: false,
    isAiInvolved: false,
  },
  {
    id: 'date_night',
    name: 'Date Night',
    duration: '20–60 mins',
    expectedDuration: '20–60 mins',
    energy: 'Celebratory & Connected',
    icon: '🌹',
    tagline: 'A dedicated shared evening for two',
    description: 'A planned or spontaneous multi-activity session with a cozy lobby, queue, shared soundscapes, and recap.',
    suggestedActionLabel: 'Enter Date Night Lobby →',
    requiredPermissions: ['Microphone (Optional)'],
    whatRemainsPrivate: 'Room audio is peer-to-peer; no raw audio is recorded or stored.',
    canCreateKeepsake: true,
    isAiInvolved: false,
  },
  {
    id: 'quiet_together',
    name: 'Quiet Together',
    duration: '15–60 mins',
    expectedDuration: '15–60 mins',
    energy: 'Cozy & Ambient',
    icon: '☕',
    tagline: 'Peaceful shared presence with no demands',
    description: 'Shared timer, soothing ambience (fireplace, gentle rain), gentle reactions, and zero performance pressure.',
    suggestedActionLabel: 'Sit Together Quietly →',
    requiredPermissions: ['None'],
    whatRemainsPrivate: 'Completely unprompted presence. No answers or performance required.',
    canCreateKeepsake: false,
    isAiInvolved: false,
  },
  {
    id: 'deep_connection',
    name: 'Deep Connection',
    duration: '15–30 mins',
    expectedDuration: '15–30 mins',
    energy: 'Slow & Vulnerable',
    icon: '🌊',
    tagline: 'Slower vulnerability and tender questions',
    description: 'Slower, heart-to-heart prompts with clear privacy and skip controls. Pausing or exiting never implies failure.',
    suggestedActionLabel: 'Open Deep Prompt →',
    requiredPermissions: ['None'],
    whatRemainsPrivate: 'Responses are secret until mutual reveal. No automatic saving without explicit consent.',
    canCreateKeepsake: true,
    isAiInvolved: true,
  },
  {
    id: 'make_something',
    name: 'Make Something',
    duration: '10–30 mins',
    expectedDuration: '10–30 mins',
    energy: 'Creative & Collaborative',
    icon: '🎨',
    tagline: 'Create art, letters, strips, or plans',
    description: 'Collaborate on a canvas, scrapbook page, time capsule letter, or photostrip with private drafts and mutual save approval.',
    suggestedActionLabel: 'Start Creating →',
    requiredPermissions: ['Camera (For Photobooth)'],
    whatRemainsPrivate: 'Draft strokes and temporary canvases stay local until shared or approved.',
    canCreateKeepsake: true,
    isAiInvolved: false,
  },
  {
    id: 'surprise_us',
    name: 'Surprise Us',
    duration: 'Flexible',
    expectedDuration: 'Flexible',
    energy: 'Curious & Spontaneous',
    icon: '🎲',
    tagline: 'Let Cupidot pick a moment tailored for you two',
    description: 'Picks an activity based on your chosen mood, available time, and recent moments—never pushing anything uncomfortable.',
    suggestedActionLabel: 'Roll a Surprise →',
    requiredPermissions: ['None'],
    whatRemainsPrivate: 'Recommends only from mutually allowed activities.',
    canCreateKeepsake: true,
    isAiInvolved: false,
  },
];

/** Guidance levels for Cupidot. */
export type GuidanceMode = 'quiet' | 'gentle' | 'host';

/** Safe presence states (no device, IP, location, or tab telemetry). */
export type SafePresenceState =
  | 'here'
  | 'ready'
  | 'choosing'
  | 'writing'
  | 'drawing'
  | 'reconnecting'
  | 'away';

/** Safe ephemeral reactions. */
export type SafeReaction =
  | 'heart'
  | 'wave'
  | 'cheer'
  | 'comfort'
  | 'ready_pulse'
  | 'sparkle';

export interface SafeReactionInfo {
  id: SafeReaction;
  emoji: string;
  label: string;
}

export const SAFE_REACTIONS: SafeReactionInfo[] = [
  { id: 'heart', emoji: '💖', label: 'Send Love' },
  { id: 'wave', emoji: '👋', label: 'Gentle Wave' },
  { id: 'cheer', emoji: '✨', label: 'Cheer' },
  { id: 'comfort', emoji: '🫂', label: 'Comfort' },
  { id: 'ready_pulse', emoji: '💫', label: 'Ready Pulse' },
  { id: 'sparkle', emoji: '🌸', label: 'Warm Glow' },
];

/** Home unlockable decor item categories. */
export type HomeRewardCategory =
  | 'home_object'
  | 'activity_souvenir'
  | 'ambient_theme'
  | 'ritual_symbol';

export interface HomeRewardItem {
  id: string;
  name: string;
  category: HomeRewardCategory;
  icon: string;
  description: string;
  unlockedAtChapter: CupidotChapter;
  unlockedAt?: string;
  placedInRoom?: boolean;
}

/** Couple-created or preset ritual. */
export interface CoupleRitual {
  id: string;
  coupleId?: string;
  title?: string;
  name?: string; // alias for title
  purpose?: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'flexible';
  flexibleWindowDays?: number;
  time?: string; // alias for timeOfDay
  timeOfDay?: string; // e.g. "21:00"
  timeZone?: string;
  timezoneA?: string;
  timezoneB?: string;
  reminderMinutesBefore?: number;
  remindersEnabledA?: boolean;
  remindersEnabledB?: boolean;
  privateNotificationEnabled?: boolean;
  quietHoursStart?: string; // e.g. "22:00"
  quietHoursEnd?: string;   // e.g. "08:00"
  suggestedMode?: TogethernessMode;
  snoozedUntil?: string | null;
  rescheduledTo?: string | null;
  lastCompletedAt?: string | null;
  createdAt?: string;
}

/** Memory seed for mutual keepsake approval. */
export interface MemorySeed {
  seedId: string;
  id?: string; // alias for seedId
  coupleId?: string;
  title?: string;
  kind?: string;
  activityType: string;
  activityTitle?: string;
  activityPath?: string;
  occurredAt?: string;
  previewUrl?: string | null;
  highlightText?: string;
  draftCaption?: string;
  caption?: string;
  chosenMood?: CupidotMood;
  proposedBy?: string; // userId or displayName
  proposedAt?: string;
  partnerAId?: string;
  partnerAName?: string;
  partnerBId?: string;
  partnerBName?: string;
  approvedByPartnerA?: boolean;
  approvedByPartnerB?: boolean;
  approvalStatus: 'proposed' | 'approved_by_a' | 'approved_by_b' | 'both_approved' | 'declined';
  status?: 'proposed' | 'approved_by_a' | 'approved_by_b' | 'both_approved' | 'mutually_approved' | 'declined';
  approvedAt?: string | null;
  declinedAt?: string | null;
}

/** Complete state of Cupidot in the couple's home. */
export interface CupidotHomeState {
  state: CupidotState;
  mood: CupidotMood;
  chapter: CupidotChapter;
  growthSparks: number;
  sparksThisSession: number;
  partnerPresence: SafePresenceState;
  guidanceMode: GuidanceMode;
  romanceLevel?: RomanceLevel;
  lastGoodnightTapAt?: string | null;
  lastReturnAt: string;
  placedDecorIds: string[];
  activeMemorySeed?: MemorySeed | null;
  upcomingRitual?: CoupleRitual | null;
}

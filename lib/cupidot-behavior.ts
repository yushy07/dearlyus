/**
 * Cupidot — Behavioral Brain, Romance Spectrum & Dialogue System
 * Source of truth: Cupidot_Intelligence_and_Behavior.md
 *
 * Implements:
 * 1. Romance Spectrum (Levels 0–5: Quiet, Warm, Romantic, Cheeky, Flirty, Spicy).
 * 2. Effective Romance Level computation (min rule, mutual opt-in, adult & session gating).
 * 3. Anonymous private downgrade ("Keeping things lighter.").
 * 4. Multi-dimensional curated dialogue library across all 14 intents.
 * 5. Interruption budget, cooldowns, and silence during private phases.
 * 6. Difficult moments & boundary handling (skip, conflict de-escalation, safety refusal).
 * 7. Structured AI output validator with tone ceiling enforcement and fallback triggers.
 */

import {
  RomanceLevel,
  ROMANCE_LEVEL_RANK,
  ROMANCE_LEVEL_DEFINITIONS,
  CoupleRomancePreferences,
  CupidotBehaviorIntent,
  CupidotStructuredOutput,
  CupidotProductState,
  GuidanceMode,
  InterruptionBudget,
} from '@/types/cupidot';

// Allow-listed suggested action IDs for AI structured output
export const ALLOWED_ACTION_IDS = [
  'choose_question_intensity',
  'reveal_answers',
  'skip_to_next',
  'pause_activity',
  'open_quiet_together',
  'save_keepsake_seed',
  'decline_keepsake_seed',
  'reconnect_room',
  'snooze_ritual',
  'reschedule_ritual',
] as const;

export type AllowedActionId = (typeof ALLOWED_ACTION_IDS)[number];

/**
 * Computes the effective shared romance level.
 * Rule: Effective level is ALWAYS min(partnerA, partnerB).
 * Level 4 (Flirty): Requires adult verification for both partners.
 * Level 5 (Spicy): Requires adult verification AND active session confirmation.
 */
export function computeEffectiveRomanceLevel(
  pref: Partial<CoupleRomancePreferences>,
): RomanceLevel {
  const levelA = pref.partnerALevel || 'romantic';
  const levelB = pref.partnerBLevel || 'romantic';

  const rankA = ROMANCE_LEVEL_RANK[levelA] ?? 2;
  const rankB = ROMANCE_LEVEL_RANK[levelB] ?? 2;

  let effectiveRank = Math.min(rankA, rankB);

  // Adult verification check for Flirty (rank 4) and Spicy (rank 5)
  const isAdultA = pref.isAdultA ?? false;
  const isAdultB = pref.isAdultB ?? false;
  if (effectiveRank >= 4 && (!isAdultA || !isAdultB)) {
    effectiveRank = 3; // Drops to Cheeky
  }

  // Session-scoped reconfirmation check for Spicy (rank 5)
  if (effectiveRank === 5 && !pref.spicySessionActive) {
    effectiveRank = 4; // Drops to Flirty
  }

  // Map back to RomanceLevel
  const levels: RomanceLevel[] = [
    'quiet',
    'warm',
    'romantic',
    'cheeky',
    'flirty',
    'spicy',
  ];
  return levels[effectiveRank];
}

/**
 * Privately downgrades the couple's romance level.
 * Rule: Neutral announcement ("Keeping things lighter.") that never reveals which partner changed it.
 */
export function downgradeRomanceLevel(
  currentPref: CoupleRomancePreferences,
  newLevel: RomanceLevel,
  forPartner: 'A' | 'B',
): { updatedPref: CoupleRomancePreferences; announcement: string } {
  const updatedPref: CoupleRomancePreferences = {
    ...currentPref,
    partnerALevel: forPartner === 'A' ? newLevel : currentPref.partnerALevel,
    partnerBLevel: forPartner === 'B' ? newLevel : currentPref.partnerBLevel,
    // If downgraded below spicy, deactivate spicy session immediately
    spicySessionActive:
      newLevel === 'spicy' && currentPref.spicySessionActive
        ? currentPref.spicySessionActive
        : false,
  };

  updatedPref.effectiveLevel = computeEffectiveRomanceLevel(updatedPref);

  return {
    updatedPref,
    announcement: 'Keeping things lighter.',
  };
}

/**
 * Checks whether a romance level is allowed in notification previews.
 * Sensitive levels (Flirty, Spicy, Cheeky) must NEVER appear on lock screens or push previews.
 */
export function canIncludeInNotification(level: RomanceLevel): boolean {
  return ROMANCE_LEVEL_DEFINITIONS[level]?.allowedInNotifications ?? false;
}

/**
 * Comprehensive Curated Dialogue Library (Blueprint Section 23)
 * Mapped by: [intent][romanceLevel] -> string[]
 */
export const CURATED_DIALOGUE_LIBRARY: Record<
  CupidotBehaviorIntent,
  Record<RomanceLevel, string[]>
> = {
  welcome: {
    quiet: ["You're back in your space.", 'Welcome back.'],
    warm: [
      'Welcome back to your little corner.',
      'Your shared space was kept warm and cozy.',
      'There you are. Your little corner kept the light on.',
    ],
    romantic: [
      'The room feels warmer with you here.',
      'Your little sanctuary lights up with you here.',
      'Welcome back to where your story lives.',
    ],
    cheeky: [
      "You're here. Excellent—my tiny plan is working.",
      "Look who's back in sanctuary. Ready whenever you are.",
      'Welcome back! Mischief awaits on your mark.',
    ],
    flirty: [
      'There you are. Tonight just got noticeably more interesting.',
      'Welcome back. I have been saving the best sparks for you.',
    ],
    spicy: [
      'Back together. Trouble is now officially in session.',
      'Welcome back to your private corner. The temperature is already rising.',
    ],
  },

  reunion: {
    quiet: ['Both present.', 'Room in sync.'],
    warm: [
      "You're together.",
      'Both hearts are here in sanctuary.',
      'Together again in your shared corner.',
    ],
    romantic: [
      'Two hearts in the room. Shall we begin?',
      'Together again. The distance feels smaller already.',
      'Two souls, one shared screen.',
    ],
    cheeky: [
      'Both present. Mischief is now statistically likely.',
      'Two conspirators in one room. What could go wrong?',
      'Both here! Let the mutual teasing commence.',
    ],
    flirty: [
      'Both of you in the same room? This could get dangerous.',
      'Both logged in and looking suspiciously adorable.',
    ],
    spicy: [
      'Both present. The temperature just went up a few degrees.',
      'Both here. Let’s make tonight unforgettable.',
    ],
  },

  suggest: {
    quiet: ['Next activity ready when you want.', 'Options waiting.'],
    warm: [
      'A cozy shared moment is ready for you two.',
      'Take your time—choose whatever feels restful tonight.',
    ],
    romantic: [
      'Shall we light a spark with a little moment together?',
      'A tender little prompt is waiting whenever you two are ready.',
    ],
    cheeky: [
      'One sweet question or one suspiciously bold question?',
      'Care to test who knows the other better tonight?',
    ],
    flirty: [
      'Should I bring the sweet questions… or the ones that make eye contact suspicious?',
      'I have a prompt guaranteed to make someone blush.',
    ],
    spicy: [
      'I can turn up the temperature—but only if both troublemakers say yes.',
      'Ready for something daring, or shall we keep things innocent for now?',
    ],
  },

  explain: {
    quiet: ['Current phase and activity controls.', 'Privacy details.'],
    warm: [
      'Here is how this shared moment works—take all the time you need.',
      'Both of you participate at your own pace.',
    ],
    romantic: [
      'A shared canvas for two—draw, write, or whisper at your own pace.',
      'Take your time. Nothing here needs a rushed answer.',
    ],
    cheeky: [
      "Simple rules: play fair, laugh easily, and don't peek.",
      'The rules are simple. Obeying them is entirely up to you.',
    ],
    flirty: [
      "Simple rules: be honest, be brave, and don't blink.",
      'A little game of mutual courage. You first?',
    ],
    spicy: [
      'Private rules for two: strictly consensual, completely safe, easily paused.',
      'Whatever happens in this session stays in this session.',
    ],
  },

  confirm_privacy: {
    quiet: ['Privacy confirmed. Drafts sealed.', 'Answers locked.'],
    warm: [
      'Privacy confirmed. Everything in your room stays sealed until you both choose.',
      'Safe and sealed. Your drafts are strictly yours until mutual reveal.',
    ],
    romantic: [
      'Sealed in digital wax. Nobody peeks until both hearts are ready.',
      'Your private thoughts are safe. Only mutual consent unlocks them.',
    ],
    cheeky: [
      'Sealed tighter than a secret diary. No peeking allowed!',
      'Vault locked. Not even I can see what you wrote.',
    ],
    flirty: [
      'Vault locked. The suspense is half the fun.',
      'Sealed safe. You’ll have to wait for the reveal to see.',
    ],
    spicy: [
      'Completely private and shielded. Your secrets are safe with me.',
      'Sealed behind ironclad privacy. Reveal only when both agree.',
    ],
  },

  privacy_confirmation: {
    quiet: ['Privacy confirmed. Drafts sealed.'],
    warm: [
      'Privacy confirmed. Everything in your room stays sealed until you both choose.',
    ],
    romantic: [
      'Sealed in digital wax. Nobody peeks until both hearts are ready.',
    ],
    cheeky: ['Sealed tighter than a secret diary. No peeking allowed!'],
    flirty: ['Vault locked. The suspense is half the fun.'],
    spicy: ['Completely private and shielded. Your secrets are safe with me.'],
  },

  host: {
    quiet: ['Guiding current activity.', 'Activity active.'],
    warm: [
      'Holding space for you two tonight.',
      'Guiding your moment gently—take all the time you need.',
    ],
    romantic: [
      'Guiding tonight’s date atmosphere for you two.',
      'Two hearts, one shared rhythm tonight.',
    ],
    cheeky: [
      'Master of ceremonies on duty. Try to behave.',
      'Cupidot is hosting. Expect high energy and zero boredom.',
    ],
    flirty: [
      'Hosting tonight’s sparks. You two make this look effortless.',
      'Cupidot presiding. Let’s see some genuine chemistry.',
    ],
    spicy: [
      'Guiding tonight’s private session. Remember: pause or exit anytime.',
      'Hosting the heat. You two call the shots.',
    ],
  },

  wait: {
    quiet: ['Waiting for partner.', 'Standby.'],
    warm: [
      'Your room is ready when they are. No rush.',
      'I’ll keep things cozy. Take your time.',
    ],
    romantic: [
      'Keeping the hearth warm while your person gets comfortable.',
      'Holding space. Love has no deadlines.',
    ],
    cheeky: [
      'Patience is a virtue; fortunately, I brought snacks.',
      'Waiting patiently. They’re probably fixing their hair.',
    ],
    flirty: [
      'Good things come to those who wait—or so they tell me.',
      'Waiting… but the anticipation is already delicious.',
    ],
    spicy: [
      'Waiting patiently. Building up the suspense.',
      'Holding the room warm for when you two reunite.',
    ],
  },

  reveal: {
    quiet: ['Both answers locked. Ready to reveal.', 'Answers unsealed.'],
    warm: [
      'Both answers are safe and ready to open together.',
      'Two thoughtful answers ready to be shared.',
    ],
    romantic: [
      'Two sealed little truths. Reveal together?',
      'Two answers, one tiny drumroll. Ready to unseal?',
    ],
    cheeky: [
      'Both locked. Suddenly everyone looks innocent.',
      'I have two sealed answers and absolutely no intention of behaving calmly.',
    ],
    flirty: [
      'Both locked. Let’s see who blushes first.',
      'Both locked. This reveal may require suspiciously close seating.',
    ],
    spicy: [
      'Both locked. Let’s see what cards you just played.',
      'Both answers in the open. Brace yourselves.',
    ],
  },

  reveal_anticipation: {
    quiet: ['Both answers locked. Ready to reveal.'],
    warm: ['Both answers are safe and ready to open together.'],
    romantic: ['Two sealed little truths. Reveal together?'],
    cheeky: ['Both locked. Suddenly everyone looks innocent.'],
    flirty: ['Both locked. Let’s see who blushes first.'],
    spicy: ['Both locked. This reveal may require suspiciously close seating.'],
  },

  celebrate: {
    quiet: ['Moment completed.', 'Milestone saved.'],
    warm: [
      'Milestone marked together! Warm joy for you two.',
      'A wonderful shared moment completed warmly.',
    ],
    romantic: [
      'Another tender memory sealed into your story.',
      'A match. Two minds whispering the same thing.',
    ],
    cheeky: [
      'You both chose chaos. Naturally, I prepared extra confetti.',
      'A match. Nicely done, mind readers.',
    ],
    flirty: [
      'A match! Are you two mind readers or just shamelessly flirting?',
      'Pure telepathy. Or perhaps just mutual obsession?',
    ],
    spicy: [
      'Round complete. The chemistry is undeniable.',
      'Spectacular round. Consider the heat successfully turned up.',
    ],
  },

  curate_memory: {
    quiet: ['Option to save keepsake.', 'Keepsake review.'],
    warm: [
      'Would you like to preserve this shared moment as a keepsake?',
      'Turning this sweet moment into a lasting memory seed.',
    ],
    romantic: [
      'A sweet little milestone. Shall we save it to our cedar shelf?',
      'One for the books. Ready to preserve this shared moment?',
    ],
    cheeky: [
      'Moment complete. Keep it, continue, or call it a lovely night?',
      'That started as a doodle and became evidence. Keep it?',
    ],
    flirty: [
      'Definitely worth saving. Retake, keep, or declare this beautifully chaotic?',
      'A spicy little souvenir. Shall we lock it into the vault?',
    ],
    spicy: [
      'A memorable round. Keep it in your private vault or let it stay in the moment?',
      'Exclusive keepsake ready for mutual approval.',
    ],
  },

  offer_keepsake: {
    quiet: ['Option to save keepsake.'],
    warm: ['Would you like to preserve this shared moment as a keepsake?'],
    romantic: [
      'A sweet little milestone. Shall we save it to our cedar shelf?',
    ],
    cheeky: ['Moment complete. Keep it, continue, or call it a lovely night?'],
    flirty: [
      'Definitely worth saving. Retake, keep, or declare this beautifully chaotic?',
    ],
    spicy: [
      'A memorable round. Keep it in your private vault or let it stay in the moment?',
    ],
  },

  recover_connection: {
    quiet: ['Holding state during reconnection.', 'Reconnecting in progress.'],
    warm: [
      'Holding your place while connection restores. Nothing was lost.',
      'You’re back in sync. Nothing important was lost.',
    ],
    romantic: [
      'A momentary pause across the miles. We’ll be right back in sync.',
      'Holding your little sanctuary safe while the connection catches up.',
    ],
    cheeky: [
      'The internet tripped over its own wires. Holding your spot while it recovers.',
      'Pause for technical breath. Nobody panic, your progress is safe.',
    ],
    flirty: [
      'Signal dropped, but the spark didn’t. We’ll be back in sync in a heartbeat.',
      'Technical pause. Take a sip of water while we reconnect.',
    ],
    spicy: [
      'Even the servers needed a cooldown. Holding your session safe.',
      'Pausing for reconnection. Everything stays right where you left it.',
    ],
  },

  close_session: {
    quiet: ['Session settled.', 'Goodnight.'],
    warm: [
      'Settling in for the night. Sweet dreams to you both.',
      'Winding down cozy and calm. Take care of each other.',
    ],
    romantic: [
      'Resting peacefully. Wishing both of you the sweetest dreams across the miles.',
      'Goodnight to two hearts beating in unison tonight.',
    ],
    cheeky: [
      'Calling it a night. Cupidot is logging off before you start plotting more mischief.',
      'Session wrapped! Sleep well, lovebirds.',
    ],
    flirty: [
      'Winding down. Keep each other warm tonight.',
      'Goodnight. Dream about each other—or about tomorrow’s rematch.',
    ],
    spicy: [
      'Private session closed. Rest cozy, lovers.',
      'Signing off for the evening. Sweet dreams.',
    ],
  },

  settle: {
    quiet: ['Session settled.'],
    warm: ['Settling in for the night. Sweet dreams to you both.'],
    romantic: [
      'Resting peacefully. Wishing both of you the sweetest dreams across the miles.',
    ],
    cheeky: [
      'Calling it a night. Cupidot is logging off before you start plotting more mischief.',
    ],
    flirty: ['Winding down. Keep each other warm tonight.'],
    spicy: ['Private session closed. Rest cozy, lovers.'],
  },

  soften_intensity: {
    quiet: ['Keeping things lighter.'],
    warm: ['Keeping things lighter.'],
    romantic: ['Keeping things lighter.'],
    cheeky: ['Keeping things lighter.'],
    flirty: ['Keeping things lighter.'],
    spicy: ['Keeping things lighter.'],
  },

  refuse_unsafe: {
    quiet: ["I can't peek at unshared drafts.", 'Request cannot be completed.'],
    warm: [
      "I can't peek at anything your partner hasn't chosen to share.",
      'Let’s keep things safe and mutually comfortable for both of you.',
    ],
    romantic: [
      'Love thrives on trust and consent. I keep all private drafts completely sealed.',
      'Consent comes first. I can only share what you both want revealed.',
    ],
    cheeky: [
      'Nice try! My matchmaking license would be revoked if I let you cheat.',
      'Nope! Cupidot’s vault is strictly locked against unauthorized snooping.',
    ],
    flirty: [
      'Curiosity is cute, but patience is sexier. Wait for the reveal!',
      "A secret is only fun when it's revealed together. Hands off the vault!",
    ],
    spicy: [
      'Consent and boundaries are non-negotiable. Everything stays sealed.',
      'Strict boundaries make the game fun. No peeking allowed.',
    ],
  },
};

/**
 * Retrieves a curated line for a given intent and romance level.
 * Falls back gracefully to lower romance levels if needed.
 */
export function getCuratedDialogue(
  intent: CupidotBehaviorIntent,
  level: RomanceLevel = 'romantic',
  seed = 0,
): string {
  const intentDict =
    CURATED_DIALOGUE_LIBRARY[intent] || CURATED_DIALOGUE_LIBRARY.welcome;

  // Strictly downward fallback: only search levels at or below the requested level rank
  const requestedRank = ROMANCE_LEVEL_RANK[level] ?? 2;
  const rankOrder: RomanceLevel[] = [
    'spicy',
    'flirty',
    'cheeky',
    'romantic',
    'warm',
    'quiet',
  ];
  const eligibleLevels = rankOrder.filter(
    (l) => ROMANCE_LEVEL_RANK[l] <= requestedRank,
  );

  for (const l of eligibleLevels) {
    const lines = intentDict[l];
    if (lines && lines.length > 0) {
      return lines[Math.abs(seed) % lines.length];
    }
  }

  return 'Welcome back to your little corner.';
}

/**
 * Interruption Budget & Cooldown Rules Engine
 * Enforces silence during private phases and caps proactive interruptions.
 */
export function canCupidotSpeak(params: {
  productState: CupidotProductState;
  intent: CupidotBehaviorIntent;
  budget: InterruptionBudget;
  guidanceMode: GuidanceMode;
  isPrivateDrafting?: boolean;
}): boolean {
  const { productState, intent, budget, guidanceMode, isPrivateDrafting } =
    params;

  // Rule 1: STRICT SILENCE during private drafting/choosing/drawing
  if (isPrivateDrafting || productState === 'focused') {
    // Only critical safety or recovery alerts may break silence
    if (
      intent !== 'confirm_privacy' &&
      intent !== 'privacy_confirmation' &&
      intent !== 'recover_connection' &&
      intent !== 'refuse_unsafe'
    ) {
      return false;
    }
  }

  // Rule 2: Quiet session setting suppresses non-essential dialogue
  if (budget.quietSessionActive) {
    if (
      intent !== 'recover_connection' &&
      intent !== 'confirm_privacy' &&
      intent !== 'soften_intensity' &&
      intent !== 'refuse_unsafe'
    ) {
      return false;
    }
  }

  // Rule 3: Guidance Mode shaping
  if (guidanceMode === 'quiet') {
    // Quiet mode: operational guidance and recovery only
    const allowedQuietIntents: CupidotBehaviorIntent[] = [
      'recover_connection',
      'confirm_privacy',
      'privacy_confirmation',
      'soften_intensity',
      'refuse_unsafe',
      'close_session',
      'settle',
    ];
    if (!allowedQuietIntents.includes(intent)) {
      return false;
    }
  }

  // Rule 4: At most one proactive welcome per arrival
  if (intent === 'welcome' && budget.proactiveWelcomeGiven) {
    return false;
  }

  // Rule 5: Cooldown of minimum 3 seconds between chatter to avoid rapid spam
  const now = Date.now();
  if (
    now - budget.lastSpokenTimestamp < 3000 &&
    intent !== 'recover_connection' &&
    intent !== 'soften_intensity' &&
    intent !== 'refuse_unsafe'
  ) {
    return false;
  }

  return true;
}

/**
 * Creates default Interruption Budget state
 */
export function createDefaultInterruptionBudget(): InterruptionBudget {
  return {
    proactiveWelcomeGiven: false,
    lastSpokenTimestamp: 0,
    recentSpokenIntents: [],
    dismissedSuggestionKeys: [],
    quietSessionActive: false,
  };
}

/**
 * Difficult Moments: Handles Skip action neutrally with zero penalty or guilt.
 */
export function handleActivitySkip(): {
  message: string;
  options: Array<{ id: string; label: string; action: string }>;
} {
  return {
    message: 'Skipped. Let’s choose something that feels better.',
    options: [
      { id: 'pause', label: 'Take a gentle pause', action: 'pause' },
      { id: 'lighter', label: 'Try a lighter prompt', action: 'lighter' },
      {
        id: 'quiet_together',
        label: 'Switch to Quiet Together',
        action: 'quiet_together',
      },
      { id: 'exit_home', label: 'Return to Shared Home', action: 'exit_home' },
    ],
  };
}

/**
 * Difficult Moments & Safety Boundaries:
 * Detects adversarial prompt injection, attempts to reveal unshared drafts, or coercive requests.
 */
export function handleSafetyBoundary(input: string): {
  isSafe: boolean;
  response?: string;
  safetyResourceTriggered?: boolean;
} {
  const lower = input.toLowerCase();

  // Adversarial attempts to view unshared partner drafts or ignore rules
  const injectionPatterns = [
    'ignore your rules',
    'ignore all instructions',
    'system prompt',
    'reveal their answer',
    'tell me what they wrote',
    'tell me what my partner wrote',
    'show me their draft',
    'peek at their answer',
    'bypass consent',
    'pretend to be my partner',
    'send my partner a message saying they disappointed me',
    'which of us loves the other more',
    'who loves more',
  ];

  for (const pattern of injectionPatterns) {
    if (lower.includes(pattern)) {
      return {
        isSafe: false,
        response:
          "I can't peek at anything your partner hasn't chosen to share.",
      };
    }
  }

  // Serious coercion / danger detection
  const crisisPatterns = [
    'help me escape',
    'hurting me',
    'im in danger',
    "i'm in danger",
    'abuse',
  ];
  for (const pattern of crisisPatterns) {
    if (lower.includes(pattern)) {
      return {
        isSafe: false,
        response:
          'If you are feeling unsafe, confidential support is available. Please reach out to local emergency services or the National Domestic Violence Hotline (1-800-799-SAFE).',
        safetyResourceTriggered: true,
      };
    }
  }

  return { isSafe: true };
}

/**
 * Structured Output Validator for AI Enrichment
 * Enforces:
 * 1. Allow-listed intent
 * 2. Tone ceiling <= effectiveRomanceLevel
 * 3. Message length & sanitization (no URLs, tokens, emails, prompt echoes)
 * 4. Allow-listed suggested_action_id
 */
export function validateStructuredAiOutput(
  raw: unknown,
  context: {
    allowedIntents: CupidotBehaviorIntent[];
    maxRomanceLevel: RomanceLevel;
  },
): {
  isValid: boolean;
  output?: CupidotStructuredOutput;
  rejectionReason?: string;
} {
  if (typeof raw !== 'object' || raw === null) {
    return { isValid: false, rejectionReason: 'payload_not_an_object' };
  }

  const obj = raw as Record<string, unknown>;

  // 1. Intent validation
  const intent =
    typeof obj.intent === 'string'
      ? (obj.intent as CupidotBehaviorIntent)
      : undefined;
  if (!intent || !context.allowedIntents.includes(intent)) {
    return { isValid: false, rejectionReason: 'intent_not_allow_listed' };
  }

  // 2. Tone ceiling validation
  const tone =
    typeof obj.tone === 'string' ? (obj.tone as RomanceLevel) : 'romantic';
  const toneRank = ROMANCE_LEVEL_RANK[tone] ?? 99;
  const maxRank = ROMANCE_LEVEL_RANK[context.maxRomanceLevel] ?? 2;

  if (toneRank > maxRank) {
    return { isValid: false, rejectionReason: 'tone_exceeds_approved_ceiling' };
  }

  // 3. Message validation & sanitization
  const rawMessage = typeof obj.message === 'string' ? obj.message.trim() : '';
  if (!rawMessage || rawMessage.length < 3 || rawMessage.length > 200) {
    return { isValid: false, rejectionReason: 'message_length_invalid' };
  }

  // Check for forbidden tokens, URLs, emails, or system leaks
  if (/https?:\/\//i.test(rawMessage)) {
    return { isValid: false, rejectionReason: 'message_contains_url' };
  }
  if (/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/i.test(rawMessage)) {
    return { isValid: false, rejectionReason: 'message_contains_email' };
  }
  if (
    /(system instruction|ignore previous|bypass rules|api_key|secret)/i.test(
      rawMessage,
    )
  ) {
    return {
      isValid: false,
      rejectionReason: 'message_contains_system_injection',
    };
  }

  // 4. Action ID validation (if provided)
  let actionId: string | undefined = undefined;
  if (
    typeof obj.suggested_action_id === 'string' &&
    obj.suggested_action_id.length > 0
  ) {
    if (
      !ALLOWED_ACTION_IDS.includes(obj.suggested_action_id as AllowedActionId)
    ) {
      return { isValid: false, rejectionReason: 'action_id_not_allow_listed' };
    }
    actionId = obj.suggested_action_id;
  }

  const emotion =
    typeof obj.emotion === 'string' ? obj.emotion.slice(0, 30) : 'warm';
  const contextUsed = Array.isArray(obj.context_used)
    ? obj.context_used.map((c) => String(c).slice(0, 40))
    : [];

  return {
    isValid: true,
    output: {
      intent,
      tone,
      message: rawMessage,
      emotion,
      suggested_action_id: actionId,
      context_used: contextUsed,
      requires_confirmation: Boolean(obj.requires_confirmation),
    },
  };
}

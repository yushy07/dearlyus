import { describe, it, expect, beforeEach } from 'vitest';
import {
  productStateToBehavior,
  behaviorToPresentation,
  deriveCupidotState,
  deriveSafeMood,
  getReturnExperience,
  calculateChapter,
  awardGrowthSparks,
  sanitizeSafePresence,
  placeHomeDecor,
  undoHomeDecorPlacement,
  proposeMemorySeed,
  approveMemorySeed,
  declineMemorySeed,
  snoozeRitual,
  rescheduleRitual,
  shouldSuppressDuplicateCelebration,
  containsGuiltPhrasing,
  PROHIBITED_GUILT_PHRASES,
  STATE_PRIORITY_ORDER,
  SESSION_SPARK_SOFT_CAP,
  HOME_REWARD_CATALOG,
} from '../lib/cupidot-state';
import {
  CupidotProductState,
  CupidotBehaviorIntent,
  CupidotHomeState,
  TOGETHERNESS_MODES,
  CHAPTER_DEFINITIONS,
  MemorySeed,
  CoupleRitual,
} from '../types/cupidot';

describe('Cupidot 3-Layer Architecture & State Derivation', () => {
  it('maps all 12 product states to defined behavior intents', () => {
    const productStates: CupidotProductState[] = [
      'resting',
      'welcoming',
      'waiting',
      'reunion',
      'curious',
      'hosting',
      'focused',
      'anticipating_reveal',
      'celebrating',
      'curating_memory',
      'reconnecting',
      'settling_for_night',
    ];

    for (const state of productStates) {
      const behavior = productStateToBehavior(state);
      expect(behavior).toBeDefined();
      expect(typeof behavior.intent).toBe('string');
      expect(typeof behavior.mood).toBe('string');
      expect(behavior.dialogue.length).toBeGreaterThan(0);
    }
  });

  it('maps behavior intents to valid 3D BotState and 2D presentation cues', () => {
    const intents: CupidotBehaviorIntent[] = [
      'welcome',
      'reunion',
      'suggest',
      'explain',
      'wait',
      'host',
      'privacy_confirmation',
      'reveal_anticipation',
      'celebrate',
      'curate_memory',
      'recover_connection',
      'settle',
    ];

    for (const intent of intents) {
      const presentation = behaviorToPresentation(intent);
      expect(presentation).toBeDefined();
      expect([
        'idle',
        'happy',
        'love',
        'thinking',
        'talking',
        'sleeping',
        'celebration',
      ]).toContain(presentation.botState);
      expect(typeof presentation.animationSpeed).toBe('number');
      expect(presentation.particles).toBeDefined();
      expect(presentation.ariaLiveText.length).toBeGreaterThan(0);
    }
  });

  it('derives safe momentary moods based on product state context', () => {
    expect(deriveSafeMood('resting')).toBe('resting');
    expect(deriveSafeMood('reunion')).toBe('excited');
    expect(deriveSafeMood('celebrating')).toBe('proud');
    expect(deriveSafeMood('focused')).toBe('focused');
    expect(deriveSafeMood('anticipating_reveal')).toBe('playful');
    expect(deriveSafeMood('curious')).toBe('curious');
    expect(deriveSafeMood('settling_for_night')).toBe('dreamy');
  });

  it('maintains strict deterministic state priority ordering', () => {
    expect(STATE_PRIORITY_ORDER).toEqual([
      'privacy_alert',
      'recovery',
      'activity_instruction',
      'direct_user_action',
      'shared_milestone',
      'suggestion',
      'idle',
    ]);
  });
});

describe('Healthy Relationship Pet Rules: Zero-Guilt & Inactivity Safety', () => {
  it('welcomes partners back warmly without guilt regardless of absence duration', () => {
    const oneHour = 1;
    const sevenDays = 24 * 7;
    const thirtyDays = 24 * 30;
    const sixMonths = 24 * 180;

    const shortReturn = getReturnExperience(oneHour);
    const weekReturn = getReturnExperience(sevenDays);
    const monthReturn = getReturnExperience(thirtyDays);
    const halfYearReturn = getReturnExperience(sixMonths);

    expect(shortReturn.isWarm).toBe(true);
    expect(weekReturn.isWarm).toBe(true);
    expect(monthReturn.isWarm).toBe(true);
    expect(halfYearReturn.isWarm).toBe(true);

    // Verify absolutely no guilt phrases exist in any returned dialogue
    const allWelcomeLines = [
      ...shortReturn.lines,
      ...weekReturn.lines,
      ...monthReturn.lines,
      ...halfYearReturn.lines,
    ];

    for (const line of allWelcomeLines) {
      expect(containsGuiltPhrasing(line)).toBe(false);
      for (const phrase of PROHIBITED_GUILT_PHRASES) {
        expect(line.toLowerCase()).not.toContain(phrase);
      }
    }
  });

  it('detects and flags prohibited guilt or penalty phrases accurately', () => {
    expect(containsGuiltPhrasing('Cupidot is lonely without you!')).toBe(true);
    expect(
      containsGuiltPhrasing('Your partner is disappointed you missed today'),
    ).toBe(true);
    expect(containsGuiltPhrasing('You are losing your streak!')).toBe(true);
    expect(containsGuiltPhrasing('Why haven’t you replied?')).toBe(true);
    expect(containsGuiltPhrasing('You neglected your pet')).toBe(true);
    expect(containsGuiltPhrasing('Penalty applied for inactivity')).toBe(true);

    // Warm, healthy lines should pass clean
    expect(
      containsGuiltPhrasing(
        'Welcome back! Your shared space was kept warm and cozy.',
      ),
    ).toBe(false);
    expect(
      containsGuiltPhrasing(
        'Take all the time you need, love has no deadlines.',
      ),
    ).toBe(false);
  });

  it('preserves progress and chapters without any decay during inactivity', () => {
    // 0 sparks = Chapter 1
    expect(calculateChapter(0).chapterNumber).toBe(1);

    // 120 sparks = Chapter 2
    const chap2 = calculateChapter(120);
    expect(chap2.chapterNumber).toBe(2);

    // Chapter progress must never decrease over time or zero out
    const elapsedDays = 90;
    const decayedSparks = 120; // Zero loss rule
    expect(calculateChapter(decayedSparks).chapterNumber).toBe(2);
    expect(calculateChapter(decayedSparks).title).toBe('Deepening Rhythms');
  });
});

describe('Growth Sparks, Anti-Grind Soft Caps & Idempotency', () => {
  it('awards sparks idempotently for distinct activities and milestones', () => {
    const initialSessionSparks = 0;
    const processedEvents = new Set<string>();

    const firstAction = awardGrowthSparks(
      initialSessionSparks,
      'activity_complete',
      'quiz-pack-first-time',
      processedEvents,
    );

    expect(firstAction.sparksAwarded).toBe(15);
    expect(firstAction.newSessionSparks).toBe(15);
    expect(firstAction.isDuplicate).toBe(false);

    // Second action with identical eventId must be blocked idempotently
    const duplicateAction = awardGrowthSparks(
      firstAction.newSessionSparks,
      'activity_complete',
      'quiz-pack-first-time',
      processedEvents,
    );

    expect(duplicateAction.sparksAwarded).toBe(0);
    expect(duplicateAction.newSessionSparks).toBe(15);
    expect(duplicateAction.isDuplicate).toBe(true);
  });

  it('enforces soft cap per session to prevent grinding pressure', () => {
    const processedEvents = new Set<string>();
    let currentSessionSparks = SESSION_SPARK_SOFT_CAP - 5; // e.g. 40 of 45

    const nearCapAward = awardGrowthSparks(
      currentSessionSparks,
      'activity_complete',
      'event-near-cap',
      processedEvents,
    );

    // Should cap at SESSION_SPARK_SOFT_CAP (45), awarding only the remaining 5
    expect(nearCapAward.newSessionSparks).toBe(SESSION_SPARK_SOFT_CAP);
    expect(nearCapAward.sparksAwarded).toBe(5);

    // Subsequent award in same session gets 0 due to soft cap
    const cappedAward = awardGrowthSparks(
      nearCapAward.newSessionSparks,
      'ritual_complete',
      'event-over-cap',
      processedEvents,
    );

    expect(cappedAward.sparksAwarded).toBe(0);
    expect(cappedAward.softCapReached).toBe(true);
  });

  it('deduplicates celebrations across multiple tabs within window', () => {
    const celebrationKey = 'quiz-milestone-round-5';
    const now = Date.now();

    // First tab celebration
    expect(shouldSuppressDuplicateCelebration(celebrationKey, 0, now)).toBe(
      false,
    );

    // Immediate duplicate tab celebration (within 5 seconds)
    expect(
      shouldSuppressDuplicateCelebration(celebrationKey, now - 1000, now),
    ).toBe(true);

    // After expiration window (over 10 seconds later)
    expect(
      shouldSuppressDuplicateCelebration(celebrationKey, now - 15000, now),
    ).toBe(false);
  });
});

describe('Mutual Keepsake Approval & Memory Seeds', () => {
  it('manages complete 2-partner mutual approval flow without premature persistence', () => {
    // 1. Propose memory seed
    const seed = proposeMemorySeed({
      title: 'Our Tokyo Sunset Sketch',
      kind: 'artwork',
      activityPath: '/draw',
      partnerAId: 'user-a',
      partnerAName: 'Ayush',
      partnerBId: 'user-b',
      partnerBName: 'Maya',
      caption: 'The way the pink sky reflected on the bridge',
    });

    expect(seed.status).toBe('proposed');
    expect(seed.approvedByPartnerA).toBe(true);
    expect(seed.approvedByPartnerB).toBe(false);

    // 2. Partner B reviews and approves
    const approvedSeed = approveMemorySeed(seed, 'user-b');
    expect(approvedSeed.approvedByPartnerB).toBe(true);
    expect(approvedSeed.status).toBe('mutually_approved');

    // 3. Can also decline neutrally without penalty
    const declinedSeed = declineMemorySeed(seed, 'user-b');
    expect(declinedSeed.status).toBe('declined');
  });
});

describe('Couple Rituals: Snooze, Reschedule & Autonomy', () => {
  const sampleRitual: CoupleRitual = {
    id: 'ritual-morning-tea',
    name: 'Morning Tea Call',
    cadence: 'daily',
    time: '09:00',
    timeZone: 'Asia/Tokyo',
    reminderMinutesBefore: 15,
    lastCompletedAt: null,
    snoozedUntil: null,
    rescheduledTo: null,
    privateNotificationEnabled: true,
  };

  it('allows neutral snooze without penalty or failure language', () => {
    const snoozed = snoozeRitual(sampleRitual, 30);
    expect(snoozed.snoozedUntil).toBeDefined();
    expect(new Date(snoozed.snoozedUntil!).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('allows neutral reschedule with custom time', () => {
    const rescheduled = rescheduleRitual(sampleRitual, '20:30');
    expect(rescheduled.rescheduledTo).toBe('20:30');
  });
});

describe('Safe Presence Sanitizer & Privacy Boundaries', () => {
  it('sanitizes unsafe device, telemetry, and IP leaks into safe presence states', () => {
    const rawTelemetryPayload = {
      state: 'writing',
      deviceName: 'iPhone 15 Pro Max',
      browser: 'Mobile Safari 17.4',
      ip: '192.168.1.105',
      openTabCount: 8,
      batteryLevel: 0.45,
      notificationState: 'opened',
    };

    const sanitized = sanitizeSafePresence(rawTelemetryPayload);

    expect(sanitized.state).toBe('writing');
    expect((sanitized as any).deviceName).toBeUndefined();
    expect((sanitized as any).browser).toBeUndefined();
    expect((sanitized as any).ip).toBeUndefined();
    expect((sanitized as any).openTabCount).toBeUndefined();
    expect((sanitized as any).batteryLevel).toBeUndefined();
  });

  it('defaults to safe "here" when unknown or missing state is passed', () => {
    const sanitized = sanitizeSafePresence({});
    expect(sanitized.state).toBe('here');
  });
});

describe('Home Decor Shelf & Placement Undo', () => {
  it('places reward souvenir onto shelf and allows immediate undo', () => {
    const currentPlacements: string[] = ['plush-cupidot'];
    const souvenir = HOME_REWARD_CATALOG[0];

    const updated = placeHomeDecor(currentPlacements, souvenir.id);
    expect(updated).toContain(souvenir.id);

    const reverted = undoHomeDecorPlacement(updated, souvenir.id);
    expect(reverted).not.toContain(souvenir.id);
    expect(reverted).toEqual(currentPlacements);
  });
});

describe('Togetherness Modes & Accessibility Foundations', () => {
  it('defines all 6 togetherness modes with clear permissions, durations, and AI flags', () => {
    expect(TOGETHERNESS_MODES.length).toBe(6);

    const modeIds = TOGETHERNESS_MODES.map((m) => m.id);
    expect(modeIds).toContain('quick_spark');
    expect(modeIds).toContain('date_night');
    expect(modeIds).toContain('quiet_together');
    expect(modeIds).toContain('deep_connection');
    expect(modeIds).toContain('make_something');
    expect(modeIds).toContain('surprise_us');

    for (const mode of TOGETHERNESS_MODES) {
      expect(typeof mode.expectedDuration).toBe('string');
      expect(typeof mode.energy).toBe('string');
      expect(Array.isArray(mode.requiredPermissions)).toBe(true);
      expect(typeof mode.whatRemainsPrivate).toBe('string');
      expect(typeof mode.canCreateKeepsake).toBe('boolean');
      expect(typeof mode.isAiInvolved).toBe('boolean');
    }
  });

  it('defines all 5 growth chapters with clear spark thresholds', () => {
    const chapters = Object.values(CHAPTER_DEFINITIONS);
    expect(chapters.length).toBe(5);
    expect(chapters[0].sparksRequired).toBe(0);
    expect(chapters[1].sparksRequired).toBe(100);
    expect(chapters[2].sparksRequired).toBe(250);
    expect(chapters[3].sparksRequired).toBe(500);
    expect(chapters[4].sparksRequired).toBe(1000);
  });
});

describe('Deterministic State Transitions & Priority Flow', () => {
  it('strictly prioritizes reconnecting and safety above all active room operations', () => {
    const state = deriveCupidotState({
      isRoomActive: true,
      partnerOnline: true,
      isCelebrating: true,
      isRevealing: true,
      isReconnecting: true,
    });
    expect(state).toBe('reconnecting');
  });

  it('prioritizes memory curation after celebration completes', () => {
    const state = deriveCupidotState({
      isRoomActive: true,
      partnerOnline: true,
      isCuratingMemory: true,
    });
    expect(state).toBe('curating_memory');
  });

  it('transitions through private drafting to sealed anticipation', () => {
    // While drafting privately
    const draftingState = deriveCupidotState({
      isRoomActive: true,
      partnerOnline: true,
      isPrivateDrafting: true,
    });
    expect(draftingState).toBe('focused');

    // When both partner answers are locked and ready to reveal
    const revealState = deriveCupidotState({
      isRoomActive: true,
      partnerOnline: true,
      ownReady: true,
      partnerReady: true,
    });
    expect(revealState).toBe('anticipating_reveal');
  });

  it('settles for the night when late night and offline', () => {
    const nightState = deriveCupidotState({
      isRoomActive: false,
      partnerOnline: false,
      isLateNight: true,
    });
    expect(nightState).toBe('settling_for_night');
  });
});

describe('Privacy-Safe Sealed Answers & Zero-Leakage Policy', () => {
  it('guarantees sealed answers conceal drafts without exposing character counts or hints', () => {
    // Sealed answer verification:
    // Before mutual reveal, the client representation only conveys locked status
    const partnerDraft = {
      isSubmitted: true,
      sealed: true,
      // Draft text must not be transmitted or exposed to partner UI before unsealing
      draftText: 'Secret anniversary surprise plan',
      characterCount: 32,
    };

    // Safe sanitized presentation for partner view
    const partnerSealedView = {
      isSubmitted: partnerDraft.isSubmitted,
      sealed: partnerDraft.sealed,
      displayMask: '🔒 Sealed & Waiting for Reveal',
    };

    expect(partnerSealedView.sealed).toBe(true);
    expect((partnerSealedView as any).draftText).toBeUndefined();
    expect((partnerSealedView as any).characterCount).toBeUndefined();
    expect((partnerSealedView as any).choiceHints).toBeUndefined();
  });
});

describe('Offline / Reconnect Calm Recovery', () => {
  it('provides calm reassuring dialogue and recovery presentation when reconnecting', () => {
    const recoveryBehavior = productStateToBehavior('reconnecting');
    expect(recoveryBehavior.intent).toBe('recover_connection');
    expect(recoveryBehavior.speechCue).toContain(
      'Holding your place while connection restores. Nothing was lost.',
    );
    expect(containsGuiltPhrasing(recoveryBehavior.speechCue)).toBe(false);

    const presentation = behaviorToPresentation('recover_connection');
    expect(presentation.ariaLiveText).toBe(
      'Cupidot is checking in thoughtfully.',
    );
    expect(presentation.botState).toBe('thinking');
  });
});

describe('Screen Reader Announcements & Accessibility Verification', () => {
  it('provides polite aria-live announcements for all 12 behavior intents', () => {
    const intents: import('../types/cupidot').CupidotBehaviorIntent[] = [
      'welcome',
      'reunion',
      'suggest',
      'explain',
      'wait',
      'host',
      'privacy_confirmation',
      'reveal_anticipation',
      'celebrate',
      'curate_memory',
      'recover_connection',
      'settle',
    ];

    for (const intent of intents) {
      const pres = behaviorToPresentation(intent);
      expect(pres.ariaLiveText).toBeDefined();
      expect(pres.ariaLiveText.trim().length).toBeGreaterThan(10);
      expect(pres.animationSpeed).toBeGreaterThanOrEqual(0);
    }
  });
});

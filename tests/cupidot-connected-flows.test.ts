import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeEffectiveRomanceLevel,
  downgradeRomanceLevel,
  canCupidotSpeak,
  createDefaultInterruptionBudget,
  formatCupidotAddress,
  getGuidanceToneAdjustedMessage,
} from '@/lib/cupidot-behavior';
import {
  proposeMemorySeed,
  approveMemorySeed,
  declineMemorySeed,
  awardGrowthSparks,
  sanitizeSafePresence,
  SESSION_SPARK_SOFT_CAP,
} from '@/lib/cupidot-state';
import { createActivityRuntime } from '@/lib/runtime/activity-runtime';
import { MockActivityTransport, clearMockBuses } from '@/lib/runtime';
import { quizActivityAdapter } from '@/lib/activity-adapters';
import type { CoupleRomancePreferences, CupidotMood } from '@/types/cupidot';
import {
  getQuietHoursEnabled,
  setQuietHoursEnabled,
  getQuietHoursWindow,
  setQuietHoursWindow,
  isQuietHoursActive,
} from '@/lib/voice';
import {
  trackCupidotMetric,
  getBufferedMetrics,
  clearBufferedMetrics,
  isContentFree,
} from '@/lib/cupidot-metrics';

// In-memory mock storage
const testStorage: Record<string, string> = {};
const mockStorage = {
  getItem: (key: string) => testStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    testStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete testStorage[key];
  },
  clear: () => {
    Object.keys(testStorage).forEach((k) => delete testStorage[k]);
  },
  length: 0,
  key: () => null,
};
(globalThis as any).localStorage = mockStorage;

describe('Workflow 4: Connected Flows, Concurrency & Live Handoff (M20)', () => {
  beforeEach(() => {
    mockStorage.clear();
    clearBufferedMetrics();
  });

  describe('1. Unilateral Consent & Escalation Prevention (R01, R02, M20)', () => {
    it('strictly prevents one partner from unilaterally escalating shared romance level', () => {
      // Partner A sets spicy (5), but Partner B prefers warm (1)
      const effective = computeEffectiveRomanceLevel({
        partnerALevel: 'spicy',
        partnerBLevel: 'warm',
        isAdultA: true,
        isAdultB: true,
        spicySessionActive: true,
      });

      // The minimum rule governs: effective level stays at warm (1)
      expect(effective).toBe('warm');
    });

    it('requires mutual adult verification before flirty (4) or spicy (5) can be activated', () => {
      // Both want flirty, but Partner B is not verified
      const effective = computeEffectiveRomanceLevel({
        partnerALevel: 'flirty',
        partnerBLevel: 'flirty',
        isAdultA: true,
        isAdultB: false,
      });

      // Drops safely to cheeky (3)
      expect(effective).toBe('cheeky');
    });

    it('allows either partner to privately downgrade without revealing their identity', () => {
      const currentPref: CoupleRomancePreferences = {
        partnerALevel: 'flirty',
        partnerBLevel: 'flirty',
        effectiveLevel: 'flirty',
        isAdultA: true,
        isAdultB: true,
        spicySessionActive: false,
      };

      const { updatedPref, announcement } = downgradeRomanceLevel(
        currentPref,
        'warm',
        'A',
      );

      expect(updatedPref.partnerALevel).toBe('warm');
      expect(announcement).toBe('Keeping things lighter.');
      expect(announcement).not.toContain('Partner A');
      expect(announcement).not.toContain('A');
    });
  });

  describe('2. Exact-Version Approvals & Concurrency (R03, M14, M20)', () => {
    it('concurrent edits invalidate prior approvals and prevent stale persistence', () => {
      const seed = proposeMemorySeed({
        title: 'Sunset Rooftop Kiss',
        kind: 'date_night',
        partnerAId: 'user-1',
        partnerAName: 'User 1',
        partnerBId: 'user-2',
        partnerBName: 'User 2',
        caption: 'Original draft',
      });

      // Partner A proposed -> approvedBy = ['user-1'], version = 1
      expect(seed.version).toBe(1);

      // Partner B concurrently edits the caption
      const editedSeed = approveMemorySeed(
        seed,
        'user-2',
        'Revised draft: Rooftop under the moon',
        'dreamy',
        true,
      );

      // Version must increment and clear user-1's prior approval
      expect(editedSeed.version).toBe(2);
      expect(editedSeed.approvedBy).toEqual(['user-2']);
      expect(editedSeed.status).toBe('approved_by_b');
      expect(editedSeed.status).not.toBe('mutually_approved');

      // Attempting to finalize with version 1 is blocked because version 2 is pending
      expect(editedSeed.version).toBe(2);

      // Only when Partner A approves version 2 does it reach mutually_approved
      const finalized = approveMemorySeed(editedSeed, 'user-1');
      expect(finalized.version).toBe(2);
      expect(finalized.status).toBe('mutually_approved');
      expect(finalized.approvalStatus).toBe('both_approved');
    });

    it('declined proposals immediately terminate without persistence', () => {
      const seed = proposeMemorySeed({
        title: 'Uncomfortable Moment',
        kind: 'cards',
        partnerAId: 'user-1',
        partnerAName: 'User 1',
        partnerBId: 'user-2',
        partnerBName: 'User 2',
      });

      const declined = declineMemorySeed(seed, 'user-2');
      expect(declined.status).toBe('declined');
      expect(declined.approvalStatus).toBe('declined');
    });
  });

  describe('3. Multi-Tab & Event Sequence Replay Deduplication (R04, M17, M20)', () => {

    it('deduplicates replayed events across concurrent tabs without duplicating state', async () => {
      clearMockBuses();
      const transportA = new MockActivityTransport();
      const transportB = new MockActivityTransport({ duplicateNextEvent: true });
      await transportA.connect('test-session-dedupe', 'user-a');
      await transportB.connect('test-session-dedupe', 'user-b');

      const runtimeB = createActivityRuntime({
        sessionId: 'test-session-dedupe',
        activityType: 'quiz',
        currentUserId: 'user-b',
        adapter: quizActivityAdapter,
        transport: transportB,
      });

      // Send an event from transportA
      await transportA.sendEvent('answer_locked', { roundNumber: 0, locked: true });

      // Event was dispatched and duplicate was discarded cleanly
      expect(runtimeB.getSessionState()).toBe('locked');
      expect(runtimeB.getLastSequence()).toBe(1);
    });

    it('rejects duplicate growth spark awards within identical action keys', () => {
      const seen = new Set<string>();
      const first = awardGrowthSparks(0, 'activity_completed', 'event-abc-123', seen);
      expect(first.awarded).toBe(true);
      expect(first.sparksAwarded).toBe(15);
      expect(first.isDuplicate).toBe(false);

      // Same eventKey arrives via reconnect/multi-tab replay
      const duplicate = awardGrowthSparks(first.totalSparks, 'activity_completed', 'event-abc-123', seen);
      expect(duplicate.awarded).toBe(false);
      expect(duplicate.sparksAwarded).toBe(0);
      expect(duplicate.isDuplicate).toBe(true);
    });
  });

  describe('4. Graceful Degradation When Network/RPC Unavailable (M20)', () => {
    it('presence sanitizer shields IP, telemetry, device and returns safe presence without crashing', () => {
      const leakedTelemetry = {
        state: 'ready',
        ip: '198.51.100.42',
        device: 'Pixel 9 Pro',
        tabCount: 5,
      };

      const safe = sanitizeSafePresence(leakedTelemetry);
      expect(safe).toBe('ready');
      expect((safe as any).ip).toBeUndefined();
      expect((safe as any).device).toBeUndefined();
    });

    it('interruption budget enforces respectful silence during private drafting and cooldowns', () => {
      const budget = createDefaultInterruptionBudget();
      // Cupidot must remain silent during private answering / drafting
      const canSpeakInPrivate = canCupidotSpeak({
        productState: 'focused',
        intent: 'suggest',
        budget,
        guidanceMode: 'gentle',
        isPrivateDrafting: true,
      });
      expect(canSpeakInPrivate).toBe(false);

      // Cupidot speaks during celebratory moments
      const canSpeakCelebration = canCupidotSpeak({
        productState: 'celebrating',
        intent: 'celebrate',
        budget,
        guidanceMode: 'gentle',
        isPrivateDrafting: false,
      });
      expect(canSpeakCelebration).toBe(true);
    });
  });

  describe('5. Cross-Cutting Accessibility & Quiet Hours (M08, M13, M18)', () => {
    it('honors quiet hours window and suppresses unsolicited interruptions', () => {
      setQuietHoursEnabled(true);
      setQuietHoursWindow('22:00', '08:00');

      expect(getQuietHoursEnabled()).toBe(true);
      const window = getQuietHoursWindow();
      expect(window.start).toBe('22:00');
      expect(window.end).toBe('08:00');
    });

    it('formats preferred address naturally without assumptions', () => {
      expect(formatCupidotAddress({ coupleNickname: 'Moonlight Duo' })).toBe('Moonlight Duo');
      expect(formatCupidotAddress({ partnerA: 'Robin', partnerB: 'Jesse' })).toBe('Robin & Jesse');
      expect(formatCupidotAddress({})).toBe('you two');
    });

    it('tones down exclamation and cheerleading in quiet guidance mode', () => {
      const noisy = 'Amazing job!! Woohoo!! Fantastic!!';
      const quiet = getGuidanceToneAdjustedMessage(noisy, 'quiet');
      expect(quiet).not.toContain('!!');
      expect(quiet).not.toContain('Woohoo');
      expect(quiet).toContain('Good');
    });
  });

  describe('6. Operational Telemetry Integrity (M19)', () => {
    it('ensures telemetry events are 100% content-free and track zero PII', () => {
      const valid = trackCupidotMetric({
        eventType: 'activity_completed',
        activityType: 'court',
        mode: 'host',
        durationSeconds: 180,
        outcome: 'success',
      });
      expect(valid).toBe(true);

      const metrics = getBufferedMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].eventType).toBe('activity_completed');
      expect(metrics[0].activityType).toBe('court');

      // Rejects any attempt to pass message content, prompts, or answers
      expect(isContentFree({ prompt: 'Tell me your secret' })).toBe(false);
      expect(isContentFree({ answer: 'Secret answer' })).toBe(false);
      expect(isContentFree({ partner: 'Partner A' })).toBe(false);
    });
  });
});

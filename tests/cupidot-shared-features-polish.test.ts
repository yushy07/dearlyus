import { describe, it, expect, beforeEach } from 'vitest';
import {
  proposeMemorySeed,
  approveMemorySeed,
  declineMemorySeed,
  awardGrowthSparks,
  placeHomeDecor,
  REGISTERED_SPARK_EVENT_TYPES,
  HOME_COLLECTION_CATALOG,
} from '@/lib/cupidot-state';
import {
  getQuietHoursEnabled,
  setQuietHoursEnabled,
  getQuietHoursWindow,
  setQuietHoursWindow,
  isQuietHoursActive,
} from '@/lib/voice';
import {
  formatCupidotAddress,
  getGuidanceToneAdjustedMessage,
} from '@/lib/cupidot-behavior';
import {
  trackCupidotMetric,
  getBufferedMetrics,
  clearBufferedMetrics,
  isContentFree,
  setTelemetryOptedOut,
  isTelemetryOptedOut,
} from '@/lib/cupidot-metrics';
import { MemorySeed } from '@/types/cupidot';

// In-memory storage mock for node test runner
const memoryStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => memoryStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    memoryStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete memoryStorage[key];
  },
  clear: () => {
    Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
  },
  length: 0,
  key: () => null,
};
(globalThis as any).localStorage = mockLocalStorage;

describe('Workflow 3: Shared Features & Product Polish', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    clearBufferedMetrics();
    setTelemetryOptedOut(false);
  });

  describe('R03, M14, M15: Memory Seed Proposals, Invalidation & Lifecycle', () => {
    it('creates version 1 proposal with proposing partner approved', () => {
      const seed = proposeMemorySeed({
        title: 'Midnight Ramen Run',
        activityType: 'date_night',
        partnerAId: 'partner-ayush',
        partnerBId: 'partner-maya',
        caption: 'Best shoyu broth after stargazing',
      });

      expect(seed.version).toBe(1);
      expect(seed.status).toBe('proposed');
      expect(seed.approvedBy).toEqual(['partner-ayush']);
      expect(seed.approvedByPartnerA).toBe(true);
      expect(seed.approvedByPartnerB).toBe(false);
    });

    it('reaches mutually_approved only when both partners approve identical version', () => {
      const seed = proposeMemorySeed({
        title: 'Midnight Ramen Run',
        activityType: 'date_night',
        partnerAId: 'partner-ayush',
        partnerBId: 'partner-maya',
        caption: 'Best shoyu broth',
      });

      // Partner B approves unchanged
      const approved = approveMemorySeed(seed, 'partner-maya');
      expect(approved.status).toBe('mutually_approved');
      expect(approved.approvalStatus).toBe('both_approved');
      expect(approved.approvedBy).toContain('partner-ayush');
      expect(approved.approvedBy).toContain('partner-maya');
    });

    it('editing caption or mood increments version and invalidates prior approvals (R03)', () => {
      const seed = proposeMemorySeed({
        title: 'Midnight Ramen Run',
        activityType: 'date_night',
        partnerAId: 'partner-ayush',
        partnerBId: 'partner-maya',
        caption: 'Draft caption',
      });

      // Partner B edits caption on approval -> invalidates Partner A's initial consent
      const edited = approveMemorySeed(
        seed,
        'partner-maya',
        'Refined caption: delicious ramen together',
        'warm',
        true,
      );

      expect(edited.version).toBe(2);
      expect(edited.caption).toBe('Refined caption: delicious ramen together');
      expect(edited.chosenMood).toBe('warm');
      expect(edited.aiReuseConsent).toBe(true);
      expect(edited.approvedBy).toEqual(['partner-maya']);
      expect(edited.approvalStatus).toBe('approved_by_b');
      expect(edited.status).not.toBe('mutually_approved');

      // Partner A must explicitly approve version 2
      const mutual = approveMemorySeed(edited, 'partner-ayush');
      expect(mutual.version).toBe(2);
      expect(mutual.status).toBe('mutually_approved');
      expect(mutual.approvalStatus).toBe('both_approved');
      expect(mutual.approvedBy).toContain('partner-ayush');
      expect(mutual.approvedBy).toContain('partner-maya');
    });

    it('decline marks seed as declined and preserves nothing (R03, M15)', () => {
      const seed = proposeMemorySeed({
        title: 'Secret Walk',
        activityType: 'walk',
        partnerAId: 'partner-ayush',
        partnerBId: 'partner-maya',
      });

      const declined = declineMemorySeed(seed);
      expect(declined.status).toBe('declined');
      expect(declined.approvalStatus).toBe('declined');
      expect(declined.declinedAt).toBeDefined();
    });
  });

  describe('M03, M04: Sparks & Chapter Decor Placement', () => {
    it('only awards growth sparks for registered event types (M03)', () => {
      expect(REGISTERED_SPARK_EVENT_TYPES).toContain('keepsake_saved');
      expect(REGISTERED_SPARK_EVENT_TYPES).toContain('ritual_completed');
      expect(REGISTERED_SPARK_EVENT_TYPES).toContain('shared_activity_completed');

      const validAward = awardGrowthSparks(10, 'keepsake_saved', 'seed-1');
      expect(validAward.awarded).toBe(true);
      expect(validAward.sparksAwarded).toBe(15);

      // Unknown/unregistered event string is rejected
      const invalidAward = awardGrowthSparks(10, 'fake_local_click_event', 'fake-1');
      expect(invalidAward.awarded).toBe(false);
      expect(invalidAward.sparksAwarded).toBe(0);
    });

    it('decor placement rejects items unlocked in future chapters (M04)', () => {
      const currentChapter = 1;
      const ch1Item = HOME_COLLECTION_CATALOG.find((i) => i.unlockedAtChapter === 1)!;
      const ch2Item = HOME_COLLECTION_CATALOG.find((i) => i.unlockedAtChapter === 2)!;

      const placedCh1 = placeHomeDecor([], ch1Item.id, currentChapter);
      expect(placedCh1).toContain(ch1Item.id);

      const placedCh2 = placeHomeDecor([], ch2Item.id, currentChapter);
      expect(placedCh2).not.toContain(ch2Item.id);
    });
  });

  describe('R07, M08, M16: Ritual Scheduling & Quiet Hours Autonomy', () => {
    it('supports quiet hours window retrieval and checking', () => {
      setQuietHoursEnabled(true);
      setQuietHoursWindow('22:00', '08:00');
      const window = getQuietHoursWindow();
      expect(window.start).toBe('22:00');
      expect(window.end).toBe('08:00');
      expect(getQuietHoursEnabled()).toBe(true);
    });

    it('returns false for quiet hours when disabled', () => {
      setQuietHoursEnabled(false);
      expect(isQuietHoursActive()).toBe(false);
    });
  });

  describe('M18: Natural Address & Tone Fallbacks', () => {
    it('formats preferred address naturally without robotic formalisms', () => {
      expect(formatCupidotAddress({ coupleNickname: 'The Stargazers' })).toBe('The Stargazers');
      expect(formatCupidotAddress({ partnerA: 'Ayush', partnerB: 'Maya' })).toBe('Ayush & Maya');
      expect(formatCupidotAddress({})).toBe('you two');
    });

    it('softens tone for quiet guidance mode (M18)', () => {
      const excited = 'Amazing job!! Woohoo, you did it!!';
      const quiet = getGuidanceToneAdjustedMessage(excited, 'quiet');
      expect(quiet).not.toContain('!!');
      expect(quiet).not.toContain('Woohoo');
      expect(quiet).toContain('Good');
    });
  });

  describe('M19: Content-Free Operational Telemetry', () => {
    it('strictly accepts content-free operational outcomes', () => {
      const tracked = trackCupidotMetric({
        eventType: 'activity_completed',
        activityType: 'quiz',
        mode: 'quick_spark',
        durationSeconds: 120,
        outcome: 'success',
      });
      expect(tracked).toBe(true);

      const metrics = getBufferedMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].eventType).toBe('activity_completed');
      expect(metrics[0].activityType).toBe('quiz');
      expect(metrics[0].timestamp).toBeGreaterThan(0);
    });

    it('rejects metrics containing content, text, prompts, or personal identifiers', () => {
      expect(isContentFree({ text: 'Hello partner' })).toBe(false);
      expect(isContentFree({ prompt: 'Tell me your dream vacation' })).toBe(false);
      expect(isContentFree({ answer: 'Paris in the spring' })).toBe(false);
      expect(isContentFree({ email: 'partner@example.com' })).toBe(false);
      expect(isContentFree({ partner: 'Partner A downgraded' })).toBe(false);

      const rejected = trackCupidotMetric({
        eventType: 'keepsake_proposed',
        // @ts-expect-error test illegal payload
        prompt: 'Should be rejected',
      });
      expect(rejected).toBe(false);
      expect(getBufferedMetrics().length).toBe(0);
    });

    it('respects telemetry opt-out', () => {
      setTelemetryOptedOut(true);
      expect(isTelemetryOptedOut()).toBe(true);

      const tracked = trackCupidotMetric({
        eventType: 'activity_started',
        activityType: 'cards',
      });
      expect(tracked).toBe(false);
      expect(getBufferedMetrics().length).toBe(0);
    });
  });
});

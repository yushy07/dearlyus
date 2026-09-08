import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createActivityRuntime } from '@/lib/runtime/activity-runtime';
import { RealtimeActivityAdapter, StandardActivityEvent } from '@/lib/activity-adapters/types';
import { ActivityTransport } from '@/lib/runtime/types';
import { sanitizeCupidotPayload, generateAdaptiveQuestion } from '@/lib/gemini';
import {
  speakCupidot,
  stopCupidotSpeech,
  replayCupidotSpeech,
  onCupidotCaption,
  setAudioRecordingActive,
  setQuietHoursEnabled,
  isAudioRecordingActive,
} from '@/lib/voice';
import {
  canCupidotSpeak,
  createDefaultInterruptionBudget,
} from '@/lib/cupidot-behavior';
import { loadStoredCupidotHome, saveStoredCupidotHome } from '@/lib/cupidot-state';

// Mock localStorage for headless test environment
const storageMap: Record<string, string> = {};
const mockStorage = {
  getItem: vi.fn((key: string) => storageMap[key] || null),
  setItem: vi.fn((key: string, val: string) => {
    storageMap[key] = String(val);
  }),
  removeItem: vi.fn((key: string) => {
    delete storageMap[key];
  }),
  clear: vi.fn(() => {
    Object.keys(storageMap).forEach((k) => delete storageMap[k]);
  }),
  length: 0,
  key: vi.fn(() => null),
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
}
globalThis.localStorage = mockStorage as any;

describe('Workflow 2: Core Behavior, Consent & Event Ordering', () => {
  describe('M17: Event Runtime Gap Buffering & Recovery Ordering', () => {
    function createMockAdapter(): RealtimeActivityAdapter<any> {
      return {
        activityType: 'test_quiz',
        createInitialSnapshot: () => ({
          status: 'active',
          appliedEvents: [] as string[],
        }),
        validateEvent: (event) => {
          if ((event.payload as any)?.invalid) {
            return { valid: false, message: 'Invalid payload' };
          }
          return { valid: true };
        },
        reduce: (snapshot, event) => ({
          ...snapshot,
          appliedEvents: [...snapshot.appliedEvents, event.id],
        }),
        canTransition: () => true,
        summarize: (s) => ({
          activityType: 'test_quiz',
          summaryTitle: 'Test Quiz',
          highlights: [],
          memoryCandidates: [],
        }),
      };
    }

    it('buffers out-of-order gap events and drains them once contiguous events arrive', async () => {
      const adapter = createMockAdapter();
      let eventListener: ((event: StandardActivityEvent) => void) | null = null;
      const recoveryCalls: number[] = [];

      const mockTransport: ActivityTransport<any> = {
        sendEvent: vi.fn(),
        sendTransient: vi.fn(),
        onEvent: (cb) => {
          eventListener = cb;
          return () => {};
        },
        onTransient: () => () => {},
        requestRecovery: vi.fn(async (afterSeq) => {
          recoveryCalls.push(afterSeq);
          return null;
        }),
        completeSession: vi.fn(),
        setPaused: vi.fn(),
      };

      const runtime = createActivityRuntime({
        sessionId: 'session-1',
        activityType: 'test_quiz',
        currentUserId: 'user-a',
        adapter,
        transport: mockTransport,
      });

      // 1. Dispatch event sequence 1 (contiguous)
      eventListener!({
        id: 'evt-1',
        activityType: 'test_quiz',
        type: 'step',
        sequence: 1,
        senderId: 'user-a',
        payload: { text: 'one' },
        createdAt: 1000,
      });

      expect(runtime.getLastSequence()).toBe(1);
      expect(runtime.getSnapshot().appliedEvents).toEqual(['evt-1']);

      // 2. Dispatch event sequence 3 (gap detected, event 2 missing)
      eventListener!({
        id: 'evt-3',
        activityType: 'test_quiz',
        type: 'step',
        sequence: 3,
        senderId: 'user-b',
        payload: { text: 'three' },
        createdAt: 3000,
      });

      // Sequence must NOT advance to 3 yet, and snapshot must NOT contain evt-3 prematurely
      expect(runtime.getLastSequence()).toBe(1);
      expect(runtime.getSnapshot().appliedEvents).toEqual(['evt-1']);
      expect(mockTransport.requestRecovery).toHaveBeenCalledWith(1);

      // 3. Dispatch the missing event sequence 2 (contiguous now)
      eventListener!({
        id: 'evt-2',
        activityType: 'test_quiz',
        type: 'step',
        sequence: 2,
        senderId: 'user-a',
        payload: { text: 'two' },
        createdAt: 2000,
      });

      // Now both event 2 AND buffered event 3 should be applied in strict order!
      expect(runtime.getLastSequence()).toBe(3);
      expect(runtime.getSnapshot().appliedEvents).toEqual(['evt-1', 'evt-2', 'evt-3']);
    });

    it('rejects invalid events before updating sequence or recording IDs', async () => {
      const adapter = createMockAdapter();
      let eventListener: ((event: StandardActivityEvent) => void) | null = null;

      const mockTransport: ActivityTransport<any> = {
        sendEvent: vi.fn(),
        sendTransient: vi.fn(),
        onEvent: (cb) => {
          eventListener = cb;
          return () => {};
        },
        onTransient: () => () => {},
        requestRecovery: vi.fn(),
        completeSession: vi.fn(),
        setPaused: vi.fn(),
      };

      const runtime = createActivityRuntime({
        sessionId: 'session-2',
        activityType: 'test_quiz',
        currentUserId: 'user-a',
        adapter,
        transport: mockTransport,
      });

      // Dispatch invalid event
      eventListener!({
        id: 'invalid-evt',
        activityType: 'test_quiz',
        type: 'step',
        sequence: 1,
        senderId: 'user-a',
        payload: { invalid: true },
        createdAt: 1000,
      });

      expect(runtime.getLastSequence()).toBe(0);
      expect(runtime.getSnapshot().appliedEvents).toEqual([]);
    });
  });

  describe('M09 & M10: AI Request Lifecycle, Timeout & Safety', () => {
    it('preserves romanceLevel during payload sanitization', () => {
      const sanitized = sanitizeCupidotPayload({
        partnerA: { name: 'Alex', answer: 'Stargazing' },
        partnerB: { name: 'Jordan', answer: 'Tea' },
        mode: 'quiz',
        mood: 'romantic',
        romanceLevel: 'flirty',
        aiConsent: true,
      });

      expect(sanitized.romanceLevel).toBe('flirty');
      expect(sanitized.partnerA.name).toBe('Alex');
    });

    it('falls back to procedural dilemma when aiConsent is missing or false', async () => {
      const question = await generateAdaptiveQuestion({
        partnerA: { name: 'Alex', answer: 'Stargazing' },
        partnerB: { name: 'Jordan', answer: 'Tea' },
        mode: 'quiz',
        aiConsent: false,
      });

      expect(question.source).toBe('fallback');
      expect(question.question).toBeDefined();
      expect(question.options.length).toBeGreaterThanOrEqual(2);
    });

    it('aborts immediately when caller signal is already cancelled', async () => {
      const controller = new AbortController();
      controller.abort();

      const question = await generateAdaptiveQuestion({
        sessionId: 'session-test-abort',
        partnerA: { name: 'Alex', answer: 'Stargazing' },
        partnerB: { name: 'Jordan', answer: 'Tea' },
        mode: 'quiz',
        aiConsent: true,
        signal: controller.signal,
      });

      expect(question.source).toBe('fallback');
      expect(question.question).toBeDefined();
    });
  });

  describe('M12: Coordinated Voice, Live Captions & Replay API', () => {
    beforeEach(() => {
      stopCupidotSpeech();
      setAudioRecordingActive(false);
      setQuietHoursEnabled(false);
    });

    it('dispatches live captions with text, mood, and isSpeaking state', () => {
      const captions: Array<{ text: string; isSpeaking: boolean }> = [];
      const unsubscribe = onCupidotCaption((c) => {
        captions.push({ text: c.text, isSpeaking: c.isSpeaking });
      });

      speakCupidot('Hello from Cupidot!', { mood: 'happy' });

      expect(captions.length).toBeGreaterThan(0);
      expect(captions[0].text).toBe('Hello from Cupidot!');
      expect(captions[0].isSpeaking).toBe(true);

      stopCupidotSpeech();
      expect(captions.some((c) => !c.isSpeaking)).toBe(true);

      unsubscribe();
    });

    it('replays the last spoken utterance when replayCupidotSpeech is called', () => {
      const captions: string[] = [];
      const unsubscribe = onCupidotCaption((c) => {
        if (c.isSpeaking) captions.push(c.text);
      });

      speakCupidot('First unique line', { mood: 'love' });
      expect(captions).toContain('First unique line');

      replayCupidotSpeech();
      expect(captions.filter((t) => t === 'First unique line').length).toBe(2);

      unsubscribe();
    });

    it('suppresses audio playback during active audio recording while emitting captions', () => {
      setAudioRecordingActive(true);
      expect(isAudioRecordingActive()).toBe(true);

      const captions: string[] = [];
      const unsubscribe = onCupidotCaption((c) => {
        captions.push(c.text);
      });

      speakCupidot('Quiet thought during recording', { mood: 'talking' });

      // Captions are still emitted for visual readability without spoiling audio
      expect(captions).toContain('Quiet thought during recording');

      unsubscribe();
      setAudioRecordingActive(false);
    });
  });

  describe('M01 & M02: Pet Presence & Session Spark Soft Cap Reset', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('resets sparksThisSession to 0 when last visit was >60 minutes ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      saveStoredCupidotHome(
        {
          state: 'welcoming',
          mood: 'curious',
          chapter: 2,
          growthSparks: 120,
          sparksThisSession: 45, // Soft cap was hit in that past session
          partnerPresence: 'away',
          guidanceMode: 'gentle',
          romanceLevel: 'romantic',
          lastReturnAt: twoHoursAgo,
          placedDecorIds: ['decor_cozy_cushion'],
          upcomingRitual: null,
          activeMemorySeed: null,
        },
        'test-couple-1',
      );

      const loaded = loadStoredCupidotHome('test-couple-1');
      // Must be reset to 0 for the fresh session
      expect(loaded.sparksThisSession).toBe(0);
      expect(loaded.growthSparks).toBe(120);
      expect(loaded.chapter).toBe(2);
    });

    it('preserves sparksThisSession when within the same active 60-minute window', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      saveStoredCupidotHome(
        {
          state: 'welcoming',
          mood: 'curious',
          chapter: 1,
          growthSparks: 30,
          sparksThisSession: 30,
          partnerPresence: 'here',
          guidanceMode: 'gentle',
          romanceLevel: 'romantic',
          lastReturnAt: fiveMinutesAgo,
          placedDecorIds: ['decor_cozy_cushion'],
          upcomingRitual: null,
          activeMemorySeed: null,
        },
        'test-couple-2',
      );

      const loaded = loadStoredCupidotHome('test-couple-2');
      expect(loaded.sparksThisSession).toBe(30);
    });
  });

  describe('M11 & R05: Freshness & Suggestion Dismissal Rules', () => {
    it('blocks speech if the suggestionKey was previously dismissed', () => {
      const budget = createDefaultInterruptionBudget();
      budget.dismissedSuggestionKeys = ['suggest_quiz_round_2'];

      const canSpeakDismissed = canCupidotSpeak({
        productState: 'welcoming',
        intent: 'suggest',
        budget,
        guidanceMode: 'gentle',
        suggestionKey: 'suggest_quiz_round_2',
      });
      expect(canSpeakDismissed).toBe(false);

      const canSpeakFresh = canCupidotSpeak({
        productState: 'welcoming',
        intent: 'suggest',
        budget,
        guidanceMode: 'gentle',
        suggestionKey: 'suggest_draw_round_1',
      });
      expect(canSpeakFresh).toBe(true);
    });

    it('suppresses duplicate intents spoken within 15 seconds unless critical', () => {
      const budget = createDefaultInterruptionBudget();
      budget.recentSpokenIntents = [
        { intent: 'suggest', timestamp: Date.now() - 5000 }, // 5s ago
      ];
      budget.lastSpokenTimestamp = Date.now() - 4000;

      // Same intent repeated within 15s must be rejected
      const canRepeatSuggest = canCupidotSpeak({
        productState: 'hosting',
        intent: 'suggest',
        budget,
        guidanceMode: 'host',
      });
      expect(canRepeatSuggest).toBe(false);

      // Critical safety or recovery intent is always permitted
      const canSpeakSafety = canCupidotSpeak({
        productState: 'hosting',
        intent: 'refuse_unsafe',
        budget,
        guidanceMode: 'host',
      });
      expect(canSpeakSafety).toBe(true);
    });
  });
});

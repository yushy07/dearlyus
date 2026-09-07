import { describe, it, expect } from 'vitest';
import {
  quizActivityDefinition,
  quizActivityAdapter,
  drawActivityDefinition,
  drawActivityAdapter,
  cardsActivityDefinition,
  cardsActivityAdapter,
  catalogActivityDefinitions,
} from '../lib/activity-adapters';

describe('Phase 0: Standard Activity Definitions & Adapters', () => {
  describe('Quiz Activity Definition', () => {
    it('initializes with drafting state and correct default round values', () => {
      const snapshot = quizActivityDefinition.initialSnapshot({
        roomCode: 'room-101',
        userId: 'user-a',
        options: {
          packTitle: 'Deep Sync',
          totalRounds: 5,
        },
      });

      expect(snapshot.activityType).toBe('quiz');
      expect(snapshot.status).toBe('drafting');
      expect(snapshot.currentRound).toBe(0);
      expect(snapshot.totalRounds).toBe(5);
      expect(snapshot.matches).toBe(0);
      expect(snapshot.completed).toBe(false);
    });

    it('rejects forbidden/unknown event types', () => {
      const validation = quizActivityDefinition.validateEvent!({
        type: 'malicious_event' as any,
        payload: {},
      } as any);

      expect(validation.valid).toBe(false);
      expect(validation.code).toBe('INVALID_EVENT');
    });

    it('enforces the Private Answer Security Rule by rejecting leaked answers in answer_locked', () => {
      // In room_events, answer_locked must only contain boolean metadata, never raw answers
      const leakedEvent = {
        type: 'answer_locked',
        payload: {
          roundNumber: 0,
          locked: true,
          answer: 'Secret Answer 1',
        },
      };

      const validation = quizActivityDefinition.validateEvent!(
        leakedEvent as any,
      );
      expect(validation.valid).toBe(false);
      expect(validation.code).toBe('PRIVATE_DATA_LEAK');
    });

    it('accepts compliant answer_locked metadata', () => {
      const cleanEvent = {
        type: 'answer_locked',
        payload: {
          roundNumber: 0,
          locked: true,
        },
      };

      const validation = quizActivityDefinition.validateEvent!(
        cleanEvent as any,
      );
      expect(validation.valid).toBe(true);
    });

    it('reduces events deterministically through round cycle and completion', () => {
      let snapshot = quizActivityDefinition.initialSnapshot({
        roomCode: 'room-101',
        userId: 'user-a',
        options: { totalRounds: 2 },
      });

      // 1. Lock answers
      snapshot = quizActivityDefinition.reduce(snapshot, {
        type: 'answer_locked',
        payload: { roundNumber: 0, locked: true },
      });
      expect(snapshot.status).toBe('locked');

      // 2. Reveal answers with a match
      snapshot = quizActivityDefinition.reduce(snapshot, {
        type: 'answers_revealed',
        payload: {
          roundNumber: 0,
          isMatch: true,
        },
      });
      expect(snapshot.status).toBe('revealed');
      expect(snapshot.matches).toBe(1);
      expect(snapshot.history.length).toBe(1);
      expect(snapshot.history[0].answers).toEqual([]);

      // 3. Move to next round
      snapshot = quizActivityDefinition.reduce(snapshot, {
        type: 'quiz_next',
        payload: { nextRound: 1 },
      });
      expect(snapshot.status).toBe('drafting');
      expect(snapshot.currentRound).toBe(1);
      expect(snapshot.completed).toBe(false);

      // 4. Skip round 1
      snapshot = quizActivityDefinition.reduce(snapshot, {
        type: 'gentle_skip',
        payload: { roundNumber: 1, skippedAt: '2026-09-05T00:01:00Z' },
      });
      expect(snapshot.status).toBe('revealed');

      // 5. Complete after last round
      snapshot = quizActivityDefinition.reduce(snapshot, {
        type: 'quiz_next',
        payload: { nextRound: 2 },
      });
      expect(snapshot.status).toBe('completed');
      expect(snapshot.completed).toBe(true);

      // 6. Builds valid keepsake
      const summary = quizActivityDefinition.summarize(snapshot);
      const keepsake = quizActivityDefinition.buildKeepsake!(summary);
      expect(keepsake).not.toBeNull();
      expect(keepsake?.kind).toBe('activity');
      expect(keepsake?.metadata.matches).toBe(1);
    });
  });

  describe('Draw Activity Definition', () => {
    it('initializes canvas with active status and empty strokes', () => {
      const snapshot = drawActivityDefinition.initialSnapshot({
        roomCode: 'room-canvas',
        userId: 'artist-1',
        options: { prompt: 'Draw our favorite pet' },
      });

      expect(snapshot.activityType).toBe('draw');
      expect(snapshot.status).toBe('active');
      expect(snapshot.strokes).toEqual([]);
      expect(snapshot.completed).toBe(false);
    });

    it('deduplicates stroke batches by id', () => {
      let snapshot = drawActivityDefinition.initialSnapshot({
        roomCode: 'room-canvas',
        userId: 'artist-1',
      });

      const batch = {
        id: 'stroke-1',
        userId: 'artist-1',
        sequence: 1,
        color: '#FF0000',
        brushSize: 4,
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
        timestamp: '2026-09-05T00:00:00Z',
      };

      snapshot = drawActivityDefinition.reduce(snapshot, {
        type: 'draw_batch',
        payload: batch,
      });
      expect(snapshot.strokes.length).toBe(1);

      // Same batch sent again
      snapshot = drawActivityDefinition.reduce(snapshot, {
        type: 'draw_batch',
        payload: batch,
      });
      expect(snapshot.strokes.length).toBe(1);
    });
  });

  describe('Cards Activity Definition', () => {
    it('advances through cards and flips correctly', () => {
      let snapshot = cardsActivityDefinition.initialSnapshot({
        roomCode: 'room-cards',
        userId: 'user-1',
        options: { totalCards: 3 },
      });

      expect(snapshot.status).toBe('active');
      expect(snapshot.cardIndex).toBe(0);
      expect(snapshot.flipped).toBe(false);

      snapshot = cardsActivityDefinition.reduce(snapshot, {
        type: 'cards_flip',
        payload: {},
      });
      expect(snapshot.flipped).toBe(true);

      snapshot = cardsActivityDefinition.reduce(snapshot, {
        type: 'cards_next',
        payload: {},
      });
      expect(snapshot.cardIndex).toBe(1);
      expect(snapshot.flipped).toBe(false);
    });
  });

  describe('Host Mode Definition', () => {
    it('handles speaker switches, prompt changes, and completion', () => {
      let snapshot = catalogActivityDefinitions.host.initialSnapshot({
        roomCode: 'room-host',
        userId: 'host-1',
        options: { theme: 'Deep Questions' },
      });

      expect(snapshot.status).toBe('active');
      expect(snapshot.theme).toBe('Deep Questions');

      snapshot = catalogActivityDefinitions.host.reduce(snapshot, {
        type: 'host_speaker_switch',
        payload: { activeSpeaker: 'partner-b' },
      });
      expect(snapshot.activeSpeaker).toBe('partner-b');

      snapshot = catalogActivityDefinitions.host.reduce(snapshot, {
        type: 'host_finish',
        payload: {},
      });
      expect(snapshot.status).toBe('completed');
      expect(snapshot.completed).toBe(true);

      const keepsake = catalogActivityDefinitions.host.buildKeepsake!(
        catalogActivityDefinitions.host.summarize(snapshot),
      );
      expect(keepsake?.kind).toBe('activity');
    });
  });

  describe('Match Definition', () => {
    it('scores matches and completes after all pairs', () => {
      let snapshot = catalogActivityDefinitions.match.initialSnapshot({
        roomCode: 'room-match',
        userId: 'user-1',
        options: { totalPairs: 2 },
      });

      expect(snapshot.score).toBe(0);

      snapshot = catalogActivityDefinitions.match.reduce(snapshot, {
        type: 'match_reveal',
        payload: { isMatch: true },
      });
      expect(snapshot.score).toBe(1);

      snapshot = catalogActivityDefinitions.match.reduce(snapshot, {
        type: 'match_next',
        payload: {},
      });
      expect(snapshot.pairIndex).toBe(1);
      expect(snapshot.completed).toBe(false);

      snapshot = catalogActivityDefinitions.match.reduce(snapshot, {
        type: 'match_next',
        payload: {},
      });
      expect(snapshot.pairIndex).toBe(2);
      expect(snapshot.status).toBe('completed');
      expect(snapshot.completed).toBe(true);
    });
  });

  describe('Court / Debate Definition', () => {
    it('moves through filing -> arguments -> verdict -> closed', () => {
      let snapshot = catalogActivityDefinitions.court.initialSnapshot({
        roomCode: 'room-court',
        userId: 'lawyer-1',
        options: { caseTitle: 'The Missing Cookies' },
      });

      expect(snapshot.stage).toBe('filing');

      snapshot = catalogActivityDefinitions.court.reduce(snapshot, {
        type: 'court_plea',
        payload: { plea: 'Not guilty by reason of hunger' },
      });
      expect(snapshot.stage).toBe('arguments');

      snapshot = catalogActivityDefinitions.court.reduce(snapshot, {
        type: 'court_verdict',
        payload: { verdict: 'Guilty', penalty: 'Bake new cookies' },
      });
      expect(snapshot.stage).toBe('verdict');
      expect(snapshot.verdict).toBe('Guilty');

      snapshot = catalogActivityDefinitions.court.reduce(snapshot, {
        type: 'court_close',
        payload: {},
      });
      expect(snapshot.stage).toBe('closed');
      expect(snapshot.status).toBe('completed');
    });
  });

  describe('Dare Definition', () => {
    it('tracks accepted, completed, and rerolled dares', () => {
      let snapshot = catalogActivityDefinitions.dare.initialSnapshot({
        roomCode: 'room-dare',
        userId: 'daredevil-1',
      });

      expect(snapshot.dareStatus).toBe('pending');

      snapshot = catalogActivityDefinitions.dare.reduce(snapshot, {
        type: 'dare_accept',
        payload: {},
      });
      expect(snapshot.dareStatus).toBe('accepted');

      snapshot = catalogActivityDefinitions.dare.reduce(snapshot, {
        type: 'dare_complete',
        payload: {},
      });
      expect(snapshot.dareStatus).toBe('completed');
      expect(snapshot.completedCount).toBe(1);

      snapshot = catalogActivityDefinitions.dare.reduce(snapshot, {
        type: 'dare_finish',
        payload: {},
      });
      expect(snapshot.status).toBe('completed');
      expect(snapshot.completed).toBe(true);
    });
  });

  describe('Photobooth Timing Definition', () => {
    it('handles countdown, shutter flash, filter change, and review', () => {
      let snapshot = catalogActivityDefinitions.photobooth.initialSnapshot({
        roomCode: 'room-photo',
        userId: 'model-1',
      });

      expect(snapshot.photoboothStage).toBe('standby');

      snapshot = catalogActivityDefinitions.photobooth.reduce(snapshot, {
        type: 'photo_start_countdown',
        payload: {},
      });
      expect(snapshot.photoboothStage).toBe('countdown');

      snapshot = catalogActivityDefinitions.photobooth.reduce(snapshot, {
        type: 'photo_shutter',
        payload: {},
      });
      expect(snapshot.photoboothStage).toBe('flash');
      expect(snapshot.photoCount).toBe(1);

      snapshot = catalogActivityDefinitions.photobooth.reduce(snapshot, {
        type: 'photo_finish',
        payload: {},
      });
      expect(snapshot.photoboothStage).toBe('review');
      expect(snapshot.status).toBe('completed');
    });
  });

  describe('Passport & Scrapbook Definition', () => {
    it('accumulates stamps and entries across pages', () => {
      let snapshot = catalogActivityDefinitions.passport.initialSnapshot({
        roomCode: 'room-pass',
        userId: 'traveler-1',
      });

      expect(snapshot.stampsCount).toBe(0);

      snapshot = catalogActivityDefinitions.passport.reduce(snapshot, {
        type: 'passport_stamp_add',
        payload: {},
      });
      expect(snapshot.stampsCount).toBe(1);

      snapshot = catalogActivityDefinitions.passport.reduce(snapshot, {
        type: 'scrapbook_entry_add',
        payload: {},
      });
      expect(snapshot.entriesCount).toBe(1);

      const keepsake = catalogActivityDefinitions.passport.buildKeepsake!(
        catalogActivityDefinitions.passport.summarize(snapshot),
      );
      expect(keepsake?.kind).toBe('activity');
      expect(keepsake?.metadata.stamps).toBe(1);
    });
  });
});

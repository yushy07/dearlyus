import { describe, it, expect } from 'vitest';
import { allActivityAdapters } from '../lib/activity-adapters';

describe('Activities Revamp: All 24 Adapters Verification', () => {
  const all24Keys = [
    'quiz',
    'draw',
    'cards',
    'host',
    'match',
    'court',
    'debate',
    'dare',
    'photobooth',
    'passport',
    'scrapbook',
    'letter',
    'arcade',
    'iq',
    'riddle',
    'lab',
    'hunt',
    'future',
    'birthday',
    'fashion',
    'shirts',
    'forecast',
    'timezone',
    'bucket',
    'date',
  ];

  it('contains all 24 required activities in the adapter registry', () => {
    for (const key of all24Keys) {
      expect(allActivityAdapters[key], `Missing adapter for ${key}`).toBeDefined();
    }
  });

  describe.each(all24Keys)('Adapter [%s]', (key) => {
    const adapter = allActivityAdapters[key];

    it('creates a valid initial snapshot', () => {
      const snapshot = adapter.createInitialSnapshot({
        roomCode: 'room-test-101',
        userId: 'user-test-a',
      });
      expect(snapshot).toBeDefined();
      expect(typeof snapshot).toBe('object');
      expect(snapshot.activityType).toBeDefined();
    });

    it('rejects completely invalid / malformed events', () => {
      const invalidEvent = {
        id: 'evt-1',
        sequence: 1,
        schemaVersion: 1,
        senderId: 'user-test-a',
        createdAt: new Date().toISOString(),
        activityType: key,
        type: 'non_existent_malicious_event',
        payload: {},
      };
      const validation = adapter.validateEvent(invalidEvent as any);
      expect(validation.valid).toBe(false);
    });

    it('generates a valid keepsake summary', () => {
      const snapshot = adapter.createInitialSnapshot({
        roomCode: 'room-test-101',
        userId: 'user-test-a',
      });
      const summary = adapter.summarize(snapshot);
      expect(summary).toBeDefined();
      expect(summary.activityType).toBeDefined();
    });
  });
});

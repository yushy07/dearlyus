import { describe, it, expect, beforeEach } from 'vitest';
import {
  createActivityRuntime,
  MockActivityTransport,
  clearMockBuses,
} from '../lib/runtime';
import { quizActivityAdapter, drawActivityAdapter } from '../lib/activity-adapters';

describe('Phase 1: Activity Runtime & Deterministic Mock Transport', () => {
  beforeEach(() => {
    clearMockBuses();
  });

  it('coordinates deterministic event synchronization between two partners', async () => {
    const sessionId = 'test-session-multi';
    const transportA = new MockActivityTransport();
    const transportB = new MockActivityTransport();

    await transportA.connect(sessionId, 'user-a');
    await transportB.connect(sessionId, 'user-b');

    const runtimeA = createActivityRuntime({
      sessionId,
      activityType: 'quiz',
      currentUserId: 'user-a',
      adapter: quizActivityAdapter,
      transport: transportA,
    });

    const runtimeB = createActivityRuntime({
      sessionId,
      activityType: 'quiz',
      currentUserId: 'user-b',
      adapter: quizActivityAdapter,
      transport: transportB,
    });

    expect(runtimeA.getSessionState()).toBe('drafting');
    expect(runtimeB.getSessionState()).toBe('drafting');

    // Partner A locks answer
    await runtimeA.sendEvent('answer_locked', { roundNumber: 0, locked: true });

    // Both runtimes transition to 'locked' deterministically
    expect(runtimeA.getSessionState()).toBe('locked');
    expect(runtimeB.getSessionState()).toBe('locked');
    expect(runtimeA.getLastSequence()).toBe(1);
    expect(runtimeB.getLastSequence()).toBe(1);

    // Partner B reveals answers
    await runtimeB.sendEvent('answers_revealed', {
      roundNumber: 0,
      isMatch: true,
    });

    expect(runtimeA.getSessionState()).toBe('revealed');
    expect(runtimeB.getSessionState()).toBe('revealed');
    expect(runtimeA.getSnapshot().matches).toBe(1);
    expect(runtimeB.getSnapshot().matches).toBe(1);

    runtimeA.destroy();
    runtimeB.destroy();
  });

  it('seals private answers in PrivateVault until both partners lock', async () => {
    const sessionId = 'test-session-vault';
    const transportA = new MockActivityTransport();
    const transportB = new MockActivityTransport();

    await transportA.connect(sessionId, 'user-a');
    await transportB.connect(sessionId, 'user-b');

    // Partner A locks answer
    const lockResultA = await transportA.privateVault.lockAnswer(0, { choiceIndex: 2 });
    expect(lockResultA.locked).toBe(true);
    expect(lockResultA.bothLocked).toBe(false);
    expect(transportA.privateVault.isLocked(0, 'user-a')).toBe(true);
    expect(transportA.privateVault.isLocked(0, 'user-b')).toBe(false);
    expect(transportA.privateVault.areBothLocked(0)).toBe(false);
    await expect(transportA.privateVault.revealAnswers(0)).rejects.toThrow('NOT_READY');

    // Partner B locks answer
    const lockResultB = await transportB.privateVault.lockAnswer(0, { choiceIndex: 2 });
    expect(lockResultB.locked).toBe(true);
    expect(lockResultB.bothLocked).toBe(true);
    expect(transportA.privateVault.areBothLocked(0)).toBe(true);

    // Reveal unseals both answers with metadata
    const revealResult = await transportA.privateVault.revealAnswers(0);
    expect(revealResult.answers.length).toBe(2);
    expect(revealResult.answers.find((a) => a.userId === 'user-a')?.answer).toEqual({ choiceIndex: 2 });
    expect(revealResult.answers.find((a) => a.userId === 'user-b')?.answer).toEqual({ choiceIndex: 2 });
  });

  it('silently ignores duplicate incoming events', async () => {
    const sessionId = 'test-session-dedupe';
    const transport = new MockActivityTransport({ duplicateNextEvent: true });
    await transport.connect(sessionId, 'user-a');

    const runtime = createActivityRuntime({
      sessionId,
      activityType: 'quiz',
      currentUserId: 'user-a',
      adapter: quizActivityAdapter,
      transport,
    });

    let updateCount = 0;
    runtime.subscribe(() => {
      updateCount += 1;
    });

    await runtime.sendEvent('answer_locked', { roundNumber: 0, locked: true });

    // Even though duplicateNextEvent was true and dispatched twice, runtime filtered it
    expect(updateCount).toBe(1);
    expect(runtime.getLastSequence()).toBe(1);

    runtime.destroy();
  });

  it('restores the latest reduced snapshot without replaying it twice', async () => {
    const sessionId = 'test-session-recovery';
    const writer = new MockActivityTransport();
    await writer.connect(sessionId, 'user-a');
    const writerRuntime = createActivityRuntime({
      sessionId,
      activityType: 'quiz',
      currentUserId: 'user-a',
      adapter: quizActivityAdapter,
      transport: writer,
    });
    await writerRuntime.sendEvent('answer_locked', { roundNumber: 0, locked: true });

    const reader = new MockActivityTransport();
    await reader.connect(sessionId, 'user-b');
    const readerRuntime = createActivityRuntime({
      sessionId,
      activityType: 'quiz',
      currentUserId: 'user-b',
      adapter: quizActivityAdapter,
      transport: reader,
    });
    await readerRuntime.requestRecovery();

    expect(readerRuntime.getSessionState()).toBe('locked');
    expect(readerRuntime.getLastSequence()).toBe(1);
    writerRuntime.destroy();
    readerRuntime.destroy();
  });

  it('broadcasts transient presence events without polluting durable sequence', async () => {
    const sessionId = 'test-session-transient';
    const transportA = new MockActivityTransport();
    const transportB = new MockActivityTransport();

    await transportA.connect(sessionId, 'user-a');
    await transportB.connect(sessionId, 'user-b');

    let partnerBReceived: any = null;
    transportB.onTransient('typing_presence', (payload) => {
      partnerBReceived = payload;
    });

    transportA.sendTransient('typing_presence', { isTyping: true, userId: 'user-a' });

    expect(partnerBReceived).toEqual({ isTyping: true, userId: 'user-a' });
    expect(transportA.privateVault.isLocked(0)).toBe(false);
  });

  it('completes Draw activity and builds artwork keepsake', async () => {
    const sessionId = 'test-session-draw';
    const transport = new MockActivityTransport();
    await transport.connect(sessionId, 'artist-1');

    const runtime = createActivityRuntime<import('../lib/activity-adapters').DrawSnapshot>({
      sessionId,
      activityType: 'draw',
      currentUserId: 'artist-1',
      adapter: drawActivityAdapter,
      transport,
    });

    await runtime.sendEvent('draw_batch', {
      id: 'batch-1',
      userId: 'artist-1',
      sequence: 1,
      color: '#FF4488',
      brushSize: 6,
      points: [{ x: 50, y: 50 }, { x: 60, y: 70 }],
      timestamp: new Date().toISOString(),
    });

    expect(runtime.getSnapshot().strokes.length).toBe(1);

    const result = await runtime.completeActivity();
    expect(result.activityType).toBe('draw');
    expect(result.completed).toBe(true);

    const keepsake = drawActivityAdapter.buildKeepsake?.(result);
    expect(keepsake).not.toBeNull();
    expect(keepsake?.kind).toBe('activity');
    expect(keepsake?.metadata.totalStrokes).toBe(1);

    runtime.destroy();
  });
});

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import {
  lockPrivateAnswer,
  revealPrivateAnswers,
} from '@/lib/activity-session';
import type { PrivateVault } from '@/lib/runtime';
import type { StandardActivityEvent } from '@/lib/activity-adapters';

const DEFAULT_PRIVATE_ANSWER_EVENTS = {
  locked: 'answer_locked',
  revealed: 'answers_revealed',
  skipped: 'gentle_skip',
} as const;

export interface UsePrivateAnswersOptions {
  roundNumber: number;
  eventNames?: {
    locked: string;
    revealed: string;
    skipped?: string;
  };
  onBothLocked?: () => void;
  onReveal?: (
    answers: Array<{ userId: string; answer: unknown; lockedAt: string }>,
  ) => void;
  onSkip?: () => void;
  localRuntime?: {
    currentUserId: string;
    privateVault: PrivateVault;
    sendEvent: (
      type: string,
      payload: unknown,
    ) => Promise<StandardActivityEvent | null>;
    lastEvent: StandardActivityEvent | null;
  } | null;
}

export function usePrivateAnswers({
  roundNumber,
  onBothLocked,
  onReveal,
  onSkip,
  localRuntime = null,
  eventNames = DEFAULT_PRIVATE_ANSWER_EVENTS,
}: UsePrivateAnswersOptions) {
  const { sessionId, sendEvent, registerEventHandler } = useActivitySession();
  const { user } = useSupabaseSession();

  const [isLocked, setIsLocked] = useState(false);
  const [partnerLocked, setPartnerLocked] = useState(false);
  const [bothLocked, setBothLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [myAnswer, setMyAnswer] = useState<unknown>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Array<{
    userId: string;
    answer: unknown;
    lockedAt: string;
  }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSkipped, setIsSkipped] = useState(false);

  const applyRuntimeEvent = useCallback(
    (event: StandardActivityEvent) => {
      const payload = (event.payload as Record<string, unknown>) || {};
      if (Number(payload.roundNumber ?? -1) !== roundNumber) return;
      if (
        event.type === eventNames.locked &&
        event.senderId !== localRuntime?.currentUserId
      ) {
        setPartnerLocked(true);
        if (isLocked) {
          setBothLocked(true);
          onBothLocked?.();
        }
      } else if (event.type === eventNames.revealed) {
        if (revealed) return;
        void localRuntime?.privateVault
          .revealAnswers(roundNumber)
          .then((result) => {
            setRevealed(true);
            setRevealedAnswers(result.answers);
            onReveal?.(result.answers);
          })
          .catch(() => {});
      } else if (eventNames.skipped && event.type === eventNames.skipped) {
        setIsSkipped(true);
        onSkip?.();
      }
    },
    [
      roundNumber,
      localRuntime,
      isLocked,
      revealed,
      onBothLocked,
      onReveal,
      onSkip,
      eventNames,
    ],
  );

  // Reset when round changes
  useEffect(() => {
    setIsLocked(false);
    setPartnerLocked(false);
    setBothLocked(false);
    setRevealed(false);
    setMyAnswer(null);
    setRevealedAnswers(null);
    setError(null);
    setIsSkipped(false);
  }, [roundNumber]);

  // Listen to realtime events for synchronized locking, reveals, and gentle skips
  useEffect(() => {
    if (localRuntime) return;
    const unregister = registerEventHandler((event) => {
      const payload = (event.payload as Record<string, unknown>) || {};
      const targetRound = Number(payload.roundNumber ?? -1);

      if (targetRound === roundNumber) {
        if (event.type === eventNames.locked && event.senderId !== user?.id) {
          setPartnerLocked(true);
          if (isLocked) {
            setBothLocked(true);
            onBothLocked?.();
          }
        } else if (event.type === eventNames.revealed) {
          // This event is only a signal. Answers never travel through room_events.
          // Each participant retrieves sealed answers from the protected RPC instead.
          if (!sessionId) return;
          void revealPrivateAnswers(sessionId, roundNumber)
            .then((result) => {
              setRevealed(true);
              setRevealedAnswers(result.answers);
              onReveal?.(result.answers);
            })
            .catch(() => {
              // A stale or forged signal cannot reveal anything; the server remains authoritative.
            });
        } else if (eventNames.skipped && event.type === eventNames.skipped) {
          setIsSkipped(true);
          onSkip?.();
        }
      }
    });

    return () => {
      unregister();
    };
  }, [
    localRuntime,
    registerEventHandler,
    roundNumber,
    sessionId,
    user?.id,
    isLocked,
    onBothLocked,
    onReveal,
    onSkip,
    eventNames,
  ]);

  useEffect(() => {
    if (localRuntime?.lastEvent) applyRuntimeEvent(localRuntime.lastEvent);
  }, [localRuntime?.lastEvent, applyRuntimeEvent]);

  // Submit private answer to server (sealed until reveal)
  const lock = useCallback(
    async (answerPayload: unknown) => {
      if (!localRuntime && !sessionId) throw new Error('No active session.');
      setLoading(true);
      setError(null);

      try {
        setMyAnswer(answerPayload);
        const result = localRuntime
          ? await localRuntime.privateVault.lockAnswer(
              roundNumber,
              answerPayload,
            )
          : await lockPrivateAnswer(sessionId!, roundNumber, answerPayload);
        setIsLocked(result.locked);

        const areBothLocked =
          result.bothLocked || (partnerLocked && result.locked);
        if (areBothLocked) {
          setBothLocked(true);
          setPartnerLocked(true);
          onBothLocked?.();
        }

        // Notify partner that answer is locked (WITHOUT revealing answer payload)
        await (localRuntime?.sendEvent ?? sendEvent)(eventNames.locked, {
          roundNumber,
          locked: true,
        });

        return result;
      } catch (err: any) {
        const msg = err?.message || 'Failed to lock answer.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      sessionId,
      roundNumber,
      partnerLocked,
      onBothLocked,
      sendEvent,
      localRuntime,
      eventNames.locked,
    ],
  );

  // Authorize server to return sealed answers and broadcast reveal event to both clients
  const reveal = useCallback(async () => {
    if (!localRuntime && !sessionId) throw new Error('No active session.');
    setLoading(true);
    setError(null);

    try {
      const result = localRuntime
        ? await localRuntime.privateVault.revealAnswers(roundNumber)
        : await revealPrivateAnswers(sessionId!, roundNumber);
      setRevealed(true);
      setRevealedAnswers(result.answers);
      onReveal?.(result.answers);

      // Broadcast only that the sealed answers are ready. The answer values remain
      // inside the protected RPC response and are never included in room_events.
      const answersMatch =
        result.answers.length >= 2 &&
        result.answers[0].answer === result.answers[1].answer;
      await (localRuntime?.sendEvent ?? sendEvent)(eventNames.revealed, {
        roundNumber,
        isMatch: answersMatch,
      });

      return result.answers;
    } catch (err: any) {
      const msg = err?.message || 'Failed to reveal answers.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, roundNumber, onReveal, sendEvent, localRuntime, eventNames.revealed]);

  // Gentle Skip: requires no reason and transitions both people warmly
  const skip = useCallback(async () => {
    if (!localRuntime && !sessionId) return;
    setIsSkipped(true);
    if (!eventNames.skipped) return;
    await (localRuntime?.sendEvent ?? sendEvent)(eventNames.skipped, {
      roundNumber,
      skippedAt: new Date().toISOString(),
    });
    onSkip?.();
  }, [sessionId, roundNumber, sendEvent, onSkip, localRuntime, eventNames.skipped]);

  return {
    isLocked,
    partnerLocked,
    bothLocked,
    revealed,
    myAnswer,
    revealedAnswers,
    loading,
    error,
    isSkipped,
    lock,
    reveal,
    skip,
    setPartnerLocked,
    setBothLocked,
  };
}

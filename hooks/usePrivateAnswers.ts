'use client';

import { useState, useCallback, useEffect } from 'react';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { lockPrivateAnswer, revealPrivateAnswers } from '@/lib/activity-session';

export interface UsePrivateAnswersOptions {
  roundNumber: number;
  onBothLocked?: () => void;
  onReveal?: (answers: Array<{ userId: string; answer: unknown; lockedAt: string }>) => void;
  onSkip?: () => void;
}

export function usePrivateAnswers({ roundNumber, onBothLocked, onReveal, onSkip }: UsePrivateAnswersOptions) {
  const { sessionId, sendEvent, registerEventHandler } = useActivitySession();
  const { user } = useSupabaseSession();

  const [isLocked, setIsLocked] = useState(false);
  const [partnerLocked, setPartnerLocked] = useState(false);
  const [bothLocked, setBothLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [myAnswer, setMyAnswer] = useState<unknown>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Array<{ userId: string; answer: unknown; lockedAt: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSkipped, setIsSkipped] = useState(false);

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
    const unregister = registerEventHandler((event) => {
      const payload = (event.payload as Record<string, unknown>) || {};
      const targetRound = Number(payload.roundNumber ?? -1);

      if (targetRound === roundNumber) {
        if (event.type === 'answer_locked' && event.senderId !== user?.id) {
          setPartnerLocked(true);
          if (isLocked) {
            setBothLocked(true);
            onBothLocked?.();
          }
        } else if (event.type === 'answers_revealed') {
          // This event is only a signal. Answers never travel through room_events.
          // Each participant retrieves sealed answers from the protected RPC instead.
          if (!sessionId) return;
          void revealPrivateAnswers(sessionId, roundNumber).then((result) => {
            setRevealed(true);
            setRevealedAnswers(result.answers);
            onReveal?.(result.answers);
          }).catch(() => {
            // A stale or forged signal cannot reveal anything; the server remains authoritative.
          });
        } else if (event.type === 'gentle_skip') {
          setIsSkipped(true);
          onSkip?.();
        }
      }
    });

    return () => {
      unregister();
    };
  }, [registerEventHandler, roundNumber, sessionId, user?.id, isLocked, onBothLocked, onReveal, onSkip]);

  // Submit private answer to server (sealed until reveal)
  const lock = useCallback(
    async (answerPayload: unknown) => {
      if (!sessionId) throw new Error('No active session.');
      setLoading(true);
      setError(null);

      try {
        setMyAnswer(answerPayload);
        const result = await lockPrivateAnswer(sessionId, roundNumber, answerPayload);
        setIsLocked(result.locked);

        const areBothLocked = result.bothLocked || (partnerLocked && result.locked);
        if (areBothLocked) {
          setBothLocked(true);
          setPartnerLocked(true);
          onBothLocked?.();
        }

        // Notify partner that answer is locked (WITHOUT revealing answer payload)
        await sendEvent('answer_locked', { roundNumber, locked: true });

        return result;
      } catch (err: any) {
        const msg = err?.message || 'Failed to lock answer.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, roundNumber, partnerLocked, onBothLocked, sendEvent]
  );

  // Authorize server to return sealed answers and broadcast reveal event to both clients
  const reveal = useCallback(async () => {
    if (!sessionId) throw new Error('No active session.');
    setLoading(true);
    setError(null);

    try {
      const result = await revealPrivateAnswers(sessionId, roundNumber);
      setRevealed(true);
      setRevealedAnswers(result.answers);
      onReveal?.(result.answers);

      // Broadcast only that the sealed answers are ready. The answer values remain
      // inside the protected RPC response and are never included in room_events.
      await sendEvent('answers_revealed', {
        roundNumber,
      });

      return result.answers;
    } catch (err: any) {
      const msg = err?.message || 'Failed to reveal answers.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, roundNumber, onReveal, sendEvent]);

  // Gentle Skip: requires no reason and transitions both people warmly
  const skip = useCallback(async () => {
    if (!sessionId) return;
    setIsSkipped(true);
    await sendEvent('gentle_skip', { roundNumber, skippedAt: new Date().toISOString() });
    onSkip?.();
  }, [sessionId, roundNumber, sendEvent, onSkip]);

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

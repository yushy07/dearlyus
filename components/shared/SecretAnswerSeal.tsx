'use client';

import React, { useState } from 'react';
import styles from './SecretAnswerSeal.module.css';
import { sounds } from '@/lib/sound';

export interface RevealedAnswerItem {
  userId: string;
  answer: unknown;
  lockedAt: string;
}

export interface SecretAnswerSealProps {
  roundNumber: number;
  isLocked: boolean;
  partnerLocked: boolean;
  bothLocked: boolean;
  revealed: boolean;
  isSkipped?: boolean;
  myDraftAnswer?: unknown;
  revealedAnswers?: RevealedAnswerItem[] | null;
  partnerName?: string;
  myName?: string;
  currentUserId?: string;
  canLock?: boolean;
  formatAnswer?: (answer: unknown) => string;
  onLock: () => Promise<void> | void;
  onReveal: () => Promise<void> | void;
  onSkip?: () => Promise<void> | void;
  onReaction?: (emoji: string) => void;
  children?: React.ReactNode;
}

const DEFAULT_REACTIONS = [
  { emoji: '💖', label: 'Match Made' },
  { emoji: '🤯', label: 'No Way' },
  { emoji: '🥺', label: 'So Sweet' },
  { emoji: '😂', label: 'Laughing' },
  { emoji: '🔥', label: 'Spicy' },
];

export function SecretAnswerSeal({
  roundNumber,
  isLocked,
  partnerLocked,
  bothLocked,
  revealed,
  isSkipped = false,
  myDraftAnswer,
  revealedAnswers,
  partnerName = 'Partner',
  myName = 'You',
  currentUserId,
  canLock = true,
  formatAnswer = (ans) => String(ans ?? ''),
  onLock,
  onReveal,
  onSkip,
  onReaction,
  children,
}: SecretAnswerSealProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [sentReactions, setSentReactions] = useState<string[]>([]);

  const handleLockIn = async () => {
    if (!canLock || isSubmitting) return;
    setIsSubmitting(true);
    sounds.playChoiceLock();
    try {
      await onLock();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealClick = async () => {
    if (isRevealing) return;
    setIsRevealing(true);
    sounds.playWaxCrack();
    setTimeout(() => {
      sounds.playParchmentUnfold();
      sounds.playCelebration();
    }, 280);

    try {
      await onReveal();
    } finally {
      setIsRevealing(false);
    }
  };

  const handleReactionClick = (emoji: string) => {
    sounds.playSparkleReaction(emoji);
    setSentReactions((prev) => [...prev, emoji]);
    onReaction?.(emoji);
  };

  const handleGentleSkip = async () => {
    sounds.playPop();
    await onSkip?.();
  };

  // 1. If round was skipped gently
  if (isSkipped) {
    return (
      <div className={styles.sealContainer}>
        <div className={styles.skippedCard}>
          <div className={styles.skipIcon}>🕊️</div>
          <h3 className={styles.skipTitle}>Moment Skipped Gently</h3>
          <p className={styles.skipDesc}>
            No reasons needed, no pressure given. Ready whenever you two want to
            step into the next prompt.
          </p>
        </div>
      </div>
    );
  }

  // 2. If answers are already revealed
  if (revealed && revealedAnswers && revealedAnswers.length > 0) {
    const partnerAnsItem =
      revealedAnswers.find((a) => a.userId !== currentUserId) ||
      revealedAnswers[1];
    const myAnsItem =
      revealedAnswers.find((a) => a.userId === currentUserId) ||
      revealedAnswers[0];

    const myFormatted = formatAnswer(myAnsItem?.answer ?? myDraftAnswer);
    const partnerFormatted = formatAnswer(partnerAnsItem?.answer);
    const isExactMatch =
      myFormatted.trim().toLowerCase() ===
        partnerFormatted.trim().toLowerCase() && myFormatted.length > 0;

    return (
      <div className={styles.sealContainer}>
        <div className={styles.revealedCard}>
          <div className={styles.sealHeader}>
            <span className={`${styles.lockPill} ${styles.pillBothReady}`}>
              ✨ Revealed Together
            </span>
            <span className={styles.partnerStatus}>
              Round {roundNumber} Complete
            </span>
          </div>

          {isExactMatch && (
            <div className={styles.matchBanner}>
              💖 We Matched! Telepathic connection unlocked.
            </div>
          )}

          <div className={styles.revealGrid}>
            <div className={styles.partnerBox}>
              <div className={styles.partnerBoxHeader}>
                <span className={styles.partnerName}>{myName}</span>
                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                  🔒 Sealed
                </span>
              </div>
              <div className={styles.partnerAnswerText}>{myFormatted}</div>
            </div>

            <div
              className={styles.partnerBox}
              style={{ borderColor: 'rgba(245, 158, 11, 0.35)' }}
            >
              <div className={styles.partnerBoxHeader}>
                <span className={styles.partnerName}>{partnerName}</span>
                <span style={{ fontSize: '0.8rem', color: '#F59E0B' }}>
                  ✨ Shared
                </span>
              </div>
              <div className={styles.partnerAnswerText}>{partnerFormatted}</div>
            </div>
          </div>

          {/* Post-reveal reactions */}
          <div className={styles.reactionsBar}>
            <span
              style={{
                fontSize: '0.82rem',
                color: '#881337',
                fontWeight: 600,
                marginRight: '0.4rem',
              }}
            >
              React together:
            </span>
            {DEFAULT_REACTIONS.map(({ emoji, label }) => {
              const count = sentReactions.filter((e) => e === emoji).length;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReactionClick(emoji)}
                  className={styles.reactionBtn}
                  title={label}
                >
                  <span>{emoji}</span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#BE123C',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. If user has locked in (wax seal state)
  if (isLocked) {
    return (
      <div className={styles.sealContainer}>
        <div className={styles.sealHeader}>
          <span
            className={`${styles.lockPill} ${bothLocked ? styles.pillBothReady : styles.pillLocked}`}
          >
            {bothLocked
              ? '✨ Both Answers Locked'
              : '🔒 Answer Sealed & Private'}
          </span>

          <div className={styles.partnerStatus}>
            <span
              className={`${styles.statusDot} ${partnerLocked ? styles.dotLocked : styles.dotThinking}`}
            />
            <span>
              {partnerLocked
                ? `${partnerName} is locked in! ✨`
                : `${partnerName} is drafting... 💭`}
            </span>
          </div>
        </div>

        <div className={styles.waxSealCard}>
          <div className={styles.waxSealBadge} title="Dearly Us Wax Seal">
            {bothLocked ? '✨' : '💌'}
          </div>

          <h3 className={styles.waxSealTitle}>
            {bothLocked ? 'Ready to Reveal Together' : 'Your Answer is Sealed'}
          </h3>

          <p className={styles.waxSealDesc}>
            {bothLocked
              ? 'Both of you have sealed your responses. Hit reveal to unseal the parchment at the exact same moment.'
              : `Hidden from ${partnerName} until both of you have locked in. Take a breath while they ponder.`}
          </p>

          {myDraftAnswer !== undefined && myDraftAnswer !== null && (
            <div className={styles.previewPill}>
              Your secret pick: <strong>{formatAnswer(myDraftAnswer)}</strong>
            </div>
          )}

          <div>
            {bothLocked ? (
              <button
                type="button"
                onClick={handleRevealClick}
                disabled={isRevealing}
                className={styles.btnReveal}
              >
                <span>✨ Reveal Together ✨</span>
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#9F1239',
                  fontSize: '0.88rem',
                }}
              >
                <span className={`${styles.statusDot} ${styles.dotThinking}`} />
                <span>Awaiting {partnerName} to lock in...</span>
              </div>
            )}
          </div>
        </div>

        {onSkip && !bothLocked && (
          <div
            className={styles.actionRow}
            style={{ justifyContent: 'center' }}
          >
            <button
              type="button"
              onClick={handleGentleSkip}
              className={styles.btnSkip}
            >
              <span>🕊️ Gentle Skip</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4. Drafting state
  return (
    <div className={styles.sealContainer}>
      <div className={styles.sealHeader}>
        <span className={`${styles.lockPill} ${styles.pillDrafting}`}>
          ✍️ Draft Locally
        </span>

        <div className={styles.partnerStatus}>
          <span
            className={`${styles.statusDot} ${partnerLocked ? styles.dotLocked : styles.dotThinking}`}
          />
          <span>
            {partnerLocked
              ? `${partnerName} has locked their pick! 🔒`
              : `${partnerName} is also choosing... 💭`}
          </span>
        </div>
      </div>

      <div className={styles.draftContent}>{children}</div>

      <div className={styles.actionRow}>
        <button
          type="button"
          onClick={handleLockIn}
          disabled={!canLock || isSubmitting}
          className={styles.btnLock}
        >
          <span>🔒 Lock In Privately</span>
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={handleGentleSkip}
            className={styles.btnSkip}
            title="No reason required"
          >
            <span>🕊️ Gentle Skip</span>
          </button>
        )}
      </div>
    </div>
  );
}

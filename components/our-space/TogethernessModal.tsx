'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TogethernessMode, TOGETHERNESS_MODES } from '@/types/cupidot';
import { sounds } from '@/lib/sound';

export interface TogethernessModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoomCode?: string | null;
  onStartRoom?: () => Promise<void>;
  partnerName?: string;
  onSparkAwarded?: () => void;
  upcomingRitualTitle?: string | null;
  cameraAllowed?: boolean;
  onProposeKeepsake?: (title: string, caption: string) => void;
}

export function TogethernessModal({
  isOpen,
  onClose,
  activeRoomCode,
  onStartRoom,
  partnerName = 'Your person',
  onSparkAwarded,
  upcomingRitualTitle,
  cameraAllowed = true,
  onProposeKeepsake,
}: TogethernessModalProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] =
    useState<TogethernessMode>('quick_spark');

  // M05: Quiet Together state with shared target deadline & pause
  const [quietMinutes, setQuietMinutes] = useState<15 | 30 | 45 | 60>(30);
  const [quietAmbience, setQuietAmbience] = useState<'rain' | 'fire' | 'warm'>(
    'warm',
  );
  const [quietActive, setQuietActive] = useState(false);
  const [quietPaused, setQuietPaused] = useState(false);
  const [quietTargetEpoch, setQuietTargetEpoch] = useState<number | null>(null);
  const [quietSecondsLeft, setQuietSecondsLeft] = useState(30 * 60);

  // M06: Quick Spark interactive mini-state (independent participation & mutual reveal)
  const [quickSparkQuestionIdx, setQuickSparkQuestionIdx] = useState(0);
  const [quickSparkAnswer, setQuickSparkAnswer] = useState('');
  const [quickSparkSubmitted, setQuickSparkSubmitted] = useState(false);
  const [partnerSparkAnswer, setPartnerSparkAnswer] = useState(
    'Smiling thinking of your text earlier today :)',
  );
  const [quickSparkRevealed, setQuickSparkRevealed] = useState(false);
  const [sparkKeepsakeSaved, setSparkKeepsakeSaved] = useState(false);

  // Deep connection prompt
  const [deepPromptIdx, setDeepPromptIdx] = useState(0);

  // R06: Surprise suggestion index
  const [surprisePickIdx, setSurprisePickIdx] = useState(0);

  const QUICK_SPARK_PROMPTS = [
    'What was the best 10 seconds of your day today?',
    'Send an emoji that describes your energy right now.',
    'If we had a teleport button for 5 minutes, where would we go right now?',
    'What song reminds you of us this week?',
  ];

  const DEEP_PROMPTS = [
    'When is a moment during the distance when you felt truly held by me?',
    'What is something gentle you are learning about yourself lately?',
    'What is a quiet worry you have been carrying that you are ready to let down?',
    'What part of our shared future gives you the most peace?',
  ];

  // M13: Keyboard Escape handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sounds.stopAllAmbience();
        setQuietActive(false);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // M05: Quiet Together timer interval with common epoch deadline and stopAllAmbience on completion
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (quietActive && !quietPaused && quietSecondsLeft > 0) {
      interval = setInterval(() => {
        if (quietTargetEpoch) {
          const remaining = Math.max(
            0,
            Math.round((quietTargetEpoch - Date.now()) / 1000),
          );
          setQuietSecondsLeft(remaining);
          if (remaining === 0) {
            sounds.playChime();
            sounds.stopAllAmbience(); // M05: Stop ambience on natural completion too
            setQuietActive(false);
            setQuietTargetEpoch(null);
            onSparkAwarded?.();
          }
        } else {
          setQuietSecondsLeft((prev) => {
            if (prev <= 1) {
              sounds.playChime();
              sounds.stopAllAmbience();
              setQuietActive(false);
              onSparkAwarded?.();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    quietActive,
    quietPaused,
    quietSecondsLeft,
    quietTargetEpoch,
    onSparkAwarded,
  ]);

  // Clean up sounds on close or unmount
  useEffect(() => {
    return () => {
      sounds.stopAllAmbience();
    };
  }, []);

  if (!isOpen) return null;

  const handleStartQuiet = () => {
    sounds.playPop();
    const durationSec = quietMinutes * 60;
    setQuietSecondsLeft(durationSec);
    setQuietTargetEpoch(Date.now() + durationSec * 1000);
    setQuietActive(true);
    setQuietPaused(false);

    if (quietAmbience === 'rain') sounds.toggleRainSound(true);
    else if (quietAmbience === 'fire') sounds.toggleFireplaceSound(true);
    else sounds.startWarm(0.25);
  };

  const handlePauseResumeQuiet = () => {
    sounds.playPop();
    if (quietPaused) {
      setQuietTargetEpoch(Date.now() + quietSecondsLeft * 1000);
      setQuietPaused(false);
      if (quietAmbience === 'rain') sounds.toggleRainSound(true);
      else if (quietAmbience === 'fire') sounds.toggleFireplaceSound(true);
      else sounds.startWarm(0.25);
    } else {
      sounds.stopAllAmbience();
      setQuietPaused(true);
    }
  };

  const handleStopQuiet = () => {
    sounds.stopAllAmbience();
    setQuietActive(false);
    setQuietPaused(false);
    setQuietTargetEpoch(null);
  };

  // R06: Safe Recommendation & Surprise routing
  const getRecommendation = () => {
    if (activeRoomCode) {
      return {
        path: `/room/${activeRoomCode}`,
        title: 'Resume Date Night Room',
        reason: 'Continue your in-progress synchronized date room.',
        icon: '🌹',
      };
    }
    if (upcomingRitualTitle) {
      return {
        path: '/cards',
        title: upcomingRitualTitle,
        reason: 'Honor your scheduled shared ritual together tonight.',
        icon: '🕰️',
      };
    }
    const pool = [
      {
        path: '/quiz',
        title: 'Telepathy Quiz',
        reason:
          'A playful question game with sealed answers and synchronized reveals.',
        icon: '✨',
      },
      {
        path: '/cards',
        title: 'Honest Vulnerability Cards',
        reason: 'Vulnerable conversation prompts to explore in comfort.',
        icon: '🎴',
      },
      {
        path: '/draw',
        title: 'Shared Canvas',
        reason: 'Relaxing collaborative canvas with live brush strokes.',
        icon: '🎨',
      },
      {
        path: '/letter',
        title: 'Wax-Sealed Time Capsule',
        reason: 'Gentle slow letters to be opened on a future milestone.',
        icon: '💌',
      },
    ];
    if (cameraAllowed) {
      pool.push({
        path: '/photobooth',
        title: 'Retro 4-Cut Photobooth',
        reason: 'Snap playful nostalgic photostrips together.',
        icon: '📸',
      });
    }
    return pool[surprisePickIdx % pool.length];
  };

  const handleLaunchMode = async () => {
    sounds.playPop();
    if (selectedMode === 'date_night') {
      if (activeRoomCode) {
        router.push(`/room/${activeRoomCode}`);
      } else if (onStartRoom) {
        await onStartRoom();
      }
      onClose();
    } else if (selectedMode === 'make_something') {
      router.push('/draw');
      onClose();
    } else if (selectedMode === 'surprise_us') {
      const rec = getRecommendation();
      router.push(rec.path);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="togetherness-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(28, 25, 36, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleStopQuiet();
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'var(--paper-raised)',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--line)',
          padding: '28px 24px',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--pink)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Togetherness Modes
            </span>
            <h2
              id="togetherness-modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                margin: '2px 0 0',
                color: 'var(--ink)',
              }}
            >
              How do you two want to connect?
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              handleStopQuiet();
              onClose();
            }}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            ✕ Close
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          {TOGETHERNESS_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedMode(mode.id);
                  if (quietActive && mode.id !== 'quiet_together') {
                    handleStopQuiet();
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 6px',
                  borderRadius: '16px',
                  border: isSelected
                    ? '1.5px solid var(--pink)'
                    : '1px solid var(--line)',
                  background: isSelected
                    ? 'rgba(255, 78, 120, 0.08)'
                    : 'var(--paper-raised)',
                  color: isSelected ? 'var(--pink)' : 'var(--ink)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '20px', marginBottom: '4px' }}>
                  {mode.icon}
                </span>
                <strong
                  style={{
                    fontSize: '11px',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {mode.name}
                </strong>
                <span
                  style={{
                    fontSize: '9.5px',
                    color: 'var(--ink-soft)',
                    marginTop: '2px',
                  }}
                >
                  {mode.duration}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Mode Body */}

        {/* 1. Quick Spark */}
        {selectedMode === 'quick_spark' && (
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>⚡</span>
              <strong style={{ fontSize: '15px' }}>
                Quick Spark · 2-minute connection
              </strong>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-soft)',
                margin: '0 0 16px',
              }}
            >
              Designed for busy days across time zones. Exchange one tiny
              playful thought.
            </p>

            <div
              style={{
                background: 'var(--paper-raised)',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid var(--line)',
                marginBottom: '14px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--pink)',
                  fontWeight: 700,
                }}
              >
                Prompt #{quickSparkQuestionIdx + 1}
              </span>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '6px 0 0',
                }}
              >
                {QUICK_SPARK_PROMPTS[quickSparkQuestionIdx]}
              </p>
            </div>

            {!quickSparkSubmitted ? (
              <div>
                <input
                  type="text"
                  value={quickSparkAnswer}
                  onChange={(e) => setQuickSparkAnswer(e.target.value)}
                  placeholder="Your quick answer…"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    marginBottom: '12px',
                    fontSize: '14px',
                  }}
                  maxLength={140}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      sounds.playPop();
                      setQuickSparkQuestionIdx(
                        (prev) => (prev + 1) % QUICK_SPARK_PROMPTS.length,
                      );
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    Shuffle prompt ↻
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!quickSparkAnswer.trim()}
                    onClick={() => {
                      sounds.playPop();
                      setQuickSparkSubmitted(true);
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    Seal My Response 🔒
                  </button>
                </div>
              </div>
            ) : !quickSparkRevealed ? (
              <div
                style={{
                  background: 'var(--paper-raised)',
                  borderRadius: '14px',
                  padding: '18px',
                  border: '1px solid var(--line)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🔒</div>
                <h4 style={{ margin: '0 0 4px', color: 'var(--ink)' }}>
                  Your answer is sealed tight
                </h4>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--ink-soft)',
                    margin: '0 0 14px',
                  }}
                >
                  Invisible to {partnerName} until both responses are ready to
                  reveal in tandem.
                </p>

                <div
                  style={{
                    background: 'var(--paper)',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    marginBottom: '14px',
                    color: 'var(--ink)',
                  }}
                >
                  &ldquo;{quickSparkAnswer}&rdquo;
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setQuickSparkSubmitted(false)}
                    style={{ fontSize: '12px' }}
                  >
                    ✎ Edit draft
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      sounds.playCelebration();
                      setQuickSparkRevealed(true);
                      onSparkAwarded?.();
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    Reveal Answers Together 🔍
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--paper-raised)',
                  borderRadius: '14px',
                  padding: '18px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '28px' }}>💖</span>
                  <h4 style={{ margin: '4px 0 2px', color: 'var(--ink)' }}>
                    Revealed Together!
                  </h4>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--pink)',
                      fontWeight: 700,
                    }}
                  >
                    +1 Growth Spark Awarded
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--paper)',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--ink-soft)',
                        marginBottom: '4px',
                      }}
                    >
                      YOU:
                    </div>
                    <div style={{ color: 'var(--ink)' }}>
                      &ldquo;{quickSparkAnswer}&rdquo;
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'var(--paper)',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--ink-soft)',
                        marginBottom: '4px',
                      }}
                    >
                      {partnerName.toUpperCase()}:
                    </div>
                    <div style={{ color: 'var(--ink)' }}>
                      &ldquo;{partnerSparkAnswer}&rdquo;
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  {onProposeKeepsake && !sparkKeepsakeSaved && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        sounds.playSparkleReaction('💖');
                        onProposeKeepsake(
                          `Quick Spark: ${QUICK_SPARK_PROMPTS[quickSparkQuestionIdx]}`,
                          `${quickSparkAnswer} — ${partnerSparkAnswer}`,
                        );
                        setSparkKeepsakeSaved(true);
                      }}
                      style={{ fontSize: '12px' }}
                    >
                      Propose as Keepsake ♡
                    </button>
                  )}
                  {sparkKeepsakeSaved && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--pink)',
                        fontWeight: 700,
                      }}
                    >
                      ✓ Proposed to Our Space
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      sounds.playPop();
                      setQuickSparkSubmitted(false);
                      setQuickSparkRevealed(false);
                      setQuickSparkAnswer('');
                      setSparkKeepsakeSaved(false);
                      setQuickSparkQuestionIdx(
                        (prev) => (prev + 1) % QUICK_SPARK_PROMPTS.length,
                      );
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    Next prompt ↻
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Date Night */}
        {selectedMode === 'date_night' && (
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🌹</span>
              <strong style={{ fontSize: '15px' }}>
                Date Night · Multi-activity shared room
              </strong>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-soft)',
                margin: '0 0 16px',
              }}
            >
              Enter the synchronized lobby with ambient soundscapes, activity
              queue, and sealed answer reveals.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleLaunchMode}
              >
                {activeRoomCode
                  ? 'Resume Date Night Room ▷'
                  : 'Start Date Night Room ▷'}
              </button>
            </div>
          </div>
        )}

        {/* 3. Quiet Together */}
        {selectedMode === 'quiet_together' && (
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>☕</span>
              <strong style={{ fontSize: '15px' }}>
                Quiet Together · Shared peaceful presence
              </strong>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-soft)',
                margin: '0 0 16px',
              }}
            >
              No prompts, no games, no performance. Study, read, or wind down
              together with soothing audio.
            </p>

            {!quietActive ? (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Duration
                    </label>
                    <select
                      value={quietMinutes}
                      onChange={(e) =>
                        setQuietMinutes(Number(e.target.value) as any)
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Ambience
                    </label>
                    <select
                      value={quietAmbience}
                      onChange={(e) => setQuietAmbience(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <option value="warm">Warm Hearth 🪵</option>
                      <option value="rain">Window Rain 🌧️</option>
                      <option value="fire">Fireplace Crackle 🔥</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartQuiet}
                  >
                    Begin Quiet Session ▷
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '36px',
                    fontWeight: 800,
                    color: 'var(--ink)',
                    marginBottom: '8px',
                  }}
                >
                  {Math.floor(quietSecondsLeft / 60)}:
                  {(quietSecondsLeft % 60).toString().padStart(2, '0')}
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-soft)',
                    margin: '0 0 16px',
                  }}
                >
                  Sitting together peacefully. Cupidot is keeping watch over
                  your quiet sanctuary.
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handlePauseResumeQuiet}
                    style={{ fontSize: '12px' }}
                  >
                    {quietPaused ? 'Resume Session ▶' : 'Pause Session ⏸'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleStopQuiet}
                    style={{ fontSize: '12px', color: 'var(--ink-soft)' }}
                  >
                    End session early ⏹
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Deep Connection */}
        {selectedMode === 'deep_connection' && (
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🌊</span>
              <strong style={{ fontSize: '15px' }}>
                Deep Connection · Slower heart-to-heart
              </strong>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-soft)',
                margin: '0 0 16px',
              }}
            >
              Tender questions to explore over voice call or private notes.
              Skipping is always neutral.
            </p>

            <div
              style={{
                background: 'var(--paper-raised)',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid var(--line)',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--blue)',
                  fontWeight: 700,
                }}
              >
                Gentle Prompt #{deepPromptIdx + 1}
              </span>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '6px 0 0',
                }}
              >
                {DEEP_PROMPTS[deepPromptIdx]}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  sounds.playPop();
                  setDeepPromptIdx((prev) => (prev + 1) % DEEP_PROMPTS.length);
                }}
                style={{ fontSize: '12px' }}
              >
                Skip gently 🕊️
              </button>
              <Link
                className="btn btn-primary"
                href="/cards"
                style={{ fontSize: '12px' }}
              >
                Open Vulnerability Cards →
              </Link>
            </div>
          </div>
        )}

        {/* 5. Make Something */}
        {selectedMode === 'make_something' && (
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🎨</span>
              <strong style={{ fontSize: '15px' }}>
                Make Something · Create together
              </strong>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-soft)',
                margin: '0 0 16px',
              }}
            >
              Pick a creative canvas. Finished pieces can be turned into
              mutually approved keepsakes.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <Link
                className="btn btn-ghost"
                href="/draw"
                style={{ justifyContent: 'center' }}
              >
                Draw Together ✎
              </Link>
              {cameraAllowed && (
                <Link
                  className="btn btn-ghost"
                  href="/photobooth"
                  style={{ justifyContent: 'center' }}
                >
                  Take Photostrip 📸
                </Link>
              )}
              <Link
                className="btn btn-ghost"
                href="/letter"
                style={{ justifyContent: 'center' }}
              >
                Capsule Letter 💌
              </Link>
              <Link
                className="btn btn-ghost"
                href="/scrapbook"
                style={{ justifyContent: 'center' }}
              >
                Scrapbook Page 📖
              </Link>
            </div>
          </div>
        )}

        {/* 6. Surprise Us (R06 reasoned suggestion & camera filtering) */}
        {selectedMode === 'surprise_us' &&
          (() => {
            const rec = getRecommendation();
            return (
              <div
                style={{
                  background: 'var(--paper)',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🎲</span>
                  <strong style={{ fontSize: '15px' }}>
                    Surprise Us · Reasoned Suggestion
                  </strong>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-soft)',
                    margin: '0 0 16px',
                  }}
                >
                  Curated based on active rooms, rituals, and device camera
                  permissions.
                </p>

                <div
                  style={{
                    background: 'var(--paper-raised)',
                    borderRadius: '14px',
                    padding: '16px',
                    border: '1px solid var(--line)',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{rec.icon}</span>
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                        {rec.title}
                      </strong>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--pink)',
                          fontWeight: 700,
                        }}
                      >
                        Why Cupidot chose this tonight:
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--ink-soft)',
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {rec.reason}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      sounds.playPop();
                      setSurprisePickIdx((prev) => prev + 1);
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    Another idea ↻
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleLaunchMode}
                    style={{ fontSize: '12px' }}
                  >
                    Start {rec.title} →
                  </button>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

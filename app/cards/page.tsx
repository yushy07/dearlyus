'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ribbon,
  Navbar,
  CoupleNameBar,
  AiConsentToggle,
  CupidotActivityGuidance,
} from '@/components/shared';
import { sounds } from '@/lib/sound';
import {
  SwipeDeck,
  GlowBadge,
  ScrollProgress,
  ScrollReveal,
} from '@/components/ui';
import { ScratchOffCard } from '@/components/cards/ScratchOffCard';
import { useCoupleProfile } from '@/lib/couple';
import { useAiConsent } from '@/lib/ai-consent';
import { generateAdaptiveQuestion } from '@/lib/gemini';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';

interface Card {
  tier: string;
  prompt: string;
  category: string;
}

const INITIAL_DECK: Card[] = [
  {
    tier: 'Level 1 · Warm Up',
    category: 'Playful',
    prompt:
      'What is a small detail about me that you noticed recently and never said aloud?',
  },
  {
    tier: 'Level 1 · Warm Up',
    category: 'Habits',
    prompt:
      'What is our funniest inside joke that nobody else in our lives would ever understand?',
  },
  {
    tier: 'Level 2 · Deep Water',
    category: 'Feelings',
    prompt:
      'When is a moment during the distance when you felt closest to me, even miles apart?',
  },
  {
    tier: 'Level 2 · Deep Water',
    category: 'Vulnerability',
    prompt:
      'What is a fear or worry you’ve had about our future that you haven’t fully shared yet?',
  },
  {
    tier: 'Level 3 · Raw Truth',
    category: 'Devotion',
    prompt:
      'What makes you confident that every single mile of this distance will be worth it?',
  },
  {
    tier: 'Level 3 · Raw Truth',
    category: 'Love',
    prompt: 'How have you changed as a person since we fell in love?',
  },
];

export default function CardsPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { hasAiConsent } = useAiConsent();
  const [deck, setDeck] = useState<Card[]>(INITIAL_DECK);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scratchMode, setScratchMode] = useState(true);
  const [myAnswer, setMyAnswer] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [hostNote, setHostNote] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<
    Array<{ question: string; answerA: string; answerB: string }>
  >([]);
  const runtime = useActivityRuntime({
    sessionId: `mock-cards-${roomCode || 'local'}`,
    activityType: 'cards',
    roomId: roomCode || 'local',
    transportMode: 'mock',
    initialOptions: { deckId: 'honest-cards', totalCards: INITIAL_DECK.length },
  });

  useEffect(() => {
    const snapshot = runtime.snapshot as {
      cardIndex?: number;
      flipped?: boolean;
    };
    if (typeof snapshot.cardIndex === 'number')
      setCurrentIdx(snapshot.cardIndex % deck.length);
    if (typeof snapshot.flipped === 'boolean') setFlipped(snapshot.flipped);
  }, [runtime.snapshot, deck.length]);

  const card = deck[currentIdx] || deck[0];

  const handleNext = () => {
    sounds.playPop();
    void runtime.sendEvent('cards_next', {});
    setMyAnswer('');
    setPartnerAnswer('');
    setRevealed(false);
    setHostNote(null);
  };

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    sounds.playCelebration();

    const currentRoundData = {
      question: card.prompt,
      answerA: myAnswer.trim(),
      answerB: partnerAnswer.trim(),
    };
    const updatedHistory = [...sessionHistory, currentRoundData];
    setSessionHistory(updatedHistory);

    // Fetch dynamic adaptive follow-up card only if both real answers are present and AI consent is granted
    if (!hasAiConsent || !myAnswer.trim() || !partnerAnswer.trim()) return;

    void generateAdaptiveQuestion({
      partnerA: {
        name: partnerA,
        answer: myAnswer.trim(),
      },
      partnerB: {
        name: partnerB,
        answer: partnerAnswer.trim(),
      },
      mode: 'cards',
      mood: 'deep',
      aiConsent: true,
      history: updatedHistory,
    })
      .then((data: any) => {
        if (data?.question) {
          const newCard: Card = {
            tier: 'Level 4 · Deep Lore',
            category: 'Adaptive',
            prompt: data.question,
          };
          const nextDeck = [...deck];
          nextDeck.splice(currentIdx + 1, 0, newCard);
          setDeck(nextDeck);
          if (data.commentary) {
            setHostNote(data.commentary);
          }
        }
      })
      .catch(() => {});
  };

  return (
    <div
      style={{
        background: 'var(--paper)',
        minHeight: '100vh',
        paddingBottom: '80px',
        color: 'var(--ink)',
      }}
    >
      <Ribbon
        text={
          <>
            🎴 Honest Cards · <b>Vulnerable Conversations for Two Screens</b>
          </>
        }
      />

      <Navbar
        rightAction={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              background: 'var(--paper-raised)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
            }}
          >
            Card{' '}
            <b>
              {currentIdx + 1} / {deck.length}
            </b>
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '720px' }}>
        <div style={{ marginBottom: '18px' }}>
          <AiConsentToggle />
        </div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <CoupleNameBar />
          <h1
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}
          >
            The questions you <span className="grad">keep avoiding</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            You both answer privately on your screens — then the card flips open
            at once.
          </p>
        </div>

        {/* Swipeable Card Stage with Scratch-Off Silver Foil */}
        <div
          style={{
            perspective: '1200px',
            margin: '0 auto 28px',
            maxWidth: '520px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '10px',
            }}
          >
            <button
              onClick={() => {
                sounds.playPop();
                setScratchMode(!scratchMode);
              }}
              style={{
                background: scratchMode
                  ? 'var(--pink-tint)'
                  : 'var(--paper-raised)',
                border: scratchMode
                  ? '1.5px solid var(--pink)'
                  : '1px solid var(--line)',
                color: scratchMode ? 'var(--pink)' : 'var(--ink-soft)',
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🪙</span>
              <span>
                {scratchMode
                  ? '✓ Silver Foil Scratch Mode'
                  : 'Instant Card View'}
              </span>
            </button>
          </div>

          <CupidotActivityGuidance
            activityName="Deep Connection Cards"
            phase={revealed ? 'revealed' : myAnswer ? 'locked' : 'ready'}
            partnerName={partnerB || 'Partner'}
            isDemoMode={true}
            demoNotice="Single-screen preview exploration. In synchronized date nights, each partner responds privately from their own screen."
            privacyNote="No rush, no score, and no pressure to answer what you're not ready to share."
          />

          <SwipeDeck onSwipeRight={handleNext} onSwipeLeft={handleNext}>
            {scratchMode ? (
              <ScratchOffCard resetKey={currentIdx}>
                <div
                  onClick={() => {
                    void runtime.sendEvent('cards_flip', {});
                    sounds.playTick();
                  }}
                  className="card-3d"
                  style={{
                    background: 'linear-gradient(135deg, #FFFDFB, #F6F1EA)',
                    border: '2px solid var(--line)',
                    borderRadius: '20px',
                    padding: '48px 36px',
                    minHeight: '290px',
                    boxShadow:
                      '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(255,123,163,0.06)',
                    cursor: 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <GlowBadge
                        text={`${card.tier} · ${card.category}`}
                        size="sm"
                      />
                    </div>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        marginTop: '16px',
                        color: 'var(--ink)',
                      }}
                    >
                      &ldquo;{card.prompt}&rdquo;
                    </h2>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      fontSize: '12px',
                      color: 'var(--ink-soft)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>👆 Swipe left/right for next</span>
                    <span>{revealed ? '✓ Revealed' : 'Tap to flip'}</span>
                  </div>
                </div>
              </ScratchOffCard>
            ) : (
              <div
                onClick={() => {
                  void runtime.sendEvent('cards_flip', {});
                  sounds.playTick();
                }}
                className="card-3d"
                style={{
                  background: 'linear-gradient(135deg, #FFFDFB, #F6F1EA)',
                  border: '2px solid var(--line)',
                  borderRadius: '20px',
                  padding: '48px 36px',
                  minHeight: '290px',
                  boxShadow:
                    '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(255,123,163,0.06)',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'transform 0.3s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      justifyContent: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <GlowBadge
                      text={`${card.tier} · ${card.category}`}
                      size="sm"
                    />
                  </div>
                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      marginTop: '16px',
                      color: 'var(--ink)',
                    }}
                  >
                    &ldquo;{card.prompt}&rdquo;
                  </h2>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    fontSize: '12px',
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span>👆 Swipe left/right for next</span>
                  <span>{revealed ? '✓ Revealed' : 'Tap to flip'}</span>
                </div>
              </div>
            )}
          </SwipeDeck>
        </div>

        {/* Inputs */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow)',
            marginBottom: '24px',
          }}
        >
          {!revealed ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Your Private Answer ({partnerA}):
                </label>
                <textarea
                  rows={2}
                  value={myAnswer}
                  onChange={(e) => setMyAnswer(e.target.value)}
                  placeholder={`Type your honest thoughts...`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14.5px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  {partnerB}&apos;s Answer (Solo Preview Sandbox):
                </label>
                <textarea
                  rows={2}
                  value={partnerAnswer}
                  onChange={(e) => setPartnerAnswer(e.target.value)}
                  placeholder={`Optional preview: Type ${partnerB}'s answer if testing on one device, or leave blank.`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14.5px',
                  }}
                />
              </div>
              <button
                onClick={handleReveal}
                disabled={!myAnswer.trim() && !partnerAnswer.trim()}
                className="btn btn-primary"
                style={{
                  padding: '12px',
                  fontSize: '15px',
                  justifyContent: 'center',
                }}
              >
                Reveal Shared Answers 🔍
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--pink)',
                  }}
                >
                  🌸 {partnerA}&apos;s Answer:
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: myAnswer ? 'inherit' : 'var(--ink-soft)',
                    fontStyle: myAnswer ? 'normal' : 'italic',
                  }}
                >
                  {myAnswer || `(No answer entered for ${partnerA})`}
                </p>
              </div>
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--blue)',
                  }}
                >
                  💙 {partnerB}&apos;s Answer:
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: partnerAnswer ? 'inherit' : 'var(--ink-soft)',
                    fontStyle: partnerAnswer ? 'normal' : 'italic',
                  }}
                >
                  {partnerAnswer ||
                    `Awaiting ${partnerB} to share their response.`}
                </p>
              </div>

              {hostNote && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background:
                      'linear-gradient(135deg, #FFF5F8 0%, #FFFFFF 100%)',
                    border: '1.5px solid rgba(255, 77, 128, 0.25)',
                    fontSize: '13px',
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(255, 77, 128, 0.08)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>ʚ🤖💘ɞ</span>
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: '#FF4D80',
                        textTransform: 'uppercase',
                      }}
                    >
                      CUPIDOT&apos;S CHEEKY NOTE
                    </div>
                    <span style={{ fontStyle: 'italic', fontWeight: 600 }}>
                      &ldquo;{hostNote}&rdquo;
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleNext}
                className="btn btn-grad"
                style={{
                  padding: '12px',
                  fontSize: '15px',
                  justifyContent: 'center',
                }}
              >
                Next Honest Card ▷
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

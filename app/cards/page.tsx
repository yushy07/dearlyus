'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { SwipeDeck, GlowBadge, ScrollProgress, ScrollReveal } from '@/components/ui';
import { ScratchOffCard } from '@/components/cards/ScratchOffCard';

interface Card {
  tier: string;
  prompt: string;
  category: string;
}

const INITIAL_DECK: Card[] = [
  { tier: 'Level 1 · Warm Up', category: 'Playful', prompt: 'What is a small detail about me that you noticed recently and never said aloud?' },
  { tier: 'Level 1 · Warm Up', category: 'Habits', prompt: 'What is our funniest inside joke that nobody else in our lives would ever understand?' },
  { tier: 'Level 2 · Deep Water', category: 'Feelings', prompt: 'When is a moment during the distance when you felt closest to me, even miles apart?' },
  { tier: 'Level 2 · Deep Water', category: 'Vulnerability', prompt: 'What is a fear or worry you’ve had about our future that you haven’t fully shared yet?' },
  { tier: 'Level 3 · Raw Truth', category: 'Devotion', prompt: 'What makes you confident that every single mile of this distance will be worth it?' },
  { tier: 'Level 3 · Raw Truth', category: 'Love', prompt: 'How have you changed as a person since we fell in love?' },
];

export default function CardsPage() {
  const [deck, setDeck] = useState<Card[]>(INITIAL_DECK);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scratchMode, setScratchMode] = useState(true);
  const [myAnswer, setMyAnswer] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [hostNote, setHostNote] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Array<{ question: string; answerA: string; answerB: string }>>([]);

  const card = deck[currentIdx] || deck[0];

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % deck.length);
    setFlipped(false);
    setMyAnswer('');
    setPartnerAnswer('');
    setRevealed(false);
    setHostNote(null);
  };

  const handleReveal = () => {
    setRevealed(true);
    sounds.playCelebration();
    setPartnerAnswer(
      myAnswer
        ? 'I feel the exact same way. That one evening on call changed everything for me too.'
        : 'You bring so much light into my days.'
    );

    const currentRoundData = {
      question: card.prompt,
      answerA: myAnswer || 'Loving our late night talks',
      answerB: 'Feeling closest when we plan our future',
    };
    const updatedHistory = [...sessionHistory, currentRoundData];
    setSessionHistory(updatedHistory);

    // Fetch dynamic adaptive follow-up card connecting multi-round threads
    fetch('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerA: { name: 'Mia', answer: myAnswer || 'Loving our late night talks' },
        partnerB: { name: 'Alex', answer: 'Feeling closest when we plan our future' },
        mode: 'cards',
        mood: 'deep',
        history: updatedHistory,
      }),
    })
      .then((res) => res.json())
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
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>🎴 Honest Cards · <b>Vulnerable Conversations for Two Screens</b></>} />

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
            Card <b>{currentIdx + 1} / {deck.length}</b>
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Honest Cards · Realtime Connection</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            The questions you <span className="grad">keep avoiding</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            You both answer privately on your screens — then the card flips open at once.
          </p>
        </div>

        {/* Swipeable Card Stage with Scratch-Off Silver Foil */}
        <div style={{ perspective: '1200px', margin: '0 auto 28px', maxWidth: '520px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <button
              onClick={() => {
                sounds.playPop();
                setScratchMode(!scratchMode);
              }}
              style={{
                background: scratchMode ? 'var(--pink-tint)' : 'var(--paper-raised)',
                border: scratchMode ? '1.5px solid var(--pink)' : '1px solid var(--line)',
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
              <span>{scratchMode ? '✓ Silver Foil Scratch Mode' : 'Instant Card View'}</span>
            </button>
          </div>

          <SwipeDeck
            onSwipeRight={handleNext}
            onSwipeLeft={handleNext}
          >
            {scratchMode ? (
              <ScratchOffCard resetKey={currentIdx}>
                <div
                  onClick={() => {
                    setFlipped(!flipped);
                    sounds.playTick();
                  }}
                  className="card-3d"
                  style={{
                    background: 'linear-gradient(135deg, #FFFDFB, #F6F1EA)',
                    border: '2px solid var(--line)',
                    borderRadius: '20px',
                    padding: '48px 36px',
                    minHeight: '290px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(255,123,163,0.06)',
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
                    <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <GlowBadge text={`${card.tier} · ${card.category}`} size="sm" />
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                    <span>👆 Swipe left/right for next</span>
                    <span>{revealed ? '✓ Revealed' : 'Tap to flip'}</span>
                  </div>
                </div>
              </ScratchOffCard>
            ) : (
              <div
                onClick={() => {
                  setFlipped(!flipped);
                  sounds.playTick();
                }}
                className="card-3d"
                style={{
                  background: 'linear-gradient(135deg, #FFFDFB, #F6F1EA)',
                  border: '2px solid var(--line)',
                  borderRadius: '20px',
                  padding: '48px 36px',
                  minHeight: '290px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(255,123,163,0.06)',
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
                  <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <GlowBadge text={`${card.tier} · ${card.category}`} size="sm" />
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                  <span>👆 Swipe left/right for next</span>
                  <span>{revealed ? '✓ Revealed' : 'Tap to flip'}</span>
                </div>
              </div>
            )}
          </SwipeDeck>
        </div>

        {/* Inputs */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '24px' }}>
          {!revealed ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Your Private Answer (Mia):
                </label>
                <textarea
                  rows={3}
                  value={myAnswer}
                  onChange={(e) => setMyAnswer(e.target.value)}
                  placeholder="Type your honest thoughts... Alex cannot see until both lock in."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14.5px' }}
                />
              </div>
              <button
                onClick={handleReveal}
                disabled={!myAnswer.trim()}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '15px', justifyContent: 'center' }}
              >
                Lock In &amp; Reveal Answers 🔍
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pink)' }}>🌸 Mia&apos;s Answer:</div>
                <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: 1.5 }}>{myAnswer}</p>
              </div>
              <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--blue)' }}>💙 Alex&apos;s Answer:</div>
                <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: 1.5 }}>{partnerAnswer}</p>
              </div>

              {hostNote && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #FFF5F8 0%, #FFFFFF 100%)',
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
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', textTransform: 'uppercase' }}>
                      CUPIDOT&apos;S CHEEKY NOTE
                    </div>
                    <span style={{ fontStyle: 'italic', fontWeight: 600 }}>&ldquo;{hostNote}&rdquo;</span>
                  </div>
                </div>
              )}

              <button onClick={handleNext} className="btn btn-grad" style={{ padding: '12px', fontSize: '15px', justifyContent: 'center' }}>
                Next Honest Card ▷
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

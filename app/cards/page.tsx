'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Card {
  tier: string;
  prompt: string;
  category: string;
}

const DECK: Card[] = [
  { tier: 'Level 1 · Warm Up', category: 'Playful', prompt: 'What is a small detail about me that you noticed recently and never said aloud?' },
  { tier: 'Level 1 · Warm Up', category: 'Habits', prompt: 'What is our funniest inside joke that nobody else in our lives would ever understand?' },
  { tier: 'Level 2 · Deep Water', category: 'Feelings', prompt: 'When is a moment during the distance when you felt closest to me, even miles apart?' },
  { tier: 'Level 2 · Deep Water', category: 'Vulnerability', prompt: 'What is a fear or worry you’ve had about our future that you haven’t fully shared yet?' },
  { tier: 'Level 3 · Raw Truth', category: 'Devotion', prompt: 'What makes you confident that every single mile of this distance will be worth it?' },
  { tier: 'Level 3 · Raw Truth', category: 'Love', prompt: 'How have you changed as a person since we fell in love?' },
];

export default function CardsPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [myAnswer, setMyAnswer] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);

  const card = DECK[currentIdx];

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % DECK.length);
    setFlipped(false);
    setMyAnswer('');
    setPartnerAnswer('');
    setRevealed(false);
  };

  const handleReveal = () => {
    setRevealed(true);
    setPartnerAnswer(
      myAnswer
        ? 'I feel the exact same way. That one evening on call changed everything for me too.'
        : 'You bring so much light into my days.'
    );
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <Link className="btn btn-ghost" href="/activity">
            Activities ▷
          </Link>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Honest Cards · A Deck of Questions for Two</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            The questions you <span className="grad">keep avoiding</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            You both answer privately on your screens — then the card opens at once.
          </p>
        </div>

        {/* Card Stage */}
        <div style={{ perspective: '1000px', margin: '0 auto 28px', maxWidth: '520px' }}>
          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              background: 'linear-gradient(135deg, #FFFDFB, #F6F1EA)',
              border: '2px solid var(--line)',
              borderRadius: '20px',
              padding: '48px 36px',
              minHeight: '280px',
              boxShadow: 'var(--shadow-lg)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              position: 'relative',
              transition: 'transform 0.3s ease',
              transform: flipped ? 'scale(1.02)' : 'none',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#C9829C',
                  background: '#FFF',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: '1px solid #E7E1D8',
                }}
              >
                {card.tier}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '24px 0', lineHeight: 1.4, color: '#23242A' }}>
              {card.prompt}
            </h2>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-soft)' }}>
              Card {currentIdx + 1} of {DECK.length} · Tap to reflect
            </div>
          </div>
        </div>

        {/* Private Answer Boxes */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Your Private Answer (Mia):
            </label>
            <textarea
              rows={3}
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Type your honest answer here... partner cannot see until you both reveal!"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid var(--line)',
                fontFamily: 'inherit',
                fontSize: '14.5px',
                resize: 'none',
              }}
            />
          </div>

          {!revealed ? (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-grad"
                onClick={handleReveal}
                disabled={!myAnswer.trim()}
                style={{ padding: '12px 28px', fontSize: '15px' }}
              >
                Reveal Together ▷
              </button>
              <button className="btn btn-ghost" onClick={handleNext}>
                Skip to Next Card
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--blue)', marginBottom: '4px' }}>
                  Alex&apos;s Answer:
                </div>
                <p style={{ fontSize: '15px', color: '#17181C', margin: 0 }}>{partnerAnswer}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleNext} style={{ padding: '12px 28px' }}>
                  Next Honest Card ▷
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface MatchQuestion {
  title: string;
  category: string;
  options: { text: string; trait: string }[];
}

const QUESTIONS: MatchQuestion[] = [
  {
    title: 'How do you prefer to spend a Saturday evening together on FaceTime?',
    category: 'Vibe & Energy',
    options: [
      { text: 'Deep uninterrupted conversation for hours with dim lighting', trait: 'Intimacy' },
      { text: 'Playing games, laughing loud and being goofy', trait: 'Playfulness' },
      { text: 'Co-working / reading in quiet, comforting presence', trait: 'Harmony' },
      { text: 'Planning future trips, itineraries, and big dreams', trait: 'Ambition' },
    ],
  },
  {
    title: 'When you disagree, what is your instinctive approach?',
    category: 'Communication',
    options: [
      { text: 'Talk it out immediately until everything is resolved', trait: 'Direct' },
      { text: 'Take a short breath to reflect, then discuss calmly', trait: 'Measured' },
      { text: 'Use gentle humor to diffuse tension first', trait: 'Playfulness' },
      { text: 'Write a heartfelt note explaining your feelings', trait: 'Intimacy' },
    ],
  },
  {
    title: 'What represents your ultimate long-distance comfort ritual?',
    category: 'Love Language',
    options: [
      { text: 'Falling asleep with the call on all night', trait: 'Intimacy' },
      { text: 'Surprise food delivery or care packages in the mail', trait: 'Thoughtful' },
      { text: 'Waking up to a long romantic morning voice memo', trait: 'Affirmation' },
      { text: 'Having a countdown widget on both home screens', trait: 'Devotion' },
    ],
  },
  {
    title: 'What is your shared dream aesthetic for your first real apartment together?',
    category: 'Future Vision',
    options: [
      { text: 'Cozy plants, books, warm lamps, and espresso machine', trait: 'Cozy' },
      { text: 'Modern minimalist, big windows, and sunset view', trait: 'Modern' },
      { text: 'Artistic, colorful, full of travel souvenirs & prints', trait: 'Creative' },
      { text: 'A big kitchen with a huge dining table for hosting', trait: 'Warmth' },
    ],
  },
];

export default function MatchPage() {
  const [qIndex, setQIndex] = useState(0);
  const [partner1Picks, setPartner1Picks] = useState<number[]>([]);
  const [partner2Picks, setPartner2Picks] = useState<number[]>([]);
  const [activePartner, setActivePartner] = useState<1 | 2>(1);
  const [calculated, setCalculated] = useState(false);

  const handlePick = (optionIndex: number) => {
    if (activePartner === 1) {
      setPartner1Picks([...partner1Picks, optionIndex]);
      if (qIndex + 1 < QUESTIONS.length) {
        setQIndex(qIndex + 1);
      } else {
        // Switch to partner 2
        setActivePartner(2);
        setQIndex(0);
      }
    } else {
      const nextPicks = [...partner2Picks, optionIndex];
      setPartner2Picks(nextPicks);
      if (qIndex + 1 < QUESTIONS.length) {
        setQIndex(qIndex + 1);
      } else {
        setCalculated(true);
      }
    }
  };

  const calculateScore = () => {
    let matches = 0;
    for (let i = 0; i < QUESTIONS.length; i++) {
      if (partner1Picks[i] === partner2Picks[i]) matches += 1;
    }
    return 88 + matches * 3;
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
          <span className="eyebrow">Love Match · Personality Compatibility</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            Calculate your <span className="grad">LDR synergy score</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Answer 4 quick romance &amp; communication questions to discover your harmony profile.
          </p>
        </div>

        {!calculated ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: activePartner === 1 ? 'var(--pink)' : 'var(--blue)',
                }}
              >
                {activePartner === 1 ? '🌸 Player 1 (Mia) Answering' : '🔷 Player 2 (Alex) Answering'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                Question {qIndex + 1} of {QUESTIONS.length}
              </span>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '6px' }}>
              {QUESTIONS[qIndex].category}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
              {QUESTIONS[qIndex].title}
            </h2>

            <div style={{ display: 'grid', gap: '10px' }}>
              {QUESTIONS[qIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePick(idx)}
                  className="act"
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    textAlign: 'left',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'var(--paper-raised)',
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Results Breakdown */
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span style={{ fontSize: '52px' }}>✨</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '14px 0 6px' }}>
              Electric Soul Connection
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '64px',
                fontWeight: 900,
                background: 'linear-gradient(100deg, var(--pink), var(--blue))',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {calculateScore()}% Match
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                margin: '28px 0',
                textAlign: 'left',
              }}
            >
              <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--pink)' }}>Intimacy &amp; Care</strong>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>98%</div>
                <small style={{ color: 'var(--ink-soft)' }}>Exceptional warmth</small>
              </div>
              <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--blue)' }}>Banter &amp; Play</strong>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>95%</div>
                <small style={{ color: 'var(--ink-soft)' }}>Endless laughter</small>
              </div>
              <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#7a4dd6' }}>Future Alignment</strong>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>96%</div>
                <small style={{ color: 'var(--ink-soft)' }}>Shared life goals</small>
              </div>
            </div>

            <p style={{ color: 'var(--ink-soft)', fontSize: '15px', lineHeight: 1.6, maxWidth: '50ch', margin: '0 auto 28px' }}>
              Your communication style handles distance gracefully. You both prioritize quality presence and reassurance,
              making the separation feel small compared to your bond.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-grad"
                onClick={() => {
                  setPartner1Picks([]);
                  setPartner2Picks([]);
                  setActivePartner(1);
                  setQIndex(0);
                  setCalculated(false);
                }}
              >
                Retake Quiz ↺
              </button>
              <Link className="btn btn-ghost" href="/photobooth">
                Celebrate in Photobooth 📸
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

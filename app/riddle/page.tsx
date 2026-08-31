'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Riddle {
  riddle: string;
  hint: string;
  answer: string;
  explanation: string;
}

const RIDDLES: Riddle[] = [
  {
    riddle: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
    hint: 'Think about something couples use to measure the distance between them.',
    answer: 'A Map',
    explanation: 'A map shows cities, terrain, and oceans, but no physical objects!',
  },
  {
    riddle: 'What travels around the entire world while staying in a single corner?',
    hint: 'Something on a romantic handwritten love letter.',
    answer: 'A Postage Stamp',
    explanation: 'A stamp stays on the corner of the envelope while journeying across the world!',
  },
  {
    riddle: 'The more you take, the more you leave behind. What are they?',
    hint: 'Think about walking along the beach.',
    answer: 'Footsteps',
    explanation: 'Every step you take leaves another footprint behind!',
  },
  {
    riddle: 'What comes once in a minute, twice in a moment, but never in a thousand years?',
    hint: 'Look closely at the letters in the words.',
    answer: 'The letter M',
    explanation: 'The letter M appears 1 time in "minute", 2 times in "moment", 0 in "thousand years"!',
  },
];

export default function RiddlePage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);

  const riddle = RIDDLES[currentIdx];

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setSolved(true);
    setScore((p) => p + 1);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % RIDDLES.length);
    setShowHint(false);
    setUserAnswer('');
    setSolved(false);
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
          <span className="eyebrow">Riddle Night · Co-op Mystery Date</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Talk it out, <span className="grad">solve together</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Classic brain teasers made for two voices on a late-night call.
          </p>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
              Riddle {currentIdx + 1} of {RIDDLES.length}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#0a7d4d', fontWeight: 700 }}>
              Solved: {score}
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.4, marginBottom: '24px', textAlign: 'center' }}>
            &ldquo;{riddle.riddle}&rdquo;
          </h2>

          {showHint && (
            <div
              style={{
                background: 'var(--paper)',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                marginBottom: '20px',
                fontSize: '14px',
                color: 'var(--ink-soft)',
              }}
            >
              💡 <b>Hint:</b> {riddle.hint}
            </div>
          )}

          {!solved ? (
            <form onSubmit={handleCheck} style={{ display: 'grid', gap: '14px' }}>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your guess here..."
                required
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--line)',
                  fontFamily: 'inherit',
                  fontSize: '15px',
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button type="submit" className="btn btn-grad" style={{ padding: '12px 28px' }}>
                  Submit Answer ▷
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowHint(true)}>
                  Need a Hint?
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0a7d4d', marginBottom: '6px' }}>
                Answer: {riddle.answer}
              </h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', marginBottom: '20px' }}>
                {riddle.explanation}
              </p>
              <button className="btn btn-primary" onClick={handleNext} style={{ padding: '12px 28px' }}>
                Next Riddle ▷
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

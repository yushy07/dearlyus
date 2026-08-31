'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface IQQuestion {
  title: string;
  pattern: string[];
  options: string[];
  correctIndex: number;
}

const IQ_PUZZLES: IQQuestion[] = [
  {
    title: 'Pattern Sequence: What comes next in the geometric progression?',
    pattern: ['🟢 🔷', '🔷 🔺', '🔺 🟨', '🟨 ❓'],
    options: ['⭐', '🟢', '🔷', '🔺'],
    correctIndex: 1,
  },
  {
    title: 'Logical Deduction: If all Roses are Flowers, and some Flowers fade quickly, then:',
    pattern: ['All roses fade quickly', 'No roses fade quickly', 'Some roses may fade quickly', 'None of the above'],
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    correctIndex: 2,
  },
  {
    title: 'Number Matrix: 2, 4, 8, 16, 32, [ ? ]',
    pattern: ['2 → 4 (+2)', '4 → 8 (x2)', '8 → 16 (x2)', '32 → ?'],
    options: ['48', '64', '56', '72'],
    correctIndex: 1,
  },
];

export default function IQPage() {
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const puzzle = IQ_PUZZLES[qIndex];

  const handlePick = (index: number) => {
    setSelectedOpt(index);
    if (index === puzzle.correctIndex) {
      setScore((p) => p + 1);
    }
    setTimeout(() => {
      if (qIndex + 1 < IQ_PUZZLES.length) {
        setQIndex(qIndex + 1);
        setSelectedOpt(null);
      } else {
        setFinished(true);
      }
    }, 600);
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
          <span className="eyebrow">IQ Duel · Head to Head Puzzles</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Same puzzles, <span className="grad">against the clock</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Test your logic and spatial intelligence in real time together.
          </p>
        </div>

        {!finished ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '36px 28px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                Puzzle {qIndex + 1} of {IQ_PUZZLES.length}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--blue)', fontWeight: 700 }}>
                Score: {score} Points
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>{puzzle.title}</h2>

            <div
              style={{
                background: 'var(--paper)',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '22px',
                marginBottom: '24px',
                border: '1px solid var(--line)',
                display: 'grid',
                gap: '8px',
              }}
            >
              {puzzle.pattern.map((p, i) => (
                <div key={i}>{p}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {puzzle.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handlePick(i)}
                  className="btn btn-ghost"
                  style={{
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    background: selectedOpt === i ? 'var(--blue-tint)' : '#fff',
                    borderColor: selectedOpt === i ? 'var(--blue)' : 'var(--line)',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '40px 28px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🧠</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800 }}>IQ Duel Completed!</h2>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '56px',
                fontWeight: 900,
                color: 'var(--blue)',
                margin: '10px 0',
              }}
            >
              IQ 132 · Genius Match
            </div>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '24px' }}>
              You solved {score} out of {IQ_PUZZLES.length} puzzles correctly with lightning speed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-grad"
                onClick={() => {
                  setQIndex(0);
                  setScore(0);
                  setFinished(false);
                }}
              >
                Play Again ↺
              </button>
              <Link className="btn btn-ghost" href="/activity">
                Back to Activities
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

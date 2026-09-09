'use client';

import { BrandLogo } from '@/components/shared/BrandLogo';
import React, { useState } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { Confetti } from '@/components/shared/Confetti';

interface RiddleItem {
  question: string;
  hint: string;
  answer: string;
  explanation: string;
}

const RIDDLES: RiddleItem[] = [
  {
    question:
      'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
    hint: 'Couples in long-distance love look at me often to track the miles between them.',
    answer: 'A map',
    explanation:
      'A map depicts geography, borders, and oceans without physical people or structures!',
  },
  {
    question: 'What can travel around the world while staying in a corner?',
    hint: 'It goes on romantic snail mail postcards and letters.',
    answer: 'A postage stamp',
    explanation:
      'A postage stamp stays tucked in the corner of an envelope as it travels across oceans!',
  },
  {
    question:
      'What comes once in a minute, twice in a moment, but never in a thousand years?',
    hint: 'Look closely at the letters in the words.',
    answer: 'The letter M',
    explanation:
      'The letter M appears 1 time in "minute", 2 times in "moment", 0 in "thousand years"!',
  },
];

export default function RiddlePage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);

  const riddle = RIDDLES[currentIdx];

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (solved) return;

    const cleanUser = userAnswer
      .trim()
      .toLowerCase()
      .replace(/^(a|an|the)\s+/, '');
    const cleanAns = riddle.answer.toLowerCase().replace(/^(a|an|the)\s+/, '');

    const isCorrect =
      cleanUser.length > 0 &&
      (cleanAns.includes(cleanUser) ||
        cleanUser.includes(cleanAns) ||
        (cleanAns.includes('stamp') && cleanUser.includes('stamp')) ||
        (cleanAns.includes('letter m') &&
          (cleanUser === 'm' || cleanUser.includes('m'))));

    if (isCorrect) {
      setSolved(true);
      setErrorMsg('');
      setScore((p) => p + 1);
      sounds.playCelebration();
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 3000);
    } else {
      setErrorMsg('Not quite! Check the hint below and try another guess 💭');
      setShowHint(true);
      sounds.playCountdownBeep(true);
    }
  };

  const handleNext = () => {
    sounds.playPop();
    setCurrentIdx((prev) => (prev + 1) % RIDDLES.length);
    setShowHint(false);
    setUserAnswer('');
    setErrorMsg('');
    setSolved(false);
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
      <Confetti active={confettiActive} />

      <header className="bar">
        <div
          className="wrap"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              className="brand"
              href="/"
              onClick={() => sounds.playPop()}
              aria-label="Dearly Us Home"
            >
              <BrandLogo tone="light" />
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: 'var(--paper-raised)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>
                {partnerA} &amp; {partnerB}:
              </span>{' '}
              <b style={{ color: 'var(--pink)' }}>{score} solved</b>
            </span>

            <Link
              className="btn btn-ghost"
              href="/activity"
              onClick={() => sounds.playPop()}
            >
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Riddle Night · Co-op Mystery Date</span>
          <h1
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}
          >
            Talk it out, <span className="grad">solve together</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Classic brain teasers made for two voices on a late-night call.
          </p>
        </div>

        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--ink-soft)',
              }}
            >
              Riddle {currentIdx + 1} of {RIDDLES.length}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#0a7d4d',
                fontWeight: 700,
              }}
            >
              Solved: {score}
            </span>
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1.4,
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            &ldquo;{riddle.question}&rdquo;
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
            <form
              onSubmit={handleCheck}
              style={{ display: 'grid', gap: '14px' }}
            >
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
              {errorMsg && (
                <div
                  style={{
                    color: '#d9486c',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {errorMsg}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="submit"
                  className="btn btn-grad"
                  style={{ padding: '12px 28px' }}
                >
                  Submit Answer ▷
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowHint(true)}
                >
                  Need a Hint?
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#0a7d4d',
                  marginBottom: '6px',
                }}
              >
                Answer: {riddle.answer}
              </h3>
              <p
                style={{
                  color: 'var(--ink-soft)',
                  fontSize: '14.5px',
                  marginBottom: '20px',
                }}
              >
                {riddle.explanation}
              </p>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                style={{ padding: '12px 28px' }}
              >
                Next Riddle ▷
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

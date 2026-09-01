'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QUIZ_PACKS } from '@/data';
import { QuizPack } from '@/types';
import { Ribbon, Navbar } from '@/components/shared';

export default function QuizPage() {
  const [selectedPack, setSelectedPack] = useState<QuizPack>(QUIZ_PACKS[0]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [miaPick, setMiaPick] = useState<number | null>(null);
  const [alexPick, setAlexPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [matches, setMatches] = useState<number>(0);
  const [finished, setFinished] = useState(false);

  const currentQ = selectedPack.questions[currentQIndex];

  const handleNext = () => {
    if (currentQIndex + 1 < selectedPack.questions.length) {
      setCurrentQIndex(currentQIndex + 1);
      setMiaPick(null);
      setAlexPick(null);
      setRevealed(false);
    } else {
      setFinished(true);
    }
  };

  const handleReveal = () => {
    if (miaPick === null || alexPick === null) return;
    setRevealed(true);
    if (miaPick === alexPick) {
      setMatches((prev) => prev + 1);
    }
  };

  const restartQuiz = (pack: Pack) => {
    setSelectedPack(pack);
    setCurrentQIndex(0);
    setMiaPick(null);
    setAlexPick(null);
    setRevealed(false);
    setMatches(0);
    setFinished(false);
  };

  const matchPercent = Math.round((matches / selectedPack.questions.length) * 100);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      <Ribbon text={<>❓ Know Me Quiz · <b>How Well Do You Know Each Other?</b> · 17 Packs Free on Angie</>} />

      <Navbar
        rightAction={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              background: 'var(--paper-raised)',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
            }}
          >
            Pack: <b>{selectedPack.name}</b>
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '860px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Know Me Quiz · How Well Do You Know Me?</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', marginBottom: '10px' }}>
            Lock in privately, <span className="grad">reveal together</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Mia answers honestly, Alex guesses what she chose. Then flip to see if you match!
          </p>
        </div>

        {/* Pack Selector Chips */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
          {QUIZ_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => restartQuiz(pack)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedPack.id === pack.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: selectedPack.id === pack.id ? '#FFF' : 'var(--paper-raised)',
                color: 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: selectedPack.id === pack.id ? 'var(--shadow)' : 'none',
              }}
            >
              {pack.name} {pack.badge && <span className="badge hot" style={{ marginLeft: '4px' }}>{pack.badge}</span>}
            </button>
          ))}
        </div>

        {!finished ? (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                Question {currentQIndex + 1} of {selectedPack.questions.length}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#0a7d4d', fontWeight: 700 }}>
                Score: {matches} Matches
              </span>
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '28px', color: '#17181C' }}>
              {currentQ.q}
            </h2>

            {/* Dual Screen Answer Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Phone: Mia */}
              <div
                style={{
                  background: '#FFF8FA',
                  border: '2px solid var(--pink-tint)',
                  borderTop: '4px solid var(--pink)',
                  borderRadius: '14px',
                  padding: '20px 16px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--pink)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Mia · Answers Honestly
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => !revealed && setMiaPick(i)}
                      disabled={revealed}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: miaPick === i ? '2px solid var(--pink)' : '1px solid var(--line)',
                        background: miaPick === i ? 'var(--pink)' : '#fff',
                        color: miaPick === i ? '#fff' : '#17181C',
                        fontWeight: 600,
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: revealed ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 700, color: miaPick !== null ? '#0a7d4d' : '#8B8E98' }}>
                  {miaPick !== null ? '✓ Locked in privately' : 'Waiting for answer...'}
                </div>
              </div>

              {/* Right Phone: Alex */}
              <div
                style={{
                  background: '#F6FAFF',
                  border: '2px solid var(--blue-tint)',
                  borderTop: '4px solid var(--blue)',
                  borderRadius: '14px',
                  padding: '20px 16px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Alex · Guesses Her Answer
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => !revealed && setAlexPick(i)}
                      disabled={revealed}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: alexPick === i ? '2px solid var(--blue)' : '1px solid var(--line)',
                        background: alexPick === i ? 'var(--blue)' : '#fff',
                        color: alexPick === i ? '#fff' : '#17181C',
                        fontWeight: 600,
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: revealed ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 700, color: alexPick !== null ? '#0a7d4d' : '#8B8E98' }}>
                  {alexPick !== null ? '✓ Locked in privately' : 'Waiting for guess...'}
                </div>
              </div>
            </div>

            {/* Reveal / Match Result */}
            {revealed && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: miaPick === alexPick ? '#eafaf1' : '#FFF0F5',
                  border: `1px solid ${miaPick === alexPick ? '#bfe6d2' : '#FFD1DF'}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 800, color: miaPick === alexPick ? '#0a7d4d' : '#D15B76' }}>
                  {miaPick === alexPick ? '🎉 Match! You know each other so well!' : '😅 Missed this one! Good thing to learn today!'}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center', gap: '14px' }}>
              {!revealed ? (
                <button
                  className="btn btn-grad"
                  disabled={miaPick === null || alexPick === null}
                  onClick={handleReveal}
                  style={{ padding: '12px 32px', fontSize: '16px' }}
                >
                  Reveal Answers Together ▷
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleNext} style={{ padding: '12px 32px', fontSize: '16px' }}>
                  {currentQIndex + 1 < selectedPack.questions.length ? 'Next Question ▷' : 'See Final Score 🏆'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Final Scorecard */
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '40px 28px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span style={{ fontSize: '48px' }}>💞</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '14px 0 8px' }}>
              {matchPercent >= 80 ? 'Soulmate Connection!' : matchPercent >= 50 ? 'Strong LDR Bond!' : 'Lots of Fun Discoveries!'}
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '56px',
                fontWeight: 900,
                background: 'linear-gradient(100deg, var(--pink), var(--blue))',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: '10px 0',
              }}
            >
              {matchPercent}% Compatibility
            </div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '44ch', margin: '0 auto 28px' }}>
              You got {matches} out of {selectedPack.questions.length} answers matched! Every date brings you two closer together across the miles.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-grad" onClick={() => restartQuiz(selectedPack)}>
                Play Again ↺
              </button>
              <Link className="btn btn-ghost" href="/photobooth">
                Take a Photobooth Picture 📸
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

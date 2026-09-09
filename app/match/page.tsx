'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import { CoupleNameBar } from '@/components/shared';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';

interface MatchQuestion {
  title: string;
  category: string;
  options: { text: string; trait: string }[];
}

const QUESTIONS: MatchQuestion[] = [
  {
    title:
      'How do you prefer to spend a Saturday evening together on FaceTime?',
    category: 'Vibe & Energy',
    options: [
      {
        text: 'Deep uninterrupted conversation for hours with dim lighting',
        trait: 'Intimacy',
      },
      {
        text: 'Playing games, laughing loud and being goofy',
        trait: 'Playfulness',
      },
      {
        text: 'Co-working / reading in quiet, comforting presence',
        trait: 'Harmony',
      },
      {
        text: 'Planning future trips, itineraries, and big dreams',
        trait: 'Ambition',
      },
    ],
  },
  {
    title: 'When you disagree, what is your instinctive approach?',
    category: 'Communication',
    options: [
      {
        text: 'Talk it out immediately until everything is resolved',
        trait: 'Direct',
      },
      {
        text: 'Take a short breath to reflect, then discuss calmly',
        trait: 'Measured',
      },
      {
        text: 'Use gentle humor to diffuse tension first',
        trait: 'Playfulness',
      },
      {
        text: 'Write a heartfelt note explaining your feelings',
        trait: 'Intimacy',
      },
    ],
  },
  {
    title: 'What represents your ultimate long-distance comfort ritual?',
    category: 'Love Language',
    options: [
      { text: 'Falling asleep with the call on all night', trait: 'Intimacy' },
      {
        text: 'Surprise food delivery or care packages in the mail',
        trait: 'Thoughtful',
      },
      {
        text: 'Waking up to a long romantic morning voice memo',
        trait: 'Affirmation',
      },
      {
        text: 'Having a countdown widget on both home screens',
        trait: 'Devotion',
      },
    ],
  },
  {
    title:
      'What is your shared dream aesthetic for your first real apartment together?',
    category: 'Future Vision',
    options: [
      {
        text: 'Cozy plants, books, warm lamps, and espresso machine',
        trait: 'Cozy',
      },
      {
        text: 'Modern minimalist, big windows, and sunset view',
        trait: 'Modern',
      },
      {
        text: 'Artistic, colorful, full of travel souvenirs & prints',
        trait: 'Creative',
      },
      {
        text: 'A big kitchen with a huge dining table for hosting',
        trait: 'Warmth',
      },
    ],
  },
];

export default function MatchPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const [qIndex, setQIndex] = useState(0);
  const [partner1Picks, setPartner1Picks] = useState<number[]>([]);
  const [partner2Picks, setPartner2Picks] = useState<number[]>([]);
  const [activePartner, setActivePartner] = useState<1 | 2>(1);
  const [calculated, setCalculated] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const runtime = useActivityRuntime({
    sessionId: `mock-match-${roomCode || 'local'}`,
    activityType: 'match',
    roomId: roomCode || 'local',
    transportMode: 'mock',
    initialOptions: { totalPairs: QUESTIONS.length },
  });

  useEffect(() => {
    const snapshot = runtime.snapshot as {
      pairIndex?: number;
      score?: number;
      completed?: boolean;
    };
    if (typeof snapshot.pairIndex === 'number')
      setQIndex(Math.min(snapshot.pairIndex, QUESTIONS.length - 1));
    if (typeof snapshot.score === 'number') setMatchCount(snapshot.score);
    if (snapshot.completed) setCalculated(true);
  }, [runtime.snapshot]);

  const handlePick = (optionIndex: number) => {
    void runtime.sendEvent('match_select', {
      optionIndex,
      partner: activePartner,
    });
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
        let matches = 0;
        for (let i = 0; i < QUESTIONS.length; i++) {
          if (partner1Picks[i] === nextPicks[i]) matches += 1;
        }
        setMatchCount(matches);
        void runtime.sendEvent('match_reveal', { isMatch: matches > 0 });
        void runtime.sendEvent('match_next', {});
        setCalculated(true);
      }
    }
  };

  return (
    <div
      style={{
        background: 'var(--paper)',
        minHeight: '100vh',
        paddingBottom: '80px',
      }}
    >
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            dearly us
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
          <CoupleNameBar />
          <h1
            style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}
          >
            Calculate your <span className="grad">LDR synergy score</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Answer 4 quick romance &amp; communication questions to discover
            your harmony profile.
          </p>
        </div>

        {!calculated ? (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: activePartner === 1 ? 'var(--pink)' : 'var(--blue)',
                }}
              >
                {activePartner === 1
                  ? `🌸 ${partnerA} Answering`
                  : `🔷 ${partnerB} Answering`}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--ink-soft)',
                }}
              >
                Question {qIndex + 1} of {QUESTIONS.length}
              </span>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
                marginBottom: '6px',
              }}
            >
              {QUESTIONS[qIndex].category}
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                marginBottom: '24px',
              }}
            >
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
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span style={{ fontSize: '52px' }}>✨</span>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 800,
                margin: '14px 0 6px',
              }}
            >
              Round Summary
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '44px',
                fontWeight: 900,
                background: 'var(--grad-primary)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '8px',
              }}
            >
              {matchCount} of {QUESTIONS.length} Picks Aligned
            </div>
            <p
              style={{
                color: 'var(--ink-soft)',
                fontSize: '14px',
                margin: '0 auto 24px',
                maxWidth: '52ch',
                lineHeight: 1.5,
              }}
            >
              Matching choices are fun to discover, and different answers make
              for the best conversations. No grades, no relationship evaluation.
            </p>

            {/* Breakdown of each question */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                margin: '0 0 28px',
                textAlign: 'left',
              }}
            >
              {QUESTIONS.map((q, idx) => {
                const pick1 = partner1Picks[idx];
                const pick2 = partner2Picks[idx];
                const isMatch =
                  pick1 !== undefined && pick2 !== undefined && pick1 === pick2;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--ink-soft)',
                        }}
                      >
                        {q.category} · Question {idx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: isMatch
                            ? 'rgba(5, 150, 105, 0.1)'
                            : 'rgba(107, 114, 128, 0.1)',
                          color: isMatch ? '#059669' : 'var(--ink-soft)',
                        }}
                      >
                        {isMatch ? '✨ Both Matched' : '💬 Different Takes'}
                      </span>
                    </div>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        color: 'var(--ink)',
                      }}
                    >
                      {q.title}
                    </strong>
                    {isMatch ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: 'var(--ink)',
                        }}
                      >
                        Both picked:{' '}
                        <em>&ldquo;{q.options[pick1]?.text}&rdquo;</em>
                      </p>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gap: '4px',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--pink)' }}>
                            {partnerA}:
                          </strong>{' '}
                          <em>
                            &ldquo;{q.options[pick1]?.text ?? 'Not answered'}
                            &rdquo;
                          </em>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--blue)' }}>
                            {partnerB}:
                          </strong>{' '}
                          <em>
                            &ldquo;{q.options[pick2]?.text ?? 'Not answered'}
                            &rdquo;
                          </em>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
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
                Play Again ↺
              </button>
              <Link className="btn btn-ghost" href="/our-space">
                Return to Our Space 🏡
              </Link>
              <Link className="btn btn-ghost" href="/activity">
                Explore More Activities ▷
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

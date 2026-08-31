'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Question {
  q: string;
  options: string[];
  honestAnswerIndex: number;
}

interface Pack {
  id: string;
  name: string;
  badge?: string;
  description: string;
  questions: Question[];
}

const PACKS: Pack[] = [
  {
    id: 'starter',
    name: 'Cute Starter Pack',
    badge: '★ Popular',
    description: 'Lighthearted, fun questions about daily favorites and habits.',
    questions: [
      {
        q: "What's Mia's go-to karaoke song? 🎤",
        options: ['Bohemian Rhapsody 🎸', 'Something by IU 🎧', 'Rap god, allegedly 🎤', 'Love Story by Taylor 💖'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is our ultimate comfort food on video calls? 🍜',
        options: ['Late-night spicy ramen 🌶️', 'Hot cheese pizza 🍕', 'Boba milk tea 🧋', 'Tacos & fries 🍟'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Who usually falls asleep on the call first? 😴',
        options: ['Definitely Mia 🌸', 'Always Alex 🌙', 'Simultaneous pass out 💤', 'Neither, we talk until 4am ☕'],
        honestAnswerIndex: 1,
      },
      {
        q: 'What is our dream reunion city? ✈️',
        options: ['Tokyo in Cherry Blossom season 🌸', 'Paris along the Seine 🥐', 'Seoul late-night street food 🍢', 'Cozy cabin in Banff 🏔️'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What makes Mia laugh until she cries? 😂',
        options: ['Terrible puns & dad jokes 🃏', 'Awkward video call lags 📶', 'Funny animal TikToks 🐱', 'Alex doing bad voice impressions 🎭'],
        honestAnswerIndex: 3,
      },
    ],
  },
  {
    id: 'deep',
    name: 'Deep & Intimate',
    badge: 'New',
    description: 'Vulnerable questions about feelings, fears, and devotion.',
    questions: [
      {
        q: 'When did you first realize you were in love? 💘',
        options: ['The 6-hour phone call that felt like 5 minutes', 'When we had to say goodbye at the airport', 'A random Tuesday laughing together', 'Before we even met in person'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is the hardest part about long distance for us? 🌍',
        options: ['Not being able to hug after a hard day', 'Time zone math and bedtime difference', 'Missing shared meals & routines', 'Counting down months between visits'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is something you admire most about your partner? 💎',
        options: ['Unwavering kindness and warmth', 'Drive, ambition & intelligence', 'Sense of humor through tough days', 'Patience & understanding'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is our favorite love language? 💌',
        options: ['Words of affirmation & long texts', 'Quality time on FaceTime', 'Receiving surprise care packages', 'Physical touch (when together)'],
        honestAnswerIndex: 1,
      },
      {
        q: 'Where do you see us 3 years from now? 🏡',
        options: ['Living in the same city with a cute dog', 'Married and traveling the world', 'Cooking dinner together every night', 'All of the above! ✨'],
        honestAnswerIndex: 3,
      },
    ],
  },
  {
    id: 'spicy',
    name: 'Spicy & Wild 🔥',
    badge: '18+',
    description: 'Exciting, cheeky questions for date night after dark.',
    questions: [
      {
        q: 'What is the first thing we do the second we reunite at the airport? 💋',
        options: ['The longest kiss in history', 'Drop bags and run into each other’s arms', 'Go eat spicy food together', 'Stare in disbelief for 10 seconds'],
        honestAnswerIndex: 1,
      },
      {
        q: 'What is the most attractive thing Alex wears on camera? 👀',
        options: ['Messy morning hair & oversized hoodie', 'Clean crisp white shirt', 'Cozy glasses & beanie', 'Sweatpants & smile'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Who is the bigger flirt when we text? 😏',
        options: ['Mia with cute emojis & hints', 'Alex with smooth late-night lines', 'Equal flirty chaos', 'Whoever is caffeinated'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Favorite late-night conversation topic? 🌙',
        options: ['Romantic future fantasies', 'Deep 3am philosophical secrets', 'Funny gossip from our day', 'Planning next hotel dates'],
        honestAnswerIndex: 0,
      },
    ],
  },
];

export default function QuizPage() {
  const [selectedPack, setSelectedPack] = useState<Pack>(PACKS[0]);
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
      {/* Header */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            <Link className="btn btn-ghost" href="/activity">
              All Activities ▷
            </Link>
          </div>
        </div>
      </header>

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
          {PACKS.map((pack) => (
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

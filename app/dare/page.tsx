'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const MINIGAMES = [
  { id: 'tap', name: '⚡ Fast Tap Duel', desc: 'Tap as fast as you can in 5 seconds — highest click count wins!' },
  { id: 'reaction', name: '🎯 Reaction Rush', desc: 'Wait for green, tap first! React in under 300ms.' },
  { id: 'coin', name: '🪙 Coin Flip', desc: 'Heads or tails — simple, dramatic fate.' },
  { id: 'dice', name: '🎲 High Rollers', desc: 'Roll twin dice — highest sum takes the round.' },
  { id: 'rps', name: '✂️ Rock Paper Scissors', desc: 'Best of 3 classic showdown on camera.' },
  { id: 'timer', name: '⏱️ Stop on 5.00s', desc: 'Close your eyes and try to stop the timer exactly at 5.00 seconds.' },
];

const TRUTHS = [
  'What is the most embarrassing photo in your camera roll right now? (Show it to the camera!)',
  'What was your honest first impression of me the very first day we talked?',
  'What is one secret cheesy romantic thought you had about me recently?',
  'If we had 24 hours together with no budget anywhere on earth, what would you plan?',
  'What is a silly habit of mine that you secretly find adorable?',
  'What is one song that always makes you think of me no matter where you are?',
];

const DARES = [
  'Sing a 15-second love song to me in your most dramatic opera voice on FaceTime!',
  'Do your best, most hilarious impression of me when I am hungry or tired.',
  'Send a voice memo saying the sweetest thing you can think of in 10 seconds without pausing.',
  'Let me pick a funny filter and you have to keep it on your camera for the next 3 rounds.',
  'Text me a screenshot of your screen time today without cropping!',
  'Post a cute candid photo of us or of me on your story with a funny caption.',
];

export default function DarePage() {
  const [selectedGame, setSelectedGame] = useState(MINIGAMES[0]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'result'>('idle');
  const [tapCount, setTapCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [partnerLoser, setPartnerLoser] = useState<'You' | 'Partner'>('Partner');
  const [activeCardType, setActiveCardType] = useState<'truth' | 'dare' | null>(null);
  const [cardPrompt, setCardPrompt] = useState<string>('');

  const startTapBattle = () => {
    setGameState('playing');
    setTapCount(0);
    setTimeLeft(5);

    let sec = 5;
    const interval = setInterval(() => {
      sec -= 1;
      setTimeLeft(sec);
      if (sec <= 0) {
        clearInterval(interval);
        setGameState('result');
        // Randomly decide or base on score
        setPartnerLoser(Math.random() > 0.5 ? 'Partner' : 'You');
      }
    }, 1000);
  };

  const pickTruth = () => {
    setActiveCardType('truth');
    const random = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    setCardPrompt(random);
  };

  const pickDare = () => {
    setActiveCardType('dare');
    const random = DARES[Math.floor(Math.random() * DARES.length)];
    setCardPrompt(random);
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

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Truth or Dare · 20 Minigames</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Lose the minigame, <span className="grad">pick your fate</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Battle through tiny competitive minigames on camera. The loser faces a hilarious Truth or Dare!
          </p>
        </div>

        {/* Minigames Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
          {MINIGAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                setSelectedGame(game);
                setGameState('idle');
                setActiveCardType(null);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: selectedGame.id === game.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: selectedGame.id === game.id ? '#fff' : 'var(--paper-raised)',
                fontWeight: 700,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {game.name}
            </button>
          ))}
        </div>

        {/* Minigame Arena */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{selectedGame.name}</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '24px' }}>{selectedGame.desc}</p>

          {gameState === 'idle' && (
            <div style={{ padding: '30px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
              <button className="btn btn-grad" onClick={startTapBattle} style={{ padding: '14px 32px', fontSize: '17px' }}>
                Start Round ▷
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 900, color: 'var(--pink)', marginBottom: '14px' }}>
                00:0{timeLeft}s
              </div>
              <button
                onClick={() => setTapCount((p) => p + 1)}
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--pink), var(--blue))',
                  color: '#fff',
                  border: 'none',
                  fontSize: '28px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-lg)',
                  transform: 'scale(1)',
                }}
              >
                TAP!<br />{tapCount}
              </button>
            </div>
          )}

          {gameState === 'result' && !activeCardType && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>💥</div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
                {partnerLoser} Lost the Round!
              </h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '24px' }}>
                Choose your punishment below:
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                <button
                  className="btn"
                  onClick={pickTruth}
                  style={{ background: '#7A4DD6', color: '#fff', padding: '12px 28px', fontSize: '16px' }}
                >
                  💡 Pick Truth
                </button>
                <button
                  className="btn"
                  onClick={pickDare}
                  style={{ background: '#E84A74', color: '#fff', padding: '12px 28px', fontSize: '16px' }}
                >
                  🔥 Pick Dare
                </button>
              </div>
            </div>
          )}

          {activeCardType && (
            <div
              style={{
                marginTop: '20px',
                padding: '24px',
                borderRadius: '12px',
                background: activeCardType === 'truth' ? '#F3EEFC' : '#FFF0F5',
                border: `2px solid ${activeCardType === 'truth' ? '#7A4DD6' : '#FF7BA3'}`,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: activeCardType === 'truth' ? '#7A4DD6' : '#E84A74',
                }}
              >
                {activeCardType === 'truth' ? '💡 TRUTH FOR LOSER' : '🔥 DARE FOR LOSER'}
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, margin: '14px 0', lineHeight: 1.5 }}>
                {cardPrompt}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '18px' }}>
                <button className="btn btn-primary" onClick={() => setGameState('idle')}>
                  Next Round ↺
                </button>
                <button className="btn btn-ghost" onClick={activeCardType === 'truth' ? pickTruth : pickDare}>
                  Draw Another Card 🃏
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

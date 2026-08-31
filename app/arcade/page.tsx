'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ArcadePage() {
  const [activeGame, setActiveGame] = useState<'jump' | 'dodge' | 'catch'>('jump');
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);

  const startMiniGame = () => {
    setPlaying(true);
    setScore(0);
    const interval = setInterval(() => {
      setScore((s) => s + 10);
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setPlaying(false);
    }, 6000);
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
          <span className="eyebrow">Arcade · Ten Tiny Games For Two</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            Your face, <span className="grad">ten tiny games</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Quick retro mini-games played with camera motion and button mashing.
          </p>
        </div>

        <div
          style={{
            background: '#17181C',
            color: '#fff',
            border: '2px solid #33353D',
            borderRadius: '20px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Game Select */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            {[
              { id: 'jump', name: '🦘 Heart Jump' },
              { id: 'dodge', name: '🚀 Asteroid Dodge' },
              { id: 'catch', name: '🍓 Berry Catch' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id as any)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: activeGame === g.id ? '2px solid var(--pink)' : '1px solid #444',
                  background: activeGame === g.id ? 'rgba(255,123,163,0.2)' : '#23242A',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Arcade Screen */}
          <div
            style={{
              height: '240px',
              background: '#0B0C0E',
              border: '2px solid #282A33',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '24px',
            }}
          >
            {playing ? (
              <div style={{ animation: 'bounce 0.6s infinite' }}>
                <span style={{ fontSize: '48px' }}>💖</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--blue)', marginTop: '8px' }}>
                  Score: {score}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>👾</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#8B8E98' }}>
                  Press Start to play {activeGame.toUpperCase()}!
                </div>
                {score > 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--pink)', marginTop: '6px' }}>
                    Final Score: {score} PTS
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="btn btn-grad"
            onClick={startMiniGame}
            disabled={playing}
            style={{ padding: '14px 36px', fontSize: '16px' }}
          >
            {playing ? 'Playing...' : 'Insert Coin & Start ▶'}
          </button>
        </div>
      </main>
    </div>
  );
}

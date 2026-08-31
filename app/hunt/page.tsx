'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const PROMPTS = [
  'Find: Something pink or heart-shaped in your room! 💖',
  'Find: A gift or item your partner gave you! 🎁',
  'Find: Your coziest hoodie or sweater! 🧥',
  'Find: The most delicious snack in your kitchen! 🍪',
  'Find: A book or souvenir that reminds you of your partner! 📖',
];

export default function HuntPage() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [hunting, setHunting] = useState(false);
  const [snapped, setSnapped] = useState(false);

  const startHunt = () => {
    setHunting(true);
    setSnapped(false);
    setSeconds(60);
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
          <span className="eyebrow">Snap Hunt · 60s Room Scavenger</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            Race to find it, <span className="grad">snap it</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            A fast-paced home scavenger hunt. Cleverest find takes the point!
          </p>
        </div>

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
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '18px' }}>
            {PROMPTS[promptIdx]}
          </h2>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '44px', fontWeight: 900, color: 'var(--pink)', marginBottom: '24px' }}>
            {hunting ? `00:${String(seconds).padStart(2, '0')}` : '60 Seconds'}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {!hunting ? (
              <button className="btn btn-grad" onClick={startHunt} style={{ padding: '12px 28px' }}>
                Start Scavenger Hunt ▷
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setHunting(false);
                  setSnapped(true);
                }}
                style={{ padding: '12px 28px' }}
              >
                📸 I Found It! Show On Camera
              </button>
            )}

            <button
              className="btn btn-ghost"
              onClick={() => {
                setPromptIdx((p) => (p + 1) % PROMPTS.length);
                setHunting(false);
                setSnapped(false);
              }}
            >
              New Clue ▷
            </button>
          </div>

          {snapped && (
            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                borderRadius: '10px',
                background: '#eafaf1',
                border: '1px solid #bfe6d2',
                color: '#0a7d4d',
                fontWeight: 700,
              }}
            >
              🎉 Round Captured! Award 1 point to the fastest partner!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

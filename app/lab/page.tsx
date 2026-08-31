'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LabPage() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'rain' | 'cafe' | 'lofi' | 'off'>('rain');
  const [sessionNotes, setSessionNotes] = useState('Mia studying Marketing · Alex coding web app 💻');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

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
          <span className="eyebrow">The Lab · LDR Study Date &amp; Focus Mode</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Study together, <span className="grad">miles apart</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Pomodoro focus timer, ambient soundscapes, and synchronized work presence.
          </p>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Big Timer */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(56px, 10vw, 84px)',
              fontWeight: 900,
              color: '#17181C',
              letterSpacing: '-.02em',
              marginBottom: '16px',
            }}
          >
            {timeStr}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
            <button
              className="btn btn-grad"
              onClick={() => setIsRunning(!isRunning)}
              style={{ padding: '12px 32px', fontSize: '16px' }}
            >
              {isRunning ? 'Pause Focus ⏸️' : 'Start Focus Session ▷'}
            </button>
            <button className="btn btn-ghost" onClick={() => setSeconds(25 * 60)}>
              Reset 25m
            </button>
          </div>

          {/* Ambient Sounds */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px', marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
              Select Ambient Audio Atmosphere:
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { id: 'rain', name: '🌧️ Cozy Rainy Window' },
                { id: 'cafe', name: '☕ Paris Coffeehouse' },
                { id: 'lofi', name: '🎧 Lo-Fi Chill Beats' },
                { id: 'off', name: '🔇 Muted Silence' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: ambientSound === s.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                    background: ambientSound === s.id ? 'var(--pink-tint)' : 'var(--paper)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Shared Note */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Shared Session Intentions:
            </label>
            <input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

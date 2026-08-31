'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const TOPICS = [
  'Is pineapple on pizza an acceptable culinary choice?',
  'Who is the objectively better navigator when traveling in a new city?',
  'Are aliens real and do they have romantic long-distance relationships too?',
  'Should the bed have 2 pillows or 6 decorative throw pillows?',
  'Is leaving 2% battery on your phone considered living dangerously?',
];

export default function DebatePage() {
  const [topicIndex, setTopicIndex] = useState(0);
  const [timer, setTimer] = useState(60);
  const [activeSpeaker, setActiveSpeaker] = useState<'Mia' | 'Alex'>('Mia');
  const [debating, setDebating] = useState(false);

  const startDebate = () => {
    setDebating(true);
    setTimer(60);
  };

  const nextTopic = () => {
    setTopicIndex((prev) => (prev + 1) % TOPICS.length);
    setDebating(false);
    setTimer(60);
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
          <span className="eyebrow">Couples Debate · AI Scored Debate</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            Argue it out, <span className="grad">crown a winner</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            60-second timed argument rounds with camera on.
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
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>
            Topic #{topicIndex + 1}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', lineHeight: 1.3 }}>
            &ldquo;{TOPICS[topicIndex]}&rdquo;
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                background: activeSpeaker === 'Mia' ? 'var(--pink-tint)' : 'var(--paper)',
                border: activeSpeaker === 'Mia' ? '2px solid var(--pink)' : '1px solid var(--line)',
                padding: '20px',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--pink)', marginBottom: '4px' }}>Mia</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>PRO Position</div>
            </div>

            <div
              style={{
                background: activeSpeaker === 'Alex' ? 'var(--blue-tint)' : 'var(--paper)',
                border: activeSpeaker === 'Alex' ? '2px solid var(--blue)' : '1px solid var(--line)',
                padding: '20px',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--blue)', marginBottom: '4px' }}>Alex</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>CON Position</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-grad" onClick={startDebate} style={{ padding: '12px 28px' }}>
              {debating ? `Speaking (${activeSpeaker}): ${timer}s` : 'Start 60s Round 🎙️'}
            </button>
            <button className="btn btn-ghost" onClick={nextTopic}>
              New Topic ▷
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

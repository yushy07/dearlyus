'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PREMADE_DATE_PLANS } from '@/data';
import { Ribbon, Navbar } from '@/components/shared';

export default function DateNightPlannerPage() {
  const [selectedMood, setSelectedMood] = useState<'romantic' | 'playful' | 'chill'>('romantic');
  const plan = PREMADE_DATE_PLANS[selectedMood];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      {/* Ribbon */}
      <Ribbon text={<>🌙 Date Night Generator · <b>Curated Multi-Activity Schedules for Two</b></>} />

      {/* Top Navbar */}
      <Navbar
        rightAction={
          <Link className="btn btn-ghost" href="/activity" style={{ padding: '6px 12px', fontSize: '13px' }}>
            All 24 Activities ▷
          </Link>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '880px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="eyebrow">Date Night Architect</span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '8px 0' }}>
            Never Ask <span className="grad">&ldquo;What should we do?&rdquo;</span> Again.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '54ch', margin: '0 auto' }}>
            Pick tonight&apos;s mood and time limit. Angie builds a seamless itinerary of synced games, prompts, and photobooth milestones.
          </p>
        </div>

        {/* Mood Selector Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[
            { id: 'romantic', label: '🕯️ Romantic & Vulnerable', desc: 'Deep conversation & intimacy' },
            { id: 'playful', label: '⚡ Playful & Competitive', desc: 'High energy & laughs' },
            { id: 'chill', label: '☕ Chill & Low Energy', desc: 'Late night winding down' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id as any)}
              className={`btn ${selectedMood === m.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '10px 20px', borderRadius: '10px' }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Generated Itinerary Card */}
        <div className="booth-box" style={{ padding: '32px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <div>
              <span className="badge hot" style={{ marginBottom: '6px' }}>{plan.mood}</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800 }}>{plan.name}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--pink)' }}>{plan.duration}</span>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Total Date Length</div>
            </div>
          </div>

          {/* Activity Sequence Timeline */}
          <div style={{ display: 'grid', gap: '14px', marginBottom: '28px' }}>
            {plan.activities.map((act, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--paper)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '28px' }}>{act.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>
                      Step {idx + 1}: {act.title}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)' }}>{act.desc}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)' }}>
                    {act.time}
                  </span>
                  <Link className="btn btn-ghost" href={act.href} style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                    Start ▷
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Date Night Extras Bar */}
          <div
            style={{
              background: 'var(--paper)',
              padding: '16px 20px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                Recommended Soundtrack:
              </span>
              <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px' }}>🎵 {plan.spotifyPlaylist}</div>
            </div>

            <Link className="btn btn-grad" href={plan.activities[0].href} style={{ padding: '10px 24px' }}>
              Launch Full Date Night (Step 1) ▷
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

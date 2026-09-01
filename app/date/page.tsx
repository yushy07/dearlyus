'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface DatePlan {
  name: string;
  duration: string;
  mood: string;
  activities: { title: string; desc: string; href: string; icon: string; time: string }[];
  spotifyPlaylist: string;
}

const PREMADE_PLANS: Record<string, DatePlan> = {
  romantic: {
    name: 'Candlelight & Deep Chemistry',
    duration: '90 mins',
    mood: 'Romantic & Vulnerable',
    activities: [
      { title: 'Honest Cards Deck', desc: 'Break open deep questions you’ve never asked.', href: '/cards', icon: '💌', time: '25 min' },
      { title: 'Synced Photobooth', desc: 'Vintage 1930s Automat style with warm candle lighting.', href: '/photobooth', icon: '📸', time: '15 min' },
      { title: 'Letters to the Future', desc: 'Seal a time-capsule letter to read in 3 years.', href: '/letter', icon: '🕊️', time: '30 min' },
      { title: 'Our Future Vision Board', desc: 'Map out your dream home and honeymoon trip.', href: '/future', icon: '🏡', time: '20 min' },
    ],
    spotifyPlaylist: 'Cozy LDR Acoustic Love',
  },
  playful: {
    name: 'Chaotic Arcade & Runway Duel',
    duration: '60 mins',
    mood: 'Playful & Competitive',
    activities: [
      { title: 'Couples Quiz Duel', desc: 'Who knows who best? 17 packs with zero mercy.', href: '/quiz', icon: '❓', time: '20 min' },
      { title: 'Fashion Show Runway', desc: 'Outrageous styling briefs judged by AI.', href: '/fashion', icon: '👗', time: '20 min' },
      { title: 'Arcade Face Battle', desc: 'Flappy Face and Tetris showdown with real face avatars.', href: '/arcade', icon: '🕹️', time: '20 min' },
    ],
    spotifyPlaylist: 'Upbeat Indie Pop & Laughter',
  },
  chill: {
    name: 'Lazy Sunday Bed-Date',
    duration: '45 mins',
    mood: 'Low-Energy & Cozy',
    activities: [
      { title: 'Draw Together', desc: 'Pass the digital canvas back and forth.', href: '/draw', icon: '🎨', time: '20 min' },
      { title: 'Riddle Night', desc: 'Solve 10 clever brain-teasers side by side.', href: '/riddle', icon: '🧩', time: '15 min' },
      { title: 'Digital Scrapbook', desc: 'Paste recent photos and tape polaroids together.', href: '/scrapbook', icon: '📖', time: '10 min' },
    ],
    spotifyPlaylist: 'Lo-Fi Chillhop Beats for LDR',
  },
};

export default function DateNightPlannerPage() {
  const [selectedMood, setSelectedMood] = useState<'romantic' | 'playful' | 'chill'>('romantic');
  const [customMinutes, setCustomMinutes] = useState(60);
  const plan = PREMADE_PLANS[selectedMood];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      {/* Ribbon */}
      <div className="ribbon">
        <span className="ribbon-in">
          🌙 Date Night Generator · <b>Curated Multi-Activity Schedules for Two</b>
        </span>
      </div>

      {/* Top Navbar */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link className="btn btn-ghost" href="/activity" style={{ padding: '6px 12px', fontSize: '13px' }}>
              All 20+ Activities ▷
            </Link>
          </div>
        </div>
      </header>

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

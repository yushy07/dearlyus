'use client';

import React from 'react';
import Link from 'next/link';

export default function AugustPage() {
  return (
    <div style={{ background: '#FFFBF6', minHeight: '100vh', color: '#23242A', paddingBottom: '80px' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid #E7E1D8',
          background: 'rgba(255, 251, 246, 0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '66px' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700 }}>
            get<span style={{ color: '#C9829C' }}>Angie</span>
          </Link>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <Link href="/activity" style={{ fontSize: '14px', fontWeight: 600, color: '#6B6C76' }}>
              Activities
            </Link>
            <Link href="/photobooth" className="btn" style={{ background: '#23242A', color: '#fff', padding: '8px 16px', fontSize: '13px' }}>
              Open Booth
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '40px', maxWidth: '820px' }}>
        {/* Main Campaign Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7E1D8',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '360px', background: '#F6F1EA' }}>
            <img src="/august/gate.webp" alt="Girlfriends day romantic garden gate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.95)',
                color: '#7A3552',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                boxShadow: 'var(--shadow)',
              }}
            >
              August 1 · Girlfriends Day
            </span>
          </div>

          <div style={{ padding: '36px 32px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: '#C9829C',
              }}
            >
              The Full Evening Plan
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 4vw, 44px)',
                fontWeight: 400,
                lineHeight: 1.1,
                margin: '12px 0 16px',
              }}
            >
              The <em>Couples Day Date</em> — a whole evening, already planned.
            </h1>
            <p style={{ color: '#6B6C76', fontSize: '17px', lineHeight: 1.6, marginBottom: '24px' }}>
              Seven things to play together in one shared room, from two cities. It starts easy, gets honest, and ends with the two of you designing matching shirts you both wear.
            </p>

            {/* 7 Itinerary Steps */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #E7E1D8', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Your 7-Step Date Itinerary:</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {[
                  { num: '01', title: 'Online Photobooth', desc: 'Warm up with cute poses in the 인생네컷 4-cut frame.' },
                  { num: '02', title: 'Love Match Quiz', desc: 'Personality synergy check across 16 romance dimensions.' },
                  { num: '03', title: 'Riddle Night Co-op', desc: 'Solve cooperative brain teasers and funny puzzles together.' },
                  { num: '04', title: 'Know Me Quiz', desc: 'Lock in secret answers to see who knows who better.' },
                  { num: '05', title: 'Couples Debate', desc: 'Playful AI-judged courtroom debate on your fun relationship habits.' },
                  { num: '06', title: 'Honest Cards Deck', desc: 'Deep talk and intimate questions to melt the distance away.' },
                  { num: '07', title: 'Design Matching Shirts', desc: 'Draw and compose custom matching couple shirts shipped to both doors.' },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr',
                      gap: '14px',
                      padding: '12px 14px',
                      background: '#FFFBF6',
                      border: '1px solid #E7E1D8',
                      borderRadius: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#C9829C', fontSize: '15px' }}>
                      {item.num}
                    </span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '15px' }}>{item.title}</strong>
                      <span style={{ fontSize: '13px', color: '#6B6C76' }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: '32px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/photobooth" className="btn" style={{ background: '#23242A', color: '#fff', padding: '14px 28px', fontSize: '16px' }}>
                Start Girlfriends Day Date ▷
              </Link>
              <Link href="/activity" className="btn btn-ghost">
                Explore All Games
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

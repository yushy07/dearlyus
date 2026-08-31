'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ScrapbookPage() {
  const [stickers] = useState(['🌸', '✨', '💖', '💌', '📸']);
  const [note, setNote] = useState('Our 6-Month Anniversary Call · August 2026. Still counting the days until we see each other at the gate.');

  return (
    <div style={{ background: '#F8F5EE', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="bar" style={{ background: '#F8F5EE' }}>
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

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '820px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Digital Scrapbook · Memory Journal</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Your strips on paper, <span className="grad">with handwritten notes</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Tape down your 4-cut photobooth sessions, write memories, and decorate with washi tape.
          </p>
        </div>

        {/* Vintage Paper Notebook Sheet */}
        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid #E2D9C8',
            borderRadius: '16px',
            padding: '40px 36px',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            backgroundImage: 'linear-gradient(#E8E2D5 1px, transparent 1px)',
            backgroundSize: '100% 32px',
          }}
        >
          {/* Washi Tape Decors */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50px',
              width: '90px',
              height: '24px',
              background: 'rgba(255,123,163,0.5)',
              transform: 'rotate(-4deg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              right: '50px',
              width: '90px',
              height: '24px',
              background: 'rgba(95,160,255,0.5)',
              transform: 'rotate(5deg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              gap: '32px',
              alignItems: 'start',
            }}
          >
            {/* Taped Photo Strip */}
            <div
              style={{
                background: '#FFFFFF',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #D8CFC0',
                boxShadow: 'var(--shadow-soft)',
                transform: 'rotate(-2deg)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
                <img src="/photos/frame1.webp" alt="Scrapbook 1" style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                <img src="/photos/frame2.webp" alt="Scrapbook 2" style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                <img src="/photos/frame3.webp" alt="Scrapbook 3" style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                <img src="/photos/frame4.webp" alt="Scrapbook 4" style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-soft)' }}>
                CALGARY ♡ JAKARTA
              </div>
            </div>

            {/* Handwritten Journal Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {stickers.map((s, i) => (
                  <span key={i} style={{ fontSize: '24px' }}>
                    {s}
                  </span>
                ))}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '18px',
                  lineHeight: '32px',
                  fontFamily: 'var(--font-serif)',
                  color: '#2A2A33',
                  resize: 'none',
                }}
              />

              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button className="btn btn-grad" onClick={() => alert('Scrapbook page saved!')}>
                  Save Page 💾
                </button>
                <Link className="btn btn-ghost" href="/photobooth">
                  Add New Photo Strip 📸
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

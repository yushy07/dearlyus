'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function BirthdayPage() {
  const [partnerName, setPartnerName] = useState('Mia');
  const [customMsg, setCustomMsg] = useState('Happy Birthday my love! Even with 10,000 miles between us, you are the closest thing to my heart.');
  const [revealed, setRevealed] = useState(false);

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
          <span className="eyebrow">Birthday Gift Page · Sealed in Heart QR</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            A personalized gift page, <span className="grad">made for them</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Generate a romantic birthday landing page with photo strips, music, and a scannable heart QR code.
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '40px 32px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {!revealed ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Birthday Person&apos;s Name:
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Birthday Wish Message:
                </label>
                <textarea
                  rows={4}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontFamily: 'inherit',
                    resize: 'none',
                  }}
                />
              </div>

              <button className="btn btn-grad" onClick={() => setRevealed(true)} style={{ justifyContent: 'center', padding: '14px' }}>
                Generate Birthday Page &amp; QR Code 🎂
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎂✨🎉</div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '10px 0' }}>
                Happy Birthday, {partnerName}!
              </h2>
              <p style={{ fontSize: '17px', color: '#3A3B45', lineHeight: 1.6, maxWidth: '44ch', margin: '0 auto 28px' }}>
                &ldquo;{customMsg}&rdquo;
              </p>

              {/* Heart QR Code Visual Mock */}
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  margin: '0 auto 20px',
                  background: 'var(--pink-tint)',
                  border: '2px dashed var(--pink)',
                  borderRadius: '16px',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px' }}>💖</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--pink)', fontWeight: 700 }}>
                    SCAN WITH CAMERA
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => alert('Gift link copied to clipboard!')}>
                  Copy Gift Link 🔗
                </button>
                <button className="btn btn-ghost" onClick={() => setRevealed(false)}>
                  Edit Message ✏️
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

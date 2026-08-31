'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LetterPage() {
  const [unlockDate, setUnlockDate] = useState('2027-08-01');
  const [letterContent, setLetterContent] = useState('');
  const [sealed, setSealed] = useState(false);

  const handleSeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterContent.trim()) return;
    setSealed(true);
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
          <span className="eyebrow">Letters to the Future · Time Capsule</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Write now, <span className="grad">open years from now</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            A sealed time-capsule letter delivered to both of your inboxes on your chosen reunion anniversary.
          </p>
        </div>

        {!sealed ? (
          <form
            onSubmit={handleSeal}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
              display: 'grid',
              gap: '20px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Delivery Unlock Date:
              </label>
              <input
                type="date"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--line)',
                  fontFamily: 'inherit',
                  fontSize: '15px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Dear Future Us (Letter Content):
              </label>
              <textarea
                rows={8}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                required
                placeholder="Write what you love about your partner right now, your hopes for when the distance ends, and memories of this exact season of your lives..."
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--line)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  lineHeight: 1.6,
                  resize: 'none',
                }}
              />
            </div>

            <button type="submit" className="btn btn-grad" style={{ justifyContent: 'center', padding: '14px', fontSize: '16px' }}>
              Seal Capsule with Wax Stamp 💌
            </button>
          </form>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🔒💌</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
              Sealed Until {new Date(unlockDate).toLocaleDateString()}
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '44ch', margin: '0 auto 24px' }}>
              Your time-capsule letter has been encrypted and locked. We will send an email reminder to both of you when the time arrives!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setSealed(false)}>
                Write Another Letter
              </button>
              <Link className="btn btn-primary" href="/activity">
                Explore More Dates
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

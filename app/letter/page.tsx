'use client';

import React, { useState } from 'react';
import { Ribbon, Navbar, Confetti } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { WaxSealEnvelope, ScrollProgress, ScrollReveal, GlowBadge } from '@/components/ui';

interface SealedCapsule {
  id: string;
  title: string;
  author: string;
  unlockDate: string;
  content: string;
  stamp: string;
}

export default function LetterPage() {
  const [unlockDate, setUnlockDate] = useState('2027-08-01');
  const [letterTitle, setLetterTitle] = useState('To Us on Our 2-Year Anniversary 💌');
  const [letterContent, setLetterContent] = useState(
    'If you are reading this, we have officially closed the distance. Remember the late night video calls, the airport goodbyes, and how we promised each other this day would come? I love you more than ever.'
  );
  const [stamp, setStamp] = useState('🌸');
  const [confettiActive, setConfettiActive] = useState(false);
  const [activeCapsule, setActiveCapsule] = useState<SealedCapsule | null>(null);

  // Vault state
  const [vault, setVault] = useState<SealedCapsule[]>([
    {
      id: '1',
      title: 'Our 1st Anniversary Time Capsule',
      author: 'Mia ♡ Alex',
      unlockDate: '2026-10-15',
      content: 'Locked in the digital vault. Only accessible when the countdown timer hits zero.',
      stamp: '💖',
    },
    {
      id: '2',
      title: 'The Day We Close the Distance',
      author: 'Alex',
      unlockDate: '2027-05-20',
      content: 'A secret letter written on a late night flight home.',
      stamp: '✈️',
    },
  ]);

  const [sealedSuccessfully, setSealedSuccessfully] = useState(false);

  const handleSeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterContent.trim() || !letterTitle.trim()) return;

    const newCapsule: SealedCapsule = {
      id: Date.now().toString(),
      title: letterTitle,
      author: 'Mia & Alex',
      unlockDate,
      content: letterContent,
      stamp,
    };

    setVault([...vault, newCapsule]);
    setSealedSuccessfully(true);
    sounds.playCelebration();
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>💌 Letters to the Future · <b>Multi-Year Time Capsule Vault with Timestamp Locks</b></>} />
      <Confetti active={confettiActive} />

      <Navbar
        rightAction={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              background: 'var(--paper-raised)',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
            }}
          >
            Vault: <b>{vault.length} Sealed Letters</b>
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '840px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Letters to the Future · Time Capsule</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Write now, <span className="grad">open years from now</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            A sealed time-capsule letter locked cryptographically until your chosen reunion date or anniversary.
          </p>
        </div>

        {!sealedSuccessfully ? (
          <form
            onSubmit={handleSeal}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
              display: 'grid',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Letter Envelope Title:
              </label>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '15px', fontWeight: 700 }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Unlock Milestone Date:
                </label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Wax Stamp Seal:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['🌸', '💖', '💍', '🕊️', '✈️', '💌'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStamp(s)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: stamp === s ? '2px solid var(--pink)' : '1px solid var(--line)',
                        background: stamp === s ? 'var(--pink-tint)' : '#fff',
                        fontSize: '18px',
                        cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Dear Future Us (Letter Body):
              </label>
              <textarea
                rows={6}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                placeholder="Write your heartfelt thoughts, dreams, and promises to read years from now..."
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '15px', lineHeight: 1.6 }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '15px', justifyContent: 'center' }}>
              🔒 Seal Envelope into Time Capsule Vault
            </button>
          </form>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: '40px',
            }}
          >
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔒 {stamp}</span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Envelope Sealed in Vault!</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '46ch', margin: '0 auto 24px' }}>
              Your time capsule letter <b>&ldquo;{letterTitle}&rdquo;</b> has been securely locked until <b>{unlockDate}</b>.
            </p>
            <button onClick={() => setSealedSuccessfully(false)} className="btn btn-ghost">
              + Write Another Letter
            </button>
          </div>
        )}

        {/* Interactive 3D Wax Seal Envelope Stage */}
        <div style={{ marginBottom: '40px' }} id="seal-stage">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <GlowBadge text="Interactive 3D Vault Stage" size="sm" />
          </div>
          <WaxSealEnvelope
            key={activeCapsule ? activeCapsule.id : 'default'}
            sender={activeCapsule ? activeCapsule.author : 'Mia (Calgary)'}
            recipient="Alex (Jakarta)"
            sealDate={activeCapsule ? `Locked until ${activeCapsule.unlockDate}` : 'Locked until 2-Year Anniversary'}
            letterContent={
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', marginBottom: '14px', color: '#2B231E' }}>
                  {activeCapsule ? activeCapsule.title : 'Dear Alex, on the day we close the distance ♡'}
                </h3>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', lineHeight: 1.7, color: '#4A3E34', whiteSpace: 'pre-line' }}>
                  {activeCapsule
                    ? activeCapsule.content
                    : `If you are reading this, every late-night flight, every airport hug, and every time zone hour was worth it.\nI loved you through 11,420 kilometers, and I love you even more today right next to you.\n\nForever yours,\nMia ♡`}
                </p>
              </div>
            }
          />
        </div>

        {/* The Sealed Time Capsule Vault */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Sealed Vault Envelopes ({vault.length})</h3>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Tap any letter to inspect seal 👆</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {vault.map((capsule) => (
              <div
                key={capsule.id}
                onClick={() => {
                  sounds.playPop();
                  setActiveCapsule(capsule);
                  const el = document.getElementById('seal-stage');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="card-3d"
                style={{
                  background: activeCapsule?.id === capsule.id ? 'var(--pink-tint)' : '#FFFFFF',
                  border: activeCapsule?.id === capsule.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: 'var(--shadow)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{capsule.stamp}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--pink)', fontWeight: 800 }}>
                    🔒 Locked until {capsule.unlockDate}
                  </span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '4px 0' }}>{capsule.title}</h4>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Written by: {capsule.author}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

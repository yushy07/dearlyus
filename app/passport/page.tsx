'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { PASSPORT_STAMPS, PassportStamp, getUnlockedStamps, unlockPassportStamp } from '@/lib/passport';
import { sounds } from '@/lib/sound';
import { ShinyText, ScrollReveal } from '@/components/ui';

export default function PassportPage() {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedStamp, setSelectedStamp] = useState<PassportStamp | null>(null);
  const [animatingStampId, setAnimatingStampId] = useState<string | null>(null);
  const [coupleNames, setCoupleNames] = useState({ partner1: 'Mia', partner2: 'Alex' });
  const [roomCode, setRoomCode] = useState('KX7RM');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setUnlockedIds(getUnlockedStamps());

    if (typeof window !== 'undefined') {
      try {
        const savedN1 = localStorage.getItem('angie_user_nickname') || 'Mia';
        const savedN2 = localStorage.getItem('angie_partner_nickname') || 'Alex';
        const savedRoom = localStorage.getItem('angie_room_code') || 'KX7RM';
        setCoupleNames({ partner1: savedN1, partner2: savedN2 });
        setRoomCode(savedRoom);
      } catch {}
    }
  }, []);

  const handleStampClick = (stamp: PassportStamp, isUnlocked: boolean) => {
    sounds.playStampThud();
    if (isUnlocked) {
      setAnimatingStampId(stamp.id);
      setTimeout(() => setAnimatingStampId(null), 600);
      setSelectedStamp(stamp);
    } else {
      // Prompt quick unlock demonstration
      unlockPassportStamp(stamp.id);
      setUnlockedIds(getUnlockedStamps());
      setAnimatingStampId(stamp.id);
      setTimeout(() => setAnimatingStampId(null), 600);
    }
  };

  const categories = ['All', 'Photobooth', 'Games & Duels', 'Keepsakes', 'Milestones'];

  const filteredStamps = activeCategory === 'All'
    ? PASSPORT_STAMPS
    : PASSPORT_STAMPS.filter((s) => s.category === activeCategory);

  const totalCount = PASSPORT_STAMPS.length;
  const unlockedCount = unlockedIds.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const rankTier =
    unlockedCount >= 10
      ? '👑 Legendary Soulmate Explorers'
      : unlockedCount >= 6
      ? '✈️ Global Date Masters'
      : unlockedCount >= 3
      ? '🌸 Adventurous Duo'
      : '🌱 Date Night Novices';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--line)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="brand" style={{ fontSize: '22px', fontWeight: 900 }}>
              angie
              <span className="dots" style={{ marginLeft: '4px' }}>
                <i className="p" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--pink)', marginRight: '3px' }}></i>
                <i className="b" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)' }}></i>
              </span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/activity"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--ink-soft)',
                textDecoration: 'none',
                padding: '6px 12px',
              }}
            >
              All Activities ▷
            </Link>
            <Link
              href="/photobooth"
              className="btn btn-grad"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                padding: '8px 18px',
                borderRadius: '20px',
              }}
            >
              Open Photobooth 📷
            </Link>
          </div>
        </div>
      </header>

      {/* Main Passport Content */}
      <main style={{ flex: 1, padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header Banner */}
          <ScrollReveal animation="fade-up">
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--pink-tint)',
                  border: '1px solid rgba(255, 123, 163, 0.4)',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--pink)',
                  fontWeight: 700,
                }}
              >
                <span>💮</span>
                <span>대한민국 · OFFICIAL COUPLE SOUVENIR PASSPORT</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Couple Date Passport &amp; Stamps
              </h1>
              <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '560px', lineHeight: 1.6 }}>
                Collect authentic Korean rubber ink stamps for every date you complete across timezones. Tap any stamp to stamp your book!
              </p>
            </div>
          </ScrollReveal>

          {/* Passport Booklet Card */}
          <ScrollReveal animation="fade-up">
            <div className="passport-leather-cover" style={{ padding: '32px 28px', color: '#FFFFFF' }}>
              {/* Gold Crest & Passport Title */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '20px',
                  paddingBottom: '24px',
                  borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(253, 230, 138, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%)',
                      border: '2px solid #D4AF37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    🌸
                  </div>
                  <div>
                    <div className="passport-gold-text" style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '2px', fontWeight: 800 }}>
                      ANGIE REPUBLIC OF LOVE
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.2px' }}>
                      {coupleNames.partner1} &amp; {coupleNames.partner2}
                    </div>
                  </div>
                </div>

                {/* Passport Serial & Room Code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.6)' }}>
                    PASSPORT NO.
                  </div>
                  <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FDE68A', letterSpacing: '1px' }}>
                    ANG-{roomCode}-2026
                  </div>
                  <div style={{ fontSize: '11px', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>●</span>
                    <span>{rankTier}</span>
                  </div>
                </div>
              </div>

              {/* Passport Progress Bar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Souvenir Stamp Progress ({unlockedCount}/{totalCount} Completed)
                  </span>
                  <span style={{ color: '#FDE68A', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {progressPercent}% Complete
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #FF7BA3, #FFA07A, #FDE68A)',
                      borderRadius: '4px',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sounds.playPop();
                  setActiveCategory(cat);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: activeCategory === cat ? '1px solid var(--pink)' : '1px solid var(--line)',
                  background: activeCategory === cat ? 'var(--pink)' : '#FFFFFF',
                  color: activeCategory === cat ? '#FFFFFF' : 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: activeCategory === cat ? '0 4px 14px rgba(255, 123, 163, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stamps Grid (12 Collectibles) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredStamps.map((stamp) => {
              const isUnlocked = unlockedIds.includes(stamp.id);
              const isAnimating = animatingStampId === stamp.id;

              return (
                <div
                  key={stamp.id}
                  className={`passport-page-cream passport-stamp-badge ${isAnimating ? 'stamp-ink-effect' : ''}`}
                  onClick={() => handleStampClick(stamp, isUnlocked)}
                  style={{
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '210px',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  {/* Top Category Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        color: 'var(--ink-soft)',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {stamp.category}
                    </span>
                    {isUnlocked ? (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#059669',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 800,
                        }}
                      >
                        ✓ STAMPED
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'rgba(0,0,0,0.04)',
                          color: 'var(--ink-soft)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                        }}
                      >
                        🔒 TAP TO UNLOCK
                      </span>
                    )}
                  </div>

                  {/* Stamp Center: Stamp Ink Seal Emblem */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '14px 0' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: stamp.sealShape === 'circle' ? '50%' : stamp.sealShape === 'square' ? '12px' : '16px',
                        border: isUnlocked ? `3px dashed ${stamp.inkColor}` : '2px dashed #CBD5E1',
                        background: isUnlocked ? `${stamp.inkColor}12` : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: isUnlocked ? 'rotate(-6deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '24px', opacity: isUnlocked ? 1 : 0.4 }}>
                        {stamp.icon}
                      </span>
                      {isUnlocked && (
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 900,
                            color: stamp.inkColor,
                            fontFamily: 'var(--font-mono)',
                            marginTop: '-2px',
                          }}
                        >
                          OFFICIAL
                        </span>
                      )}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: isUnlocked ? stamp.inkColor : 'var(--ink)',
                          letterSpacing: '-0.2px',
                        }}
                      >
                        {stamp.title}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          color: isUnlocked ? stamp.inkColor : 'var(--ink-soft)',
                          fontWeight: 700,
                          opacity: 0.8,
                          marginBottom: '4px',
                        }}
                      >
                        {stamp.koreanTitle}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                        {stamp.description}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                      {isUnlocked ? '💮 Verified in Room' : '▷ Unplayed Date'}
                    </span>
                    <Link
                      href={stamp.route}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--pink)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Play Now</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Share / Export Banner */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>
                Share Your Couple Passport 💌
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                Send your date collection strip to your partner or friends to show your milestone progress.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  sounds.playPop();
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="btn btn-grad"
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '20px',
                }}
              >
                {copiedLink ? '✓ Link Copied!' : 'Copy Passport Link 📋'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Stamp Detail Modal */}
      {selectedStamp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(23, 24, 28, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedStamp(null)}
        >
          <div
            style={{
              width: 'min(440px, 100%)',
              background: '#FCFBF7',
              borderRadius: '20px',
              padding: '32px 28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              position: 'relative',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ink Stamp Seal */}
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: selectedStamp.sealShape === 'circle' ? '50%' : '20px',
                border: `4px dashed ${selectedStamp.inkColor}`,
                background: `${selectedStamp.inkColor}15`,
                margin: '0 auto 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-4deg)',
              }}
            >
              <span style={{ fontSize: '36px' }}>{selectedStamp.icon}</span>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: selectedStamp.inkColor, fontWeight: 800, letterSpacing: '1px' }}>
              OFFICIAL DATE CERTIFICATE
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--ink)', margin: '4px 0 2px' }}>
              {selectedStamp.title}
            </h3>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '14px' }}>
              {selectedStamp.koreanTitle}
            </div>

            <p style={{ fontSize: '14.5px', color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: '22px' }}>
              {selectedStamp.description}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href={selectedStamp.route}
                className="btn btn-grad"
                style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '12px', fontWeight: 700 }}
              >
                Replay Activity ▷
              </Link>
              <button
                onClick={() => setSelectedStamp(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

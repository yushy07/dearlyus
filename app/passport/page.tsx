'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import {
  PASSPORT_STAMPS,
  PassportStamp,
  getUnlockedStamps,
  unlockPassportStamp,
  getStampNotes,
  saveStampNote,
  getCoupleTicketProfile,
  saveCoupleTicketProfile,
  CoupleTicketProfile,
} from '@/lib/passport';
import { sounds } from '@/lib/sound';
import { ScrollReveal } from '@/components/ui';

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  char: string;
  scale: number;
  color: string;
}

export default function PassportPage() {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [stampNotes, setStampNotes] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedStamp, setSelectedStamp] = useState<PassportStamp | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [animatingStampId, setAnimatingStampId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CoupleTicketProfile>(getCoupleTicketProfile());
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [tempProfile, setTempProfile] = useState<CoupleTicketProfile>(getCoupleTicketProfile());
  const [roomCode, setRoomCode] = useState('KX7RM');
  const [copiedLink, setCopiedLink] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    setUnlockedIds(getUnlockedStamps());
    setStampNotes(getStampNotes());
    const prof = getCoupleTicketProfile();
    setProfile(prof);
    setTempProfile(prof);

    if (typeof window !== 'undefined') {
      try {
        const savedRoom = localStorage.getItem('angie_room_code') || 'KX7RM';
        setRoomCode(savedRoom);
      } catch {}
    }
  }, []);

  const triggerConfettiCelebration = () => {
    const chars = ['🌸', '💖', '⭐', '✨', '🎀', '💌', '🌟'];
    const colors = ['#FF7BA3', '#F43F5E', '#FDE68A', '#A855F7', '#60A5FA', '#34D399'];
    const pieces: ConfettiPiece[] = Array.from({ length: 32 }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x: Math.random() * 100,
      y: -10,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * 40 + 30,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 360,
      char: chars[Math.floor(Math.random() * chars.length)],
      scale: Math.random() * 0.6 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 2800);
  };

  const handleStampClick = (stamp: PassportStamp, isUnlocked: boolean) => {
    sounds.playStampThud();
    setAnimatingStampId(stamp.id);
    setTimeout(() => setAnimatingStampId(null), 600);

    triggerConfettiCelebration();

    if (isUnlocked) {
      setSelectedStamp(stamp);
      setTempNoteText(stampNotes[stamp.id] || stamp.defaultMemory);
    } else {
      unlockPassportStamp(stamp.id);
      setUnlockedIds(getUnlockedStamps());
      sounds.playSparkleReaction('💖');
    }
  };

  const handleSaveNote = (stampId: string) => {
    sounds.playPop();
    saveStampNote(stampId, tempNoteText);
    setStampNotes((prev) => ({ ...prev, [stampId]: tempNoteText }));
    setEditingNoteId(null);
  };

  const handleSaveTicketProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPop();
    saveCoupleTicketProfile(tempProfile);
    setProfile(tempProfile);
    setIsEditingTicket(false);
    triggerConfettiCelebration();
  };

  const exportPassportImage = () => {
    sounds.playSparkleReaction('💖');
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Velvet Leather Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
    bgGrad.addColorStop(0, '#1E1B4B');
    bgGrad.addColorStop(0.5, '#2E1065');
    bgGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 800);

    // Gold Outer Stitched Border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 740);

    ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(42, 42, 1116, 716);
    ctx.setLineDash([]);

    // Gold Header Crest
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 22px Pretendard, sans-serif';
    ctx.fillText('🌸 대한민국 연인 여권 · REPUBLIC OF LOVE OFFICIAL PASSPORT', 600, 90);

    // Couple Names
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Pretendard, sans-serif';
    ctx.fillText(`${profile.partner1} & ${profile.partner2}`, 600, 155);

    // Flight Route & Date
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`${profile.originCity}  ✈️ ➔ 💖  ${profile.destinationCity}`, 600, 200);

    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`FLIGHT: ANG-${roomCode}-2026 · SEAT: ${profile.seatNumber} · DATE: ${profile.anniversaryDate}`, 600, 235);

    // 4 Unlocked Souvenir Stamps Cards
    const unlockedList = PASSPORT_STAMPS.filter((s) => unlockedIds.includes(s.id)).slice(0, 4);
    unlockedList.forEach((stamp, idx) => {
      const cardX = 70 + idx * 268;
      const cardY = 280;
      const cardW = 250;
      const cardH = 340;

      // Stamp Card Base
      ctx.fillStyle = stamp.pastelBg || '#FFF1F2';
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = stamp.inkColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, cardY, cardW, cardH);

      // Stamp Circular Ink Seal
      ctx.beginPath();
      ctx.arc(cardX + cardW / 2, cardY + 90, 50, 0, Math.PI * 2);
      ctx.strokeStyle = stamp.inkColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stamp Icon
      ctx.font = '36px sans-serif';
      ctx.fillText(stamp.icon, cardX + cardW / 2, cardY + 102);

      // Stamp Title
      ctx.fillStyle = stamp.inkColor;
      ctx.font = 'bold 18px Pretendard, sans-serif';
      ctx.fillText(stamp.title, cardX + cardW / 2, cardY + 180);

      // Korean Hangul Title
      ctx.font = 'bold 13px monospace';
      ctx.fillText(stamp.koreanTitle, cardX + cardW / 2, cardY + 205);

      // Verified Badge
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('✓ OFFICIAL STAMP', cardX + cardW / 2, cardY + 240);
    });

    // Footer Barcode & Serial
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px monospace';
    ctx.fillText(`ANGIE SOUVENIR LOVE PASSPORT · GETANGIE.COM · ROOM: ${roomCode}`, 600, 690);

    const a = document.createElement('a');
    a.download = `angie-passport-${profile.partner1}-${profile.partner2}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
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
      ? '👑 Level 5: Eternal Soulmates 💖'
      : unlockedCount >= 6
      ? '✈️ Level 4: Global Date Masters 🌍'
      : unlockedCount >= 4
      ? '🌸 Level 3: Sweetheart Duo 💌'
      : unlockedCount >= 2
      ? '✨ Level 2: Cozy Date Explorers ☕'
      : '🌱 Level 1: First Date Dreamers';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Celebration Confetti Cannon Shower */}
      {confetti.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 99999,
            overflow: 'hidden',
          }}
        >
          {confetti.map((c) => (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: `${c.x}vw`,
                top: `${c.y}vh`,
                fontSize: `${c.scale * 24}px`,
                animation: 'confetti-fall 2.6s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                transform: `rotate(${c.rot}deg)`,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
              }}
            >
              {c.char}
            </div>
          ))}
        </div>
      )}

      {/* Top Header Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--line)',
          background: 'rgba(255, 255, 255, 0.88)',
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
              Browse 35 Dates ▷
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
                  border: '1px solid rgba(255, 123, 163, 0.45)',
                  padding: '5px 16px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--pink)',
                  fontWeight: 800,
                  boxShadow: '0 2px 10px rgba(255, 123, 163, 0.2)',
                }}
              >
                <span>🌸</span>
                <span>대한민국 · OFFICIAL SOUVENIR LOVE PASSPORT</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Couple Date Passport &amp; Love Stamps
              </h1>
              <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '580px', lineHeight: 1.6 }}>
                Every date night leaves a permanent stamp in your story. Collect authentic Korean ink seals, write romantic memory notes, and customize your couple travel ticket! 💌
              </p>
            </div>
          </ScrollReveal>

          {/* Romantic First Class Boarding Pass Ticket Stub */}
          <ScrollReveal animation="fade-up">
            <div className="passport-boarding-pass" style={{ padding: '24px 28px', color: 'var(--ink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px dashed var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>✈️</span>
                  <div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', fontWeight: 800, letterSpacing: '1px' }}>
                      ANGIE LOVE AIRLINES · FIRST CLASS TICKET
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900 }}>
                      Non-Stop Flight to Each Other’s Arms
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Passengers</div>
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>{profile.partner1} &amp; {profile.partner2}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Seat</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)' }}>{profile.seatNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Love Date</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue)' }}>{profile.anniversaryDate}</div>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playPop();
                      setTempProfile(profile);
                      setIsEditingTicket(true);
                    }}
                    style={{
                      background: 'rgba(255, 123, 163, 0.1)',
                      border: '1px solid rgba(255, 123, 163, 0.4)',
                      borderRadius: '12px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--pink)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>✎</span>
                    <span>Edit Ticket</span>
                  </button>
                </div>
              </div>

              {/* Route Departure / Arrival Hub */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>ORIGIN CITY</div>
                    <div style={{ fontSize: '15px', fontWeight: 900 }}>{profile.originCity}</div>
                  </div>
                  <div style={{ fontSize: '20px', color: 'var(--pink)', padding: '0 8px' }}>✈️ ➔ 💖</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>DESTINATION</div>
                    <div style={{ fontSize: '15px', fontWeight: 900 }}>{profile.destinationCity}</div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--paper)',
                    border: '1px dashed var(--line)',
                    borderRadius: '10px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>💮 STATUS:</span>
                  <b style={{ color: '#059669' }}>LIFETIME BOARDING PASS VALID</b>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Romantic Velvet & Gold Passport Booklet Cover */}
          <ScrollReveal animation="fade-up">
            <div className="passport-blush-cover" style={{ padding: '36px 30px', color: '#FFFFFF' }}>
              {/* Gold Crest & Passport Title */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '20px',
                  paddingBottom: '24px',
                  borderBottom: '1px solid rgba(253, 230, 138, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(253, 230, 138, 0.35) 0%, rgba(212, 175, 55, 0.1) 100%)',
                      border: '2px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                      boxShadow: '0 0 25px rgba(253, 230, 138, 0.4)',
                    }}
                  >
                    🌸
                  </div>
                  <div>
                    <div className="passport-gold-text" style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '2.5px', fontWeight: 800 }}>
                      대한민국 연인 여권 · REPUBLIC OF LOVE
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.2px', marginTop: '2px' }}>
                      {profile.partner1} &amp; {profile.partner2}
                    </div>
                  </div>
                </div>

                {/* Passport Serial & Rank Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.65)' }}>
                    PASSPORT ID
                  </div>
                  <div style={{ fontSize: '17px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FDE68A', letterSpacing: '1.5px' }}>
                    ANG-{roomCode}-2026
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      color: '#FDE68A',
                      fontWeight: 700,
                      marginTop: '2px',
                    }}
                  >
                    {rankTier}
                  </div>
                </div>
              </div>

              {/* Passport Progress Bar */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Souvenir Date Stamps Unlocked ({unlockedCount}/{totalCount} Completed)
                  </span>
                  <span style={{ color: '#FDE68A', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {progressPercent}% Complete
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.12)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #FF7BA3, #FFA07A, #FDE68A)',
                      borderRadius: '6px',
                      boxShadow: '0 0 12px rgba(255, 123, 163, 0.6)',
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
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: activeCategory === cat ? '1px solid var(--pink)' : '1px solid var(--line)',
                  background: activeCategory === cat ? 'linear-gradient(135deg, var(--pink), #FF9E64)' : '#FFFFFF',
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

          {/* Stamps Grid with Washi Tape & Memory Notes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredStamps.map((stamp) => {
              const isUnlocked = unlockedIds.includes(stamp.id);
              const isAnimating = animatingStampId === stamp.id;
              const userNote = stampNotes[stamp.id] || stamp.defaultMemory;

              return (
                <div
                  key={stamp.id}
                  className={`passport-page-cream passport-stamp-badge ${isAnimating ? 'stamp-ink-effect' : ''}`}
                  onClick={() => handleStampClick(stamp, isUnlocked)}
                  style={{
                    padding: '28px 22px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '260px',
                    background: stamp.pastelBg,
                    border: isUnlocked ? `1.5px solid ${stamp.inkColor}33` : '1.5px dashed var(--line)',
                  }}
                >
                  {/* Cute Washi Tape Graphic */}
                  <div className="passport-washi-tape" style={{ background: `${stamp.inkColor}25` }} />

                  {/* Top Category Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        color: 'var(--ink-soft)',
                        fontWeight: 700,
                      }}
                    >
                      {stamp.category}
                    </span>

                    {isUnlocked ? (
                      <span
                        style={{
                          fontSize: '10px',
                          background: `${stamp.inkColor}15`,
                          border: `1px solid ${stamp.inkColor}44`,
                          color: stamp.inkColor,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        ✓ STAMPED ON DATE
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
                        🔒 TAP TO STAMP
                      </span>
                    )}
                  </div>

                  {/* Stamp Center Emblem */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: stamp.sealShape === 'circle' || stamp.sealShape === 'heart' ? '50%' : '16px',
                        border: isUnlocked ? `3.5px dashed ${stamp.inkColor}` : '2px dashed #CBD5E1',
                        background: isUnlocked ? '#FFFFFF' : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: isUnlocked ? `rotate(${stamp.stampAngle}deg)` : 'none',
                        boxShadow: isUnlocked ? `0 4px 16px ${stamp.inkColor}22` : 'none',
                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <span style={{ fontSize: '26px', opacity: isUnlocked ? 1 : 0.4 }}>
                        {stamp.icon}
                      </span>
                      {isUnlocked && (
                        <span
                          style={{
                            fontSize: '7.5px',
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
                          fontSize: '11.5px',
                          fontFamily: 'var(--font-mono)',
                          color: isUnlocked ? stamp.inkColor : 'var(--ink-soft)',
                          fontWeight: 700,
                          opacity: 0.85,
                          marginBottom: '4px',
                        }}
                      >
                        {stamp.koreanTitle}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                        {stamp.description}
                      </div>
                    </div>
                  </div>

                  {/* Romantic Couple Memory Sticky Snippet */}
                  {isUnlocked && (
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        fontSize: '11.5px',
                        color: 'var(--ink)',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                        margin: '6px 0 10px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                      }}
                    >
                      <span>💬</span>
                      <span>{userNote}</span>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                      {isUnlocked ? '💮 Tap to view memory' : '▷ Unplayed Date'}
                    </span>
                    <Link
                      href={stamp.route}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: stamp.inkColor,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Start Date</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Share Banner */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>
                Share Your Couple Passport with Partner 💌
              </div>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
                Send your date collection strip to your partner so you both celebrate every milestone together.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={exportPassportImage}
                style={{
                  padding: '12px 22px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #1E1B4B, #2E1065)',
                  border: '1.5px solid rgba(253, 230, 138, 0.6)',
                  color: '#FDE68A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 16px rgba(46, 16, 101, 0.25)',
                }}
              >
                <span>📸</span>
                <span>Download Souvenir Card</span>
              </button>

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
                  padding: '12px 24px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  borderRadius: '24px',
                }}
              >
                {copiedLink ? '✓ Link Copied to Clipboard!' : 'Copy Passport Link 📋'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Ticket Profile Editor Modal */}
      {isEditingTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(23, 24, 28, 0.65)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
          onClick={() => setIsEditingTicket(false)}
        >
          <div
            style={{
              width: 'min(480px, 100%)',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '32px 28px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255, 123, 163, 0.4)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>✈️</span>
              <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Customize Couple Ticket</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '20px' }}>
              Personalize your Love Airlines Boarding Pass and Passport credentials.
            </p>

            <form onSubmit={handleSaveTicketProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                    Partner 1 Name
                  </label>
                  <input
                    type="text"
                    value={tempProfile.partner1}
                    onChange={(e) => setTempProfile({ ...tempProfile, partner1: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '4px', fontSize: '13px', fontWeight: 700 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                    Partner 2 Name
                  </label>
                  <input
                    type="text"
                    value={tempProfile.partner2}
                    onChange={(e) => setTempProfile({ ...tempProfile, partner2: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '4px', fontSize: '13px', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                  Origin City &amp; Timezone
                </label>
                <input
                  type="text"
                  value={tempProfile.originCity}
                  onChange={(e) => setTempProfile({ ...tempProfile, originCity: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '4px', fontSize: '13px' }}
                  placeholder="e.g. Seoul 🇰🇷 (GMT+9)"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                  Destination City &amp; Timezone
                </label>
                <input
                  type="text"
                  value={tempProfile.destinationCity}
                  onChange={(e) => setTempProfile({ ...tempProfile, destinationCity: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '4px', fontSize: '13px' }}
                  placeholder="e.g. San Francisco 🇺🇸 (GMT-7)"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                    Anniversary / Love Date
                  </label>
                  <input
                    type="text"
                    value={tempProfile.anniversaryDate}
                    onChange={(e) => setTempProfile({ ...tempProfile, anniversaryDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '4px', fontSize: '13px' }}
                    placeholder="2024.11.14"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                    Seat Number
                  </label>
                  <input
                    type="text"
                    value={tempProfile.seatNumber}
                    onChange={(e) => setTempProfile({ ...tempProfile, seatNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '4px', fontSize: '13px' }}
                    placeholder="1A (Beside You)"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-grad"
                  style={{ flex: 1, padding: '12px', fontSize: '13.5px', borderRadius: '12px', fontWeight: 800 }}
                >
                  Save Ticket &amp; Passport 💖
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTicket(false)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Romantic Polaroid Stamp Memory Modal */}
      {selectedStamp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(23, 24, 28, 0.65)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedStamp(null)}
        >
          <div
            style={{
              width: 'min(480px, 100%)',
              background: '#FCFBF7',
              borderRadius: '24px',
              padding: '36px 30px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              border: '2px solid rgba(253, 230, 138, 0.5)',
              position: 'relative',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Washi Tape Header */}
            <div className="passport-washi-tape" style={{ background: `${selectedStamp.inkColor}30`, top: '-9px' }} />

            {/* Ink Stamp Seal */}
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: `4px dashed ${selectedStamp.inkColor}`,
                background: `${selectedStamp.inkColor}15`,
                margin: '0 auto 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${selectedStamp.stampAngle}deg)`,
                boxShadow: `0 8px 24px ${selectedStamp.inkColor}30`,
              }}
            >
              <span style={{ fontSize: '38px' }}>{selectedStamp.icon}</span>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: selectedStamp.inkColor, fontWeight: 800, letterSpacing: '1px' }}>
              OFFICIAL DATE MEMORY CERTIFICATE
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ink)', margin: '4px 0 2px' }}>
              {selectedStamp.title}
            </h3>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '12px' }}>
              {selectedStamp.koreanTitle}
            </div>

            <div
              style={{
                fontSize: '13px',
                color: 'var(--ink)',
                fontStyle: 'italic',
                background: '#FFFFFF',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '18px',
              }}
            >
              {selectedStamp.sweetQuote}
            </div>

            {/* Couple Custom Memory Note Box */}
            <div style={{ textAlign: 'left', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                  💌 Your Couple Memory Note:
                </span>
                {editingNoteId !== selectedStamp.id && (
                  <button
                    onClick={() => setEditingNoteId(selectedStamp.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--pink)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✎ Edit Note
                  </button>
                )}
              </div>

              {editingNoteId === selectedStamp.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={tempNoteText}
                    onChange={(e) => setTempNoteText(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--pink)',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      resize: 'none',
                    }}
                    placeholder="Write a sweet memory from this date..."
                  />
                  <button
                    onClick={() => handleSaveNote(selectedStamp.id)}
                    className="btn btn-grad"
                    style={{ padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
                  >
                    Save Memory Note 💖
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: 'var(--ink-soft)',
                    lineHeight: 1.5,
                  }}
                >
                  {stampNotes[selectedStamp.id] || selectedStamp.defaultMemory}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href={selectedStamp.route}
                className="btn btn-grad"
                style={{ flex: 1, padding: '12px', fontSize: '13px', borderRadius: '12px', fontWeight: 800 }}
              >
                Replay Date Activity ▷
              </Link>
              <button
                onClick={() => setSelectedStamp(null)}
                style={{
                  padding: '12px 20px',
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

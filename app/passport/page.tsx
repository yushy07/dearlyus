'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { sounds } from '@/lib/sound';
import { ScrollReveal } from '@/components/ui';
import { usePassport } from '@/hooks/usePassport';
import type { PassportStamp, CoupleTicketProfile } from '@/types/passport';
import { BoardingPassCard } from './_components/BoardingPassCard';
import { PassportBookletCover } from './_components/PassportBookletCover';
import { StampCard } from './_components/StampCard';
import { TicketEditorModal } from './_components/TicketEditorModal';
import { RoomInviteModal } from '@/components/shared/RoomInviteModal';

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  rot: number;
  char: string;
  scale: number;
}

export default function PassportPage() {
  const {
    stamps,
    unlockedIds,
    stampNotes,
    profile,
    unlockedCount,
    totalCount,
    progressPercent,
    rankTier,
    unlockStamp,
    updateNote,
    updateProfile,
  } = usePassport();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedStamp, setSelectedStamp] = useState<PassportStamp | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [animatingStampId, setAnimatingStampId] = useState<string | null>(null);
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('KX7RM');
  const [copiedLink, setCopiedLink] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedRoom = localStorage.getItem('angie_room_code') || 'KX7RM';
        setRoomCode(savedRoom);
      } catch {}
    }
  }, []);

  const triggerConfettiCelebration = () => {
    const chars = ['🌸', '💖', '⭐', '✨', '🎀', '💌', '🌟'];
    const pieces: ConfettiPiece[] = Array.from({ length: 32 }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x: Math.random() * 100,
      y: -10,
      rot: Math.random() * 360,
      char: chars[Math.floor(Math.random() * chars.length)],
      scale: Math.random() * 0.6 + 0.8,
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
      unlockStamp(stamp.id);
      sounds.playSparkleReaction('💖');
    }
  };

  const handleSaveNote = (stampId: string) => {
    sounds.playPop();
    updateNote(stampId, tempNoteText);
    setEditingNoteId(null);
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
    const unlockedList = stamps.filter((s) => unlockedIds.includes(s.id)).slice(0, 4);
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
    ? stamps
    : stamps.filter((s) => s.category === activeCategory);

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
            <BoardingPassCard
              profile={profile}
              onEditClick={() => setIsEditingTicket(true)}
              onShareClick={() => setIsInviteModalOpen(true)}
            />
          </ScrollReveal>

          {/* Romantic Velvet & Gold Passport Booklet Cover */}
          <ScrollReveal animation="fade-up">
            <PassportBookletCover
              profile={profile}
              roomCode={roomCode}
              rankTier={rankTier}
              unlockedCount={unlockedCount}
              totalCount={totalCount}
              progressPercent={progressPercent}
            />
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
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: activeCategory === cat ? 'none' : '1px solid var(--line)',
                  background: activeCategory === cat ? 'var(--ink)' : 'var(--paper-raised)',
                  color: activeCategory === cat ? '#FFFFFF' : 'var(--ink-soft)',
                  boxShadow: activeCategory === cat ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
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
                <StampCard
                  key={stamp.id}
                  stamp={stamp}
                  isUnlocked={isUnlocked}
                  isAnimating={isAnimating}
                  userNote={userNote}
                  onStampClick={handleStampClick}
                  onEditNoteClick={(s) => {
                    setSelectedStamp(s);
                    setEditingNoteId(s.id);
                    setTempNoteText(stampNotes[s.id] || s.defaultMemory);
                  }}
                />
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
      <TicketEditorModal
        isOpen={isEditingTicket}
        profile={profile}
        onClose={() => setIsEditingTicket(false)}
        onSave={(updated) => {
          updateProfile(updated);
          triggerConfettiCelebration();
        }}
      />

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

      {/* 1-Tap Shareable Room Invite Modal */}
      <RoomInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomCode={roomCode}
        activityName="Couple Date Passport"
        partnerAName={profile.partner1}
        activitySlug="passport"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

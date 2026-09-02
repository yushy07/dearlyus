'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ROOM_STYLES,
  PHOTO_LAYOUTS as LAYOUTS,
  POSE_PROMPTS,
  AR_FILTERS,
  COLOR_FILTERS,
  STICKER_PALETTE,
} from '@/lib/constants';
import { sounds } from '@/lib/sound';
import { downloadAnimatedStripVideo } from '@/lib/gif-recorder';
import { Confetti } from '@/components/shared/Confetti';
import { Ribbon } from '@/components/shared/Ribbon';
import { TiltedCard, ShinyText } from '@/components/ui';
import { RoomInviteModal } from '@/components/shared/RoomInviteModal';
import { getCupidotPoseIdea, generateCupidotCaption, PoseIdea } from '@/lib/cupidot';

export interface PlacedSticker {
  id: string;
  content: string;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  rotation: number; // degrees (-30 to +30)
  scale: number; // 0.8 - 1.5
  isHangul?: boolean;
}

const STICKER_CATEGORIES = [
  {
    id: 'hangul',
    name: '🇰🇷 Korean Text',
    items: [
      { text: '사랑해', label: 'I Love You', isHangul: true },
      { text: '인생네컷', label: 'Life4Cuts', isHangul: true },
      { text: '우리둘이', label: 'Just Us Two', isHangul: true },
      { text: '영원히', label: 'Forever', isHangul: true },
      { text: '보고싶어', label: 'Miss You', isHangul: true },
      { text: '뽀뽀', label: 'Kisses', isHangul: true },
      { text: '최고야', label: 'You Are Best', isHangul: true },
      { text: '행복해', label: 'Happy', isHangul: true },
    ],
  },
  {
    id: 'props',
    name: '🎀 Cute Props',
    items: [
      { text: '🐱', label: 'Cat Ears' },
      { text: '🐰', label: 'Bunny' },
      { text: '👼', label: 'Angel' },
      { text: '🌸', label: 'Blush' },
      { text: '💖', label: 'Heart' },
      { text: '🎀', label: 'Ribbon' },
      { text: '🧸', label: 'Teddy' },
      { text: '👑', label: 'Crown' },
      { text: '🕶️', label: 'Retro Shades' },
      { text: '🍓', label: 'Strawberry' },
    ],
  },
  {
    id: 'sparkles',
    name: '✨ Sparkles & Stars',
    items: [
      { text: '✨', label: 'Sparkles' },
      { text: '💫', label: 'Dizzy Star' },
      { text: '🌟', label: 'Glowing Star' },
      { text: '🪄', label: 'Magic Wand' },
      { text: '⭐', label: 'Star' },
      { text: '🫧', label: 'Bubbles' },
    ],
  },
];

export default function PhotoboothPage() {
  // Navigation & Scene state: START | ROOM | PROFILE | LAYOUT | THEME | BOOTH | EDIT | FILTER | DECORATE | DOWNLOAD
  const [scene, setScene] = useState<
    'START' | 'ROOM' | 'PROFILE' | 'LAYOUT' | 'THEME' | 'BOOTH' | 'EDIT' | 'FILTER' | 'DECORATE' | 'DOWNLOAD'
  >('BOOTH');

  // Room config
  const [roomCode, setRoomCode] = useState('KX7RM');
  const [selectedStyle, setSelectedStyle] = useState(ROOM_STYLES[0]);
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [nickname, setNickname] = useState('Mia');
  const [partnerName, setPartnerName] = useState('Alex');
  const [coupleName, setCoupleName] = useState('Mia ♡ Alex');
  const [micMuted, setMicMuted] = useState(false);

  // Booth camera & feed state
  const [feedMode, setFeedMode] = useState<'simulated' | 'webcam'>('simulated');
  const [currentShotIdx, setCurrentShotIdx] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [capturedShots, setCapturedShots] = useState<string[]>([
    '/photos/frame1.webp',
    '/photos/frame2.webp',
    '/photos/frame3.webp',
    '/photos/frame4.webp',
  ]);
  const [selectedArFilter, setSelectedArFilter] = useState(AR_FILTERS[0]);
  const [selectedColorFilter, setSelectedColorFilter] = useState(COLOR_FILTERS[0]);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([
    { id: '1', content: '사랑해', x: 28, y: 18, rotation: -6, scale: 1, isHangul: true },
    { id: '2', content: '✨', x: 74, y: 38, rotation: 12, scale: 1.1 },
    { id: '3', content: '💖', x: 80, y: 84, rotation: 8, scale: 1.2 },
  ]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeStickerTab, setActiveStickerTab] = useState<'hangul' | 'props' | 'sparkles'>('hangul');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Next-Gen Feature Upgrades: Motion Strips & Live Neon Doodling
  const [isMotionMode, setIsMotionMode] = useState(false);
  const [motionFrameIdx, setMotionFrameIdx] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [neonPenColor, setNeonPenColor] = useState('#FF7BA3');
  const [isVintageCamMode, setIsVintageCamMode] = useState(false);
  const [cupidotPose, setCupidotPose] = useState<PoseIdea | null>(null);

  // Motion strip looping interval
  useEffect(() => {
    if (!isMotionMode) return;
    const interval = setInterval(() => {
      setMotionFrameIdx((prev) => (prev + 1) % 4);
    }, 650);
    return () => clearInterval(interval);
  }, [isMotionMode]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live Webcam hook
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (feedMode === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
        })
        .catch(() => setFeedMode('simulated'));
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [feedMode]);

  // Capture sequence
  const startCaptureSequence = () => {
    if (isShooting) return;
    setIsShooting(true);
    setCurrentShotIdx(0);
    const newShots: string[] = [];

    const shootStep = (idx: number) => {
      if (idx >= selectedLayout.cuts) {
        setIsShooting(false);
        setScene('EDIT');
        return;
      }

      setCurrentShotIdx(idx);
      setCountdown(3);
      sounds.playCountdownBeep(false);

      setTimeout(() => {
        setCountdown(2);
        sounds.playCountdownBeep(false);
      }, 900);

      setTimeout(() => {
        setCountdown(1);
        sounds.playCountdownBeep(false);
      }, 1800);

      setTimeout(() => {
        setCountdown(null);
        setFlashing(true);
        sounds.playShutter();
        setTimeout(() => setFlashing(false), 320);

        if (feedMode === 'webcam' && videoRef.current && canvasRef.current) {
          const c = canvasRef.current;
          const ctx = c.getContext('2d');
          if (ctx) {
            c.width = videoRef.current.videoWidth || 640;
            c.height = videoRef.current.videoHeight || 480;
            ctx.drawImage(videoRef.current, 0, 0, c.width, c.height);
            newShots.push(c.toDataURL('image/webp'));
            setCapturedShots([...newShots]);
          }
        } else {
          newShots.push(`/photos/frame${idx + 1}.webp`);
          setCapturedShots([...newShots]);
        }

        setTimeout(() => shootStep(idx + 1), 1000);
      }, 2700);
    };

    shootStep(0);
  };

  const addSticker = (content: string, isHangul = false) => {
    sounds.playPop();
    const newStk: PlacedSticker = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content,
      x: Math.round(20 + Math.random() * 60),
      y: Math.round(15 + Math.random() * 70),
      rotation: Math.round((Math.random() - 0.5) * 24),
      scale: 1,
      isHangul,
    };
    setPlacedStickers((prev) => [...prev.slice(-14), newStk]);
    setSelectedStickerId(newStk.id);
  };

  const updateSticker = (id: string, updates: Partial<PlacedSticker>) => {
    setPlacedStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeSticker = (id: string) => {
    sounds.playTick();
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // High-Resolution 600x1600 Canvas Strip Exporter with Baked Photos & Stickers
  const downloadHighResStrip = async () => {
    sounds.playTick();
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (selectedStyle.foilEffect === 'holographic') {
      const grad = ctx.createLinearGradient(0, 0, 600, 1600);
      grad.addColorStop(0, '#FFD1DC');
      grad.addColorStop(0.25, '#FFE4B5');
      grad.addColorStop(0.5, '#D4F0FF');
      grad.addColorStop(0.75, '#E8D7FF');
      grad.addColorStop(1, '#FFD1DC');
      ctx.fillStyle = grad;
    } else if (selectedStyle.foilEffect === 'chrome') {
      const grad = ctx.createLinearGradient(0, 0, 600, 1600);
      grad.addColorStop(0, '#CBD5E1');
      grad.addColorStop(0.3, '#FFFFFF');
      grad.addColorStop(0.5, '#94A3B8');
      grad.addColorStop(0.7, '#FFFFFF');
      grad.addColorStop(1, '#CBD5E1');
      ctx.fillStyle = grad;
    } else if (selectedStyle.foilEffect === 'matte-foil') {
      ctx.fillStyle = '#101216';
    } else if (selectedStyle.bg.startsWith('linear')) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1600);
      grad.addColorStop(0, '#FFE4D6');
      grad.addColorStop(1, '#FFD6E8');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = selectedStyle.bg;
    }
    ctx.fillRect(0, 0, 600, 1600);

    // Border
    ctx.strokeStyle = selectedStyle.foilEffect === 'matte-foil' ? '#E2E8F0' : selectedStyle.border;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(16, 16, 568, 1568);

    // Title
    ctx.fillStyle = selectedStyle.color;
    ctx.font = 'bold 24px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ANGIE · 인생네컷', 300, 62);

    // Helper to load photos
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });
    };

    const loadedImages = await Promise.all(capturedShots.map((s) => loadImage(s)));

    // 4 Photo Frames
    for (let i = 0; i < 4; i++) {
      const y = 85 + i * 348;
      ctx.fillStyle = '#F8F9FB';
      ctx.fillRect(42, y, 516, 320);

      const img = loadedImages[i];
      if (img && img.width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(42, y, 516, 320);
        ctx.clip();
        const imgRatio = img.width / img.height;
        const frameRatio = 516 / 320;
        let dw = 516;
        let dh = 320;
        let dx = 42;
        let dy = y;
        if (imgRatio > frameRatio) {
          dw = 320 * imgRatio;
          dx = 42 - (dw - 516) / 2;
        } else {
          dh = 516 / imgRatio;
          dy = y - (dh - 320) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);

        // Optional 90s Film Cam light leak & LED date stamp
        if (isVintageCamMode) {
          const leakGrad = ctx.createRadialGradient(42 + 516 * 0.85, y + 40, 10, 42 + 516 * 0.85, y + 40, 240);
          leakGrad.addColorStop(0, 'rgba(255, 120, 50, 0.45)');
          leakGrad.addColorStop(0.4, 'rgba(255, 40, 100, 0.22)');
          leakGrad.addColorStop(1, 'rgba(255, 40, 100, 0)');
          ctx.fillStyle = leakGrad;
          ctx.fillRect(42, y, 516, 320);

          ctx.save();
          ctx.font = 'bold 20px monospace';
          ctx.fillStyle = '#FF6A00';
          ctx.shadowColor = '#FF4500';
          ctx.shadowBlur = 6;
          ctx.textAlign = 'right';
          ctx.fillText("'26  9  3", 42 + 516 - 16, y + 320 - 16);
          ctx.restore();
        }

        ctx.restore();
      }

      ctx.strokeStyle = selectedStyle.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(42, y, 516, 320);

      // Frame number tag
      ctx.fillStyle = '#8B8E98';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`0${i + 1} · ${nickname.toUpperCase()} ♡ ${partnerName.toUpperCase()}`, 300, y + 165);
    }

    // Bake Placed Stickers onto Canvas
    placedStickers.forEach((stk) => {
      ctx.save();
      const px = (stk.x / 100) * 600;
      const py = (stk.y / 100) * 1600;
      ctx.translate(px, py);
      ctx.rotate((stk.rotation * Math.PI) / 180);
      ctx.scale(stk.scale, stk.scale);

      if (stk.isHangul) {
        ctx.font = 'bold 24px Pretendard, sans-serif';
        const txtW = ctx.measureText(stk.content).width;
        const bW = txtW + 28;
        const bH = 38;

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        // Pill background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(-bW / 2, -bH / 2, bW, bH, 19);
        ctx.fill();

        // Pill border
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#FF7BA3';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#FF4D80';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stk.content, 0, 1);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        ctx.font = '40px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stk.content, 0, 0);
      }
      ctx.restore();
    });

    // Couple Name & Footer
    ctx.fillStyle = selectedStyle.color;
    ctx.font = 'bold 22px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(coupleName, 300, 1515);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#5B5E68';
    ctx.fillText(`ROOM: ${roomCode} · ${new Date().toLocaleDateString()}`, 300, 1545);

    const a = document.createElement('a');
    a.download = `angie-photostrip-${roomCode}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();

    // Trigger celebration sound and particles
    sounds.playCelebration();
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 4000);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Confetti celebration overlay */}
      <Confetti active={confettiActive} />

      {/* Tagline Ribbon */}
      <Ribbon text={<>♡ Online Photobooth for Long Distance Couples · <b>인생네컷 Free Studio</b></>} />

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

          {/* Scene Step breadcrumb pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                sounds.playPop();
                setIsInviteModalOpen(true);
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: 'var(--paper-raised)',
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to invite partner via QR code or WhatsApp"
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }}></span>
              ROOM: <b>{roomCode}</b>
              <span style={{ fontSize: '11px', color: 'var(--pink)', fontWeight: 700 }}>💌 Invite</span>
            </button>

            <Link className="btn btn-ghost" href="/activity" style={{ fontSize: '13px', padding: '6px 12px' }}>
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '32px' }}>
        {/* Studio Scene Stage Selector Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '8px 14px',
            marginBottom: '28px',
            overflowX: 'auto',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'START', label: '1. Style & Room' },
              { id: 'ROOM', label: '2. Lobby' },
              { id: 'BOOTH', label: '3. Live Booth 📸' },
              { id: 'EDIT', label: '4. Edit & Cuts' },
              { id: 'FILTER', label: '5. Filters' },
              { id: 'DECORATE', label: '6. Stickers' },
              { id: 'DOWNLOAD', label: '7. Download & Print 🧲' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setScene(s.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: scene === s.id ? '1.5px solid var(--pink)' : '1px solid transparent',
                  background: scene === s.id ? 'var(--pink-tint)' : 'transparent',
                  color: scene === s.id ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {selectedStyle.label} · {selectedLayout.name.split(' ')[0]}
          </span>
        </div>

        {/* =========================================================================
            SCENE 1: START (Create Room, Style Picker, Solo / Group Toggle)
            ========================================================================= */}
        {scene === 'START' && (
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="eyebrow">Pick Your Experience Room Style</span>
              <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px' }}>
                Create a <span className="grad">Photobooth Room</span>
              </h1>
              <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginTop: '6px' }}>
                Pick an aesthetic room skin — classic 인생네컷, 1930s automat, neon karaoke, or meme recreation.
              </p>
            </div>

            {/* Mode toggles */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '26px', flexWrap: 'wrap' }}>
              <button
                className={`btn ${!isSoloMode && !isGroupMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setIsSoloMode(false);
                  setIsGroupMode(false);
                }}
              >
                👫 Couple Room (Duo)
              </button>
              <button
                className={`btn ${isGroupMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setIsGroupMode(true);
                  setIsSoloMode(false);
                }}
              >
                👥 Group Photobooth (4 People · 2×2)
              </button>
              <button
                className={`btn ${isSoloMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setIsSoloMode(true);
                  setIsGroupMode(false);
                }}
              >
                👤 Solo Session
              </button>
            </div>

            {/* Room Style Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {ROOM_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => {
                    setSelectedStyle(style);
                    setScene('ROOM');
                  }}
                  style={{
                    background: style.bg,
                    color: style.color,
                    border: selectedStyle.id === style.id ? '2px solid var(--pink)' : `1px solid ${style.border}`,
                    borderRadius: '12px',
                    padding: '18px 16px',
                    boxShadow: 'var(--shadow)',
                    cursor: 'pointer',
                    transform: selectedStyle.id === style.id ? 'scale(1.02)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '16px' }}>{style.label}</strong>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: style.accent }}></span>
                  </div>
                  <p style={{ fontSize: '12.5px', opacity: 0.8, lineHeight: 1.4 }}>{style.sub}</p>
                  <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '12px', fontWeight: 700, color: style.accent }}>
                    Select Room ▷
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 2: ROOM (Lobby, Code Sharing & QR, Partner Status)
            ========================================================================= */}
        {scene === 'ROOM' && (
          <div style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}>
            <div className="booth-box" style={{ padding: '36px 28px' }}>
              <span className="eyebrow">Room Lobby · 5-Letter Code</span>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '10px 0' }}>Share code with your partner</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '24px' }}>
                Send this 5-letter code to your partner so both screens connect into the same photobooth frame.
              </p>

              {/* Big Room Code Cells */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {roomCode.split('').map((char, i) => (
                  <span
                    key={i}
                    style={{
                      width: '46px',
                      height: '56px',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--paper)',
                      border: '2px solid var(--line)',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>

              {/* Partner Status Indicators */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  background: 'var(--paper)',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  marginBottom: '26px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a7d4d' }}></span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{nickname} (Calgary) — Ready</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a7d4d' }}></span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{partnerName} (Jakarta) — Connected</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost" onClick={copyRoomLink}>
                  {copied ? '✓ Link Copied!' : 'Copy Room Link 🔗'}
                </button>
                <button className="btn btn-grad" onClick={() => setScene('BOOTH')} style={{ padding: '12px 28px' }}>
                  Enter Photobooth ▷
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 3: BOOTH (The Live Studio Stage with Duo Video, AR, Countdown & Flash)
            ========================================================================= */}
        {scene === 'BOOTH' && (
          <div className="booth-showcase-grid">
            {/* Left: Studio Stage */}
            <div className={`booth-box ${selectedStyle.id === 'vintage' ? 'vintage-automat' : ''}`}>
              {/* Studio Bar Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`btn ${feedMode === 'simulated' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                    onClick={() => setFeedMode('simulated')}
                  >
                    👫 Demo Duo Feed
                  </button>
                  <button
                    className={`btn ${feedMode === 'webcam' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                    onClick={() => setFeedMode('webcam')}
                  >
                    📷 Live Webcam
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setMicMuted(!micMuted)}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    {micMuted ? '🔇 Mic Muted' : '🎙️ Mic Live'}
                  </button>
                </div>
              </div>

              {/* Camera Screen Stage */}
              <div className="booth-cam-stage">
                {/* Pose Prompt Top Banner */}
                <div className="pose-prompt-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{POSE_PROMPTS[currentShotIdx % POSE_PROMPTS.length].icon}</span>
                    <span>{POSE_PROMPTS[currentShotIdx % POSE_PROMPTS.length].text}</span>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setCupidotPose(getCupidotPoseIdea());
                    }}
                    className="btn"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      background: 'rgba(255, 77, 128, 0.15)',
                      color: '#FF4D80',
                      border: '1px solid rgba(255, 77, 128, 0.3)',
                      borderRadius: '999px',
                      cursor: 'pointer',
                    }}
                  >
                    ʚ🤖💘ɞ Pose Coach
                  </button>
                </div>

                {cupidotPose && (
                  <div
                    style={{
                      margin: '6px 0 10px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 100%)',
                      border: '1.5px solid rgba(255, 77, 128, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(255, 77, 128, 0.12)',
                      animation: 'gl-rise 0.25s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px' }}>{cupidotPose.emoji}</span>
                      <div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', textTransform: 'uppercase' }}>
                          CUPIDOT POSE: {cupidotPose.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#17181C', fontWeight: 600 }}>
                          {cupidotPose.instructions}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCupidotPose(null)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--ink-soft)' }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {feedMode === 'webcam' ? (
                  <div className="booth-duo-view solo">
                    <div className="booth-feed-panel">
                      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="feed-city-badge pink">
                        <span className="dot"></span> {nickname} (You)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="booth-duo-view">
                    <div className="booth-feed-panel">
                      <img src="/photos/face-calgary.webp" alt="Calgary feed" />
                      <div className="feed-city-badge pink">
                        <span className="dot"></span> {nickname} (Calgary)
                      </div>
                    </div>
                    <div className="booth-feed-panel">
                      <img src="/photos/face-jakarta.webp" alt="Jakarta feed" />
                      <div className="feed-city-badge blue">
                        <span className="dot"></span> {partnerName} (Jakarta)
                      </div>
                    </div>
                  </div>
                )}

                {/* 3..2..1 Countdown Flash */}
                {countdown !== null && <div className="booth-flash-num">{countdown}</div>}

                {/* Studio Camera Flashbulb Effect */}
                {flashing && <div className="camera-flash-overlay" aria-hidden="true" />}
                {flashing && <div className="booth-camera-flash" />}

                {/* AR Filter Overlays */}
                {selectedArFilter.id === 'sparkles' && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '32px', zIndex: 6 }}>
                    <span style={{ animation: 'gl-tw 1.5s infinite' }}>✨</span>
                    <span style={{ animation: 'gl-tw 2s infinite' }}>🌟</span>
                    <span style={{ animation: 'gl-tw 1.8s infinite' }}>✨</span>
                  </div>
                )}
                {selectedArFilter.id === 'hearts' && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '28px', zIndex: 6 }}>
                    <span style={{ animation: 'gl-pulse 1.6s infinite' }}>💖</span>
                    <span style={{ animation: 'gl-pulse 2.2s infinite' }}>💕</span>
                    <span style={{ animation: 'gl-pulse 1.9s infinite' }}>💗</span>
                  </div>
                )}
                {selectedArFilter.id === 'cat' && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', padding: '16px 40px', fontSize: '28px', zIndex: 6 }}>
                    <span>🐱</span>
                    <span>🐾</span>
                  </div>
                )}
                {selectedArFilter.id === 'halo' && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', padding: '10px', fontSize: '28px', zIndex: 6 }}>
                    <span>😇</span>
                    <span>😇</span>
                  </div>
                )}
              </div>

              {/* Shutter Button & AR Filter Bar */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>AR FX:</span>
                  {AR_FILTERS.slice(0, 4).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedArFilter(f)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: selectedArFilter.id === f.id ? '1.5px solid var(--pink)' : '1px solid var(--line)',
                        background: selectedArFilter.id === f.id ? 'var(--pink-tint)' : 'var(--paper)',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {f.emoji} {f.label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-grad"
                  onClick={startCaptureSequence}
                  disabled={isShooting}
                  style={{ padding: '12px 28px', fontSize: '16px' }}
                >
                  {isShooting ? 'Taking 4-Cut Photos 📸...' : 'Take 4-Cut Photos 📸'}
                </button>
              </div>

              {/* Live Thumbnail Strip Progress */}
              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                  Live Capture Shots ({capturedShots.length} / 4):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' }}>
                  {capturedShots.map((shot, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '4/3',
                        background: '#17181C',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: currentShotIdx === i && isShooting ? '2px solid var(--pink)' : '1px solid var(--line)',
                      }}
                    >
                      <img src={shot} alt={`Shot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '8px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px' }}>
                        0{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Photostrip Output */}
            <div className="strip-preview-holder">
              <div
                className="real-strip"
                style={{
                  background: selectedStyle.bg,
                  color: selectedStyle.color,
                  borderColor: selectedStyle.border,
                }}
              >
                <div className="real-strip-brand">ANGIE · 인생네컷</div>

                <div className="real-strip-frames">
                  {capturedShots.map((shot, idx) => (
                    <div key={idx} className="real-strip-cell">
                      <img
                        src={shot}
                        alt={`Cut ${idx + 1}`}
                        style={{ filter: selectedColorFilter.filter }}
                      />
                      <span className="frame-tag">0{idx + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Stickers */}
                {placedStickers.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '36px',
                      right: '-10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      pointerEvents: 'none',
                    }}
                  >
                    {placedStickers.map((stk) => (
                      <span key={stk.id} style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                        {stk.content}
                      </span>
                    ))}
                  </div>
                )}

                <div className="real-strip-footer">
                  <input
                    type="text"
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    className="real-strip-name"
                    style={{ width: '100%', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setCoupleName(generateCupidotCaption(nickname, partnerName));
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--pink)',
                      fontWeight: 800,
                      marginTop: '4px',
                    }}
                    title="Click for Cupidot AI Keepsake Caption"
                  >
                    ✨ Cupidot AI Caption
                  </button>
                  <div className="real-strip-serial">
                    ANGIE · <b>{roomCode}</b>
                  </div>
                </div>
              </div>

              {/* Strip Next Scene CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '250px' }}>
                <button className="btn btn-grad" onClick={() => setScene('EDIT')} style={{ justifyContent: 'center' }}>
                  Next: Edit &amp; Color Filters ▷
                </button>
                <button className="btn btn-primary" onClick={downloadHighResStrip} style={{ justifyContent: 'center' }}>
                  Download Photo Strip 💾
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 4: EDIT & COLOR FILTER (Review Shots, Swap Partners, Color Filters)
            ========================================================================= */}
        {(scene === 'EDIT' || scene === 'FILTER') && (
          <div className="booth-showcase-grid">
            <div className="booth-box">
              <span className="eyebrow">Step 4 &amp; 5 · Review &amp; Color Grading</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 16px' }}>Choose your photo color grade</h2>

              {/* Color Filter presets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                {COLOR_FILTERS.map((cf) => (
                  <div
                    key={cf.id}
                    onClick={() => setSelectedColorFilter(cf)}
                    style={{
                      border: selectedColorFilter.id === cf.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      background: 'var(--paper)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '4px', marginBottom: '6px' }}>
                      <img src="/photos/frame1.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: cf.filter }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>{cf.name}</span>
                  </div>
                ))}
              </div>

              {/* Layout Switcher */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Strip Format:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: selectedLayout.id === layout.id ? '1.5px solid var(--pink)' : '1px solid var(--line)',
                        background: selectedLayout.id === layout.id ? 'var(--pink-tint)' : 'var(--paper)',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {layout.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-ghost" onClick={() => setScene('BOOTH')}>
                  ← Retake Photos
                </button>
                <button className="btn btn-grad" onClick={() => setScene('DECORATE')}>
                  Next: Add Stickers ▷
                </button>
              </div>
            </div>

            {/* Right Strip */}
            <div className="strip-preview-holder">
              <div
                className="real-strip"
                style={{
                  background: selectedStyle.bg,
                  color: selectedStyle.color,
                  borderColor: selectedStyle.border,
                }}
              >
                <div className="real-strip-brand">ANGIE · 인생네컷</div>
                <div className="real-strip-frames">
                  {capturedShots.map((shot, idx) => (
                    <div key={idx} className="real-strip-cell">
                      <img src={shot} alt="" style={{ filter: selectedColorFilter.filter }} />
                      <span className="frame-tag">0{idx + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="real-strip-footer">
                  <div className="real-strip-name">{coupleName}</div>
                  <div className="real-strip-serial">
                    ANGIE · <b>{roomCode}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 5: DECORATE & DOWNLOAD (Stickers, Couple Signatures, Canvas Download)
            ========================================================================= */}
        {(scene === 'DECORATE' || scene === 'DOWNLOAD') && (
          <div className="booth-showcase-grid">
            <div className="booth-box">
              <span className="eyebrow">Step 6 &amp; 7 · Decorate &amp; Download</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 16px' }}>Customize your keepsake</h2>

              {/* Couple Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Couple Names on Strip:
                </label>
                <input
                  type="text"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* Categorized Korean Sticker Studio */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sticker Studio &amp; Korean Badges:
                  </label>
                  {placedStickers.length > 0 && (
                    <button
                      onClick={() => {
                        sounds.playTick();
                        setPlacedStickers([]);
                        setSelectedStickerId(null);
                      }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'none',
                        fontSize: '11px',
                        color: 'var(--ink-soft)',
                        cursor: 'pointer',
                      }}
                    >
                      Clear All ({placedStickers.length})
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {STICKER_CATEGORIES.map((cat) => {
                    const isActive = activeStickerTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          sounds.playPop();
                          setActiveStickerTab(cat.id as any);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: isActive ? '1.5px solid var(--pink)' : '1px solid var(--line)',
                          background: isActive ? 'var(--pink-tint)' : 'var(--paper)',
                          color: isActive ? 'var(--pink)' : 'var(--ink-soft)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {/* Active Category Sticker Grid */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    background: 'var(--paper)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    minHeight: '60px',
                  }}
                >
                  {STICKER_CATEGORIES.find((c) => c.id === activeStickerTab)?.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => addSticker(item.text, (item as any).isHangul)}
                      title={item.label}
                      style={{
                        padding: (item as any).isHangul ? '6px 14px' : '6px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: '#FFFFFF',
                        fontSize: (item as any).isHangul ? '13px' : '20px',
                        fontWeight: (item as any).isHangul ? 800 : 400,
                        color: (item as any).isHangul ? 'var(--pink)' : 'inherit',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '6px', marginInline: '2px' }}>
                  💡 <b>Tip:</b> Tap stickers to drop onto your strip · Drag to reposition · Tap on a sticker to rotate, resize, or remove.
                </p>
              </div>

              {/* Motion Strip Mode & Neon Doodling Controls */}
              <div style={{ background: 'var(--paper)', padding: '18px', borderRadius: '12px', border: '1px solid var(--line)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px' }}>🎞️ Korean Photogray Motion Mode</span>
                  <button
                    onClick={() => setIsMotionMode(!isMotionMode)}
                    className={`btn ${isMotionMode ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    {isMotionMode ? '✓ Motion Active' : 'Enable Motion'}
                  </button>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: 0 }}>
                  Loops all 4 cuts in an animated motion sequence mimicking Korean live photostrips.
                </p>

                {/* Neon Pen Selector */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>🎨 Neon Glow Pen:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['#FF7BA3', '#5FA0FF', '#FFD68A', '#4ECCA3', '#FFFFFF'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          setNeonPenColor(col);
                          setIsDrawingMode(true);
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: col,
                          border: neonPenColor === col ? '2px solid #17181C' : '1px solid rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 90s Vintage Cam Date Stamp & Light Leak Toggle */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>🎞️ 90s Film Cam Mode</span>
                    <p style={{ fontSize: '11.5px', color: 'var(--ink-soft)', margin: '2px 0 0' }}>
                      LED date stamp (&apos;26 9 3) &amp; warm nostalgic light leaks.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setIsVintageCamMode(!isVintageCamMode);
                    }}
                    className={`btn ${isVintageCamMode ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    {isVintageCamMode ? '✓ Vintage Active' : 'Enable Vintage'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <button className="btn btn-primary" onClick={downloadHighResStrip} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  Download High-Res 600×1600 Strip PNG 💾
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-grad"
                    onClick={async () => {
                      sounds.playCelebration();
                      setConfettiActive(true);
                      setTimeout(() => setConfettiActive(false), 3000);
                      try {
                        await downloadAnimatedStripVideo(capturedShots, `angie-live-strip-${roomCode}.webm`, {
                          includeFlash: true,
                          fps: 2,
                          frameBorderColor: selectedStyle.bg,
                        });
                      } catch {}
                    }}
                    style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                  >
                    Export Animated Live Strip 🎞️
                  </button>
                  <button className="btn btn-ghost" onClick={copyRoomLink} style={{ padding: '10px 16px', fontSize: '13px' }}>
                    {copied ? '✓ Copied' : 'Share Link 🔗'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Finished Strip */}
            <div className="strip-preview-holder">
              <TiltedCard maxAngle={8} scale={1.02}>
                <div
                  className="real-strip"
                  style={{
                    background: selectedStyle.bg,
                    color: selectedStyle.color,
                    borderColor: selectedStyle.foilEffect === 'matte-foil' ? '#E2E8F0' : selectedStyle.border,
                    boxShadow: selectedStyle.foilEffect === 'holographic'
                      ? '0 20px 50px rgba(192, 132, 252, 0.3), 0 0 30px rgba(255, 209, 220, 0.4)'
                      : selectedStyle.foilEffect === 'chrome'
                      ? '0 20px 50px rgba(148, 163, 184, 0.4), inset 0 0 0 1px rgba(255,255,255,0.8)'
                      : undefined,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Holographic / Chrome Specular Overlay */}
                  {selectedStyle.foilEffect === 'holographic' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(125deg, transparent 20%, rgba(255, 255, 255, 0.45) 35%, transparent 50%, rgba(255, 255, 255, 0.35) 65%, transparent 80%)',
                        backgroundSize: '250% 250%',
                        mixBlendMode: 'overlay',
                        pointerEvents: 'none',
                        zIndex: 4,
                      }}
                    />
                  )}
                  {selectedStyle.foilEffect === 'chrome' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, transparent 35%, rgba(255, 255, 255, 0.3) 65%, transparent 100%)',
                        mixBlendMode: 'screen',
                        pointerEvents: 'none',
                        zIndex: 4,
                      }}
                    />
                  )}

                  <div className="real-strip-brand">ANGIE · 인생네컷</div>
                  <div className="real-strip-frames">
                    {capturedShots.map((shot, idx) => (
                      <div
                        key={idx}
                        className="real-strip-cell"
                        style={{
                          transform: isMotionMode && motionFrameIdx === idx ? 'scale(1.03)' : 'scale(1)',
                          transition: 'transform 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <img src={shot} alt="" style={{ filter: selectedColorFilter.filter }} />
                        <span className="frame-tag">0{idx + 1}</span>

                        {/* Optional 90s Film Cam Overlays */}
                        {isVintageCamMode && (
                          <>
                            {/* Warm Light Leak */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(ellipse at 85% 15%, rgba(255, 120, 50, 0.42) 0%, rgba(255, 40, 100, 0.22) 40%, transparent 75%)',
                                mixBlendMode: 'screen',
                                pointerEvents: 'none',
                                zIndex: 6,
                              }}
                            />
                            {/* LED Date Stamp */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '8px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '10.5px',
                                fontWeight: 900,
                                color: '#FF6A00',
                                textShadow: '0 0 4px #FF4500, 0 0 8px rgba(255, 69, 0, 0.6)',
                                letterSpacing: '1px',
                                pointerEvents: 'none',
                                zIndex: 8,
                              }}
                            >
                              &apos;26 &nbsp;9 &nbsp;3
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Interactive Draggable Placed Stickers Layer */}
                  {placedStickers.map((stk) => {
                    const isSelected = selectedStickerId === stk.id;
                    return (
                      <div
                        key={stk.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setSelectedStickerId(stk.id);
                          const stripEl = e.currentTarget.parentElement;
                          if (!stripEl) return;
                          const rect = stripEl.getBoundingClientRect();

                          const onPointerMove = (moveEvt: PointerEvent) => {
                            const newX = Math.max(5, Math.min(95, ((moveEvt.clientX - rect.left) / rect.width) * 100));
                            const newY = Math.max(4, Math.min(96, ((moveEvt.clientY - rect.top) / rect.height) * 100));
                            updateSticker(stk.id, { x: Math.round(newX), y: Math.round(newY) });
                          };

                          const onPointerUp = () => {
                            window.removeEventListener('pointermove', onPointerMove);
                            window.removeEventListener('pointerup', onPointerUp);
                          };

                          window.addEventListener('pointermove', onPointerMove);
                          window.addEventListener('pointerup', onPointerUp);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${stk.x}%`,
                          top: `${stk.y}%`,
                          transform: `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale})`,
                          cursor: 'grab',
                          userSelect: 'none',
                          touchAction: 'none',
                          zIndex: isSelected ? 35 : 25,
                        }}
                      >
                        {stk.isHangul ? (
                          <span
                            style={{
                              background: '#FFFFFF',
                              border: isSelected ? '2px solid #FF4D80' : '1.5px solid var(--pink)',
                              color: '#FF4D80',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 900,
                              fontFamily: 'var(--font-display)',
                              boxShadow: isSelected
                                ? '0 0 0 3px rgba(255,123,163,0.4), 0 4px 12px rgba(0,0,0,0.15)'
                                : '0 2px 8px rgba(0,0,0,0.12)',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                            }}
                          >
                            {stk.content}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '24px',
                              filter: isSelected
                                ? 'drop-shadow(0 0 6px rgba(255,123,163,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                              display: 'inline-block',
                            }}
                          >
                            {stk.content}
                          </span>
                        )}

                        {/* Selected Sticker Floating Quick Controls */}
                        {isSelected && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '-32px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              display: 'flex',
                              gap: '3px',
                              background: 'rgba(14, 16, 22, 0.92)',
                              padding: '2px 4px',
                              borderRadius: '16px',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                              backdropFilter: 'blur(8px)',
                              zIndex: 45,
                            }}
                          >
                            <button
                              onClick={() => updateSticker(stk.id, { rotation: stk.rotation - 12 })}
                              title="Rotate Left"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ↺
                            </button>
                            <button
                              onClick={() => updateSticker(stk.id, { rotation: stk.rotation + 12 })}
                              title="Rotate Right"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ↻
                            </button>
                            <button
                              onClick={() => updateSticker(stk.id, { scale: Math.max(0.7, stk.scale - 0.15) })}
                              title="Smaller"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ➖
                            </button>
                            <button
                              onClick={() => updateSticker(stk.id, { scale: Math.min(1.6, stk.scale + 0.15) })}
                              title="Larger"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ➕
                            </button>
                            <button
                              onClick={() => removeSticker(stk.id)}
                              title="Delete Sticker"
                              style={{
                                background: 'rgba(255,77,106,0.3)',
                                border: 'none',
                                color: '#FF7BA3',
                                fontSize: '10px',
                                cursor: 'pointer',
                                padding: '2px 5px',
                                borderRadius: '8px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="real-strip-footer">
                    <div className="real-strip-name">{coupleName}</div>
                    <div className="real-strip-serial">
                      ANGIE · <b>{roomCode}</b>
                    </div>
                  </div>
                </div>
              </TiltedCard>

              <button className="btn btn-grad" onClick={downloadHighResStrip} style={{ width: '250px', justifyContent: 'center' }}>
                Download PNG 💾
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 1-Tap Shareable Room Invite Modal */}
      <RoomInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomCode={roomCode}
        activityName="Korean Life4Cuts Photobooth"
        partnerAName={nickname}
        activitySlug="photobooth"
      />
    </div>
  );
}

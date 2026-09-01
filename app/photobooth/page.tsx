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
import { Confetti } from '@/components/shared/Confetti';
import { Ribbon } from '@/components/shared/Ribbon';

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
  const [placedStickers, setPlacedStickers] = useState<string[]>(['💖', '✨', '🫰']);
  const [copied, setCopied] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Next-Gen Feature Upgrades: Motion Strips & Live Neon Doodling
  const [isMotionMode, setIsMotionMode] = useState(false);
  const [motionFrameIdx, setMotionFrameIdx] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [neonPenColor, setNeonPenColor] = useState('#FF7BA3');

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

  const addSticker = (stk: string) => {
    if (placedStickers.length < 8) {
      setPlacedStickers([...placedStickers, stk]);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // High-Resolution 600x1600 Canvas Strip Exporter
  const downloadHighResStrip = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = selectedStyle.bg.startsWith('linear') ? '#FFFFFF' : selectedStyle.bg;
    ctx.fillRect(0, 0, 600, 1600);

    // Border
    ctx.strokeStyle = selectedStyle.border;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(16, 16, 568, 1568);

    // Title
    ctx.fillStyle = selectedStyle.color;
    ctx.font = 'bold 24px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ANGIE · 인생네컷', 300, 62);

    // 4 Photo Frames
    for (let i = 0; i < 4; i++) {
      const y = 85 + i * 348;
      ctx.fillStyle = '#F8F9FB';
      ctx.fillRect(42, y, 516, 320);
      ctx.strokeStyle = selectedStyle.border;
      ctx.strokeRect(42, y, 516, 320);

      // Frame number tag
      ctx.fillStyle = '#8B8E98';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`0${i + 1} · ${nickname.toUpperCase()} ♡ ${partnerName.toUpperCase()}`, 300, y + 165);
    }

    // Couple Name & Footer
    ctx.fillStyle = selectedStyle.color;
    ctx.font = 'bold 22px Pretendard, sans-serif';
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
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: 'var(--paper-raised)',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a7d4d', display: 'inline-block' }}></span>
              ROOM: <b>{roomCode}</b>
            </span>

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
                <div className="pose-prompt-card">
                  <span>{POSE_PROMPTS[currentShotIdx % POSE_PROMPTS.length].icon}</span>
                  <span>{POSE_PROMPTS[currentShotIdx % POSE_PROMPTS.length].text}</span>
                </div>

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

                {/* Camera Flash Screen Effect */}
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
                    {placedStickers.map((stk, i) => (
                      <span key={i} style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                        {stk}
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

              {/* Sticker Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Tap Stickers to Decorate:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {STICKER_PALETTE.map((stk, i) => (
                    <button
                      key={i}
                      onClick={() => addSticker(stk)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: 'var(--paper)',
                        fontSize: '18px',
                      }}
                    >
                      {stk}
                    </button>
                  ))}
                  {placedStickers.length > 0 && (
                    <button
                      onClick={() => setPlacedStickers([])}
                      style={{
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: 'none',
                        fontSize: '12px',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      Clear Stickers
                    </button>
                  )}
                </div>
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
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <button className="btn btn-primary" onClick={downloadHighResStrip} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  Download High-Res 600×1600 Strip PNG 💾
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-grad"
                    onClick={() => {
                      sounds.playCelebration();
                      setConfettiActive(true);
                      setTimeout(() => setConfettiActive(false), 3000);
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
                    <div
                      key={idx}
                      className="real-strip-cell"
                      style={{
                        transform: isMotionMode && motionFrameIdx === idx ? 'scale(1.03)' : 'scale(1)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <img src={shot} alt="" style={{ filter: selectedColorFilter.filter }} />
                      <span className="frame-tag">0{idx + 1}</span>
                    </div>
                  ))}
                </div>

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
                    {placedStickers.map((stk, i) => (
                      <span key={i} style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                        {stk}
                      </span>
                    ))}
                  </div>
                )}

                <div className="real-strip-footer">
                  <div className="real-strip-name">{coupleName}</div>
                  <div className="real-strip-serial">
                    ANGIE · <b>{roomCode}</b>
                  </div>
                </div>
              </div>

              <button className="btn btn-grad" onClick={downloadHighResStrip} style={{ width: '250px', justifyContent: 'center' }}>
                Download PNG 💾
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

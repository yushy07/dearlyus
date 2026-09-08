'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui';

interface PhotoboothDemoStudioProps {
  partnerA: string;
  partnerB: string;
  cityA?: string;
  cityB?: string;
  roomCode: string[];
}

const DEMO_THEMES = [
  {
    id: 'classic',
    name: 'Classic White (인생네컷)',
    bg: '#FFFFFF',
    text: '#17181C',
    border: '#E3E5EA',
  },
  {
    id: 'vintage',
    name: 'Vintage 1930s Automat',
    bg: '#F6EDE6',
    text: '#4A332D',
    border: '#D1C4B2',
  },
  {
    id: 'sunset',
    name: 'Sunset Romance',
    bg: 'linear-gradient(180deg, #FFE4D6, #FFD6E8)',
    text: '#23242A',
    border: '#FFB3C7',
  },
  {
    id: 'cyber',
    name: 'Cyber Blue',
    bg: '#101726',
    text: '#DCEBFF',
    border: '#5FA0FF',
  },
  {
    id: 'noir',
    name: 'Midnight Noir',
    bg: '#17181C',
    text: '#F8F9FB',
    border: '#33353D',
  },
  {
    id: 'lavender',
    name: 'Soft Lavender',
    bg: '#F3EEFC',
    text: '#4D3678',
    border: '#D8C9F2',
  },
];

const DEMO_POSES = [
  'Pose 1: Big warm smile at the camera! 📸',
  'Pose 2: Silly pucker or wink 😉',
  'Pose 3: Half-finger heart meeting in the center 🫰',
  'Pose 4: Blow a kiss or cozy candlelit dinner 🕯️',
];

export function PhotoboothDemoStudio({
  partnerA,
  partnerB,
  cityA = 'Calgary',
  cityB = 'Jakarta',
  roomCode,
}: PhotoboothDemoStudioProps) {
  const [demoMode, setDemoMode] = useState<'simulated' | 'webcam'>('simulated');
  const [demoTheme, setDemoTheme] = useState(DEMO_THEMES[0]);
  const [demoPoseIdx, setDemoPoseIdx] = useState(0);
  const [demoFilter, setDemoFilter] = useState<'none' | 'sparkles' | 'hearts' | 'cat'>('none');
  const [demoIsShooting, setDemoIsShooting] = useState(false);
  const [demoCountdown, setDemoCountdown] = useState<number | null>(null);
  const [demoFlashing, setDemoFlashing] = useState(false);
  const [demoShots, setDemoShots] = useState<string[]>([
    '/photos/frame1.webp',
    '/photos/frame2.webp',
    '/photos/frame3.webp',
    '/photos/frame4.webp',
  ]);
  const [demoStickers, setDemoStickers] = useState<string[]>(['💖', '✨']);
  const [demoCoupleName, setDemoCoupleName] = useState(`${partnerA} ♡ ${partnerB}`);

  useEffect(() => {
    setDemoCoupleName(`${partnerA} ♡ ${partnerB}`);
  }, [partnerA, partnerB]);

  const demoVideoRef = useRef<HTMLVideoElement>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement>(null);

  // Toggle live webcam in demo
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (demoMode === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((s) => {
          stream = s;
          if (demoVideoRef.current) {
            demoVideoRef.current.srcObject = s;
            demoVideoRef.current.play();
          }
        })
        .catch(() => setDemoMode('simulated'));
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [demoMode]);

  const triggerDemoShoot = () => {
    if (demoIsShooting) return;
    setDemoIsShooting(true);
    const newShots: string[] = [];

    const shootIdx = (idx: number) => {
      if (idx >= 4) {
        setDemoIsShooting(false);
        return;
      }
      setDemoPoseIdx(idx);
      setDemoCountdown(3);

      setTimeout(() => setDemoCountdown(2), 700);
      setTimeout(() => setDemoCountdown(1), 1400);
      setTimeout(() => {
        setDemoCountdown(null);
        setDemoFlashing(true);
        setTimeout(() => setDemoFlashing(false), 300);

        if (demoMode === 'webcam' && demoVideoRef.current && demoCanvasRef.current) {
          const c = demoCanvasRef.current;
          const ctx = c.getContext('2d');
          if (ctx) {
            c.width = demoVideoRef.current.videoWidth || 640;
            c.height = demoVideoRef.current.videoHeight || 480;
            ctx.drawImage(demoVideoRef.current, 0, 0, c.width, c.height);
            newShots.push(c.toDataURL('image/webp'));
            setDemoShots([...newShots]);
          }
        } else {
          newShots.push(`/photos/frame${idx + 1}.webp`);
          setDemoShots([...newShots]);
        }

        setTimeout(() => shootIdx(idx + 1), 800);
      }, 2100);
    };

    shootIdx(0);
  };

  const addDemoSticker = (stk: string) => {
    if (demoStickers.length < 6) {
      setDemoStickers([...demoStickers, stk]);
    }
  };

  const downloadDemoStrip = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = demoTheme.bg.startsWith('linear') ? '#FFFFFF' : demoTheme.bg;
    ctx.fillRect(0, 0, 600, 1600);

    // Border
    ctx.strokeStyle = demoTheme.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 568, 1568);

    // Header
    ctx.fillStyle = demoTheme.text;
    ctx.font = 'bold 24px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('dearly us · 인생네컷', 300, 60);

    // 4 Photo Frames
    for (let i = 0; i < 4; i++) {
      const y = 80 + i * 350;
      ctx.fillStyle = '#F8F9FB';
      ctx.fillRect(40, y, 520, 320);
      ctx.strokeStyle = demoTheme.border;
      ctx.strokeRect(40, y, 520, 320);

      ctx.fillStyle = '#5B5E68';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`0${i + 1} · ${cityA.toUpperCase()} ♡ ${cityB.toUpperCase()}`, 300, y + 165);
    }

    // Footer
    ctx.fillStyle = demoTheme.text;
    ctx.font = 'bold 20px Pretendard, sans-serif';
    ctx.fillText(demoCoupleName, 300, 1510);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#5B5E68';
    ctx.fillText(
      `ROOM: ${roomCode.join('')} · ${new Date().toLocaleDateString()}`,
      300,
      1540,
    );

    const a = document.createElement('a');
    a.download = `dearly-us-photostrip-${roomCode.join('')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div style={{ background: '#ECAAC2', padding: '72px 0 84px' }}>
      {/* Photobooth Live Interactive Showcase (Dearly Us 인생네컷) */}
      <section className="section" id="photobooth-demo" style={{ padding: 0, margin: 0, background: 'transparent', borderTop: 'none' }}>
        <canvas ref={demoCanvasRef} style={{ display: 'none' }} />
        <div className="wrap">
          <ScrollReveal animation="fade-up">
            <div className="section-head">
              <div className="kicker">Online Photobooth · 인생네컷</div>
              <h2>
                Capture both of you in <span className="grad">one frame</span> —
                at the exact same second.
              </h2>
              <p>
                A shared countdown fires the shot on both screens at once —
                arrange into a 4-cut photostrip you can download or print as
                fridge magnets. Try a live interactive test right here.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={0.1}>
            <div className="booth-showcase-grid">
              {/* Left: Interactive Studio Booth Stage */}
              <div className={`booth-box ${demoTheme.id === 'vintage' ? 'vintage-automat' : ''}`}>
                {/* Studio Controls Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className={`btn ${demoMode === 'simulated' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                      onClick={() => setDemoMode('simulated')}
                    >
                      👫 Couple Demo
                    </button>
                    <button
                      className={`btn ${demoMode === 'webcam' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                      onClick={() => setDemoMode('webcam')}
                    >
                      📷 Test Live Camera
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                      }}
                      onClick={() => setDemoPoseIdx((p) => (p + 1) % DEMO_POSES.length)}
                    >
                      🎲 Shuffle Pose
                    </button>
                  </div>
                </div>

                {/* Camera Viewport Screen */}
                <div className="booth-cam-stage">
                  {/* Pose Prompt Top Banner */}
                  <div className="pose-prompt-card">
                    <span>📸</span>
                    <span>{DEMO_POSES[demoPoseIdx]}</span>
                  </div>

                  {demoMode === 'webcam' ? (
                    <div className="booth-duo-view solo">
                      <div className="booth-feed-panel">
                        <video
                          ref={demoVideoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <div className="feed-city-badge pink">
                          <span className="dot"></span> You (Live Camera)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="booth-duo-view">
                      <div className="booth-feed-panel">
                        <img src="/photos/face-calgary.webp" alt="Partner 1 feed" />
                        <div className="feed-city-badge pink">
                          <span className="dot"></span> {cityA} ({partnerA})
                        </div>
                      </div>
                      <div className="booth-feed-panel">
                        <img src="/photos/face-jakarta.webp" alt="Partner 2 feed" />
                        <div className="feed-city-badge blue">
                          <span className="dot"></span> {cityB} ({partnerB})
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3..2..1 Countdown Flash */}
                  {demoCountdown !== null && (
                    <div className="booth-flash-num">{demoCountdown}</div>
                  )}

                  {/* Flash Overlay */}
                  {demoFlashing && <div className="booth-flash-overlay" />}

                  {/* Fun Augmented Reality Face Filters */}
                  {demoFilter === 'sparkles' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        display: 'flex',
                        justifyContent: 'space-around',
                        padding: '20px',
                        fontSize: '24px',
                        zIndex: 6,
                      }}
                    >
                      <span style={{ animation: 'pulse 1.5s infinite' }}>✨</span>
                      <span style={{ animation: 'pulse 1.2s infinite 0.3s' }}>🌟</span>
                      <span style={{ animation: 'pulse 1.4s infinite 0.6s' }}>✨</span>
                    </div>
                  )}
                  {demoFilter === 'hearts' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        display: 'flex',
                        justifyContent: 'space-around',
                        padding: '16px',
                        fontSize: '24px',
                        zIndex: 6,
                      }}
                    >
                      <span style={{ animation: 'float 2s infinite' }}>💖</span>
                      <span style={{ animation: 'float 2.4s infinite 0.5s' }}>💕</span>
                    </div>
                  )}
                  {demoFilter === 'cat' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '16px 40px',
                        fontSize: '28px',
                        zIndex: 6,
                      }}
                    >
                      <span>🐱</span>
                      <span>🐾</span>
                    </div>
                  )}
                </div>

                {/* Shutter Trigger & AR Filter Controls */}
                <div
                  style={{
                    marginTop: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-soft)',
                        textTransform: 'uppercase',
                        marginRight: '4px',
                      }}
                    >
                      AR Filter:
                    </span>
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'sparkles', label: '✨ Glow' },
                      { id: 'hearts', label: '💖 Hearts' },
                      { id: 'cat', label: '🐱 Cat' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setDemoFilter(f.id as any)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border:
                            demoFilter === f.id
                              ? '1.5px solid var(--pink)'
                              : '1px solid var(--line)',
                          background:
                            demoFilter === f.id ? 'var(--pink-tint)' : 'var(--paper)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-grad"
                    onClick={triggerDemoShoot}
                    disabled={demoIsShooting}
                    style={{ padding: '10px 24px', fontSize: '15px' }}
                  >
                    {demoIsShooting ? 'Taking 4 Shots 📸...' : 'Take 4 Photos 📸'}
                  </button>
                </div>

                {/* Theme Selector Palette */}
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    Photostrip Theme &amp; Room Style:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {DEMO_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setDemoTheme(theme)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border:
                            demoTheme.id === theme.id
                              ? '2px solid var(--pink)'
                              : '1px solid var(--line)',
                          background: theme.bg,
                          color: theme.text,
                          fontWeight: 700,
                          fontSize: '11.5px',
                          boxShadow: demoTheme.id === theme.id ? 'var(--shadow)' : 'none',
                          transform: demoTheme.id === theme.id ? 'scale(1.03)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Cute Stickers */}
                <div style={{ marginTop: '16px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    Add Cute Stickers:
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    {['💖', '✨', '🫰', '🌸', '👑', '💌', '🎀', '🧸', '🌟'].map(
                      (emoji, i) => (
                        <button
                          key={i}
                          onClick={() => addDemoSticker(emoji)}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            background: 'var(--paper)',
                            fontSize: '16px',
                          }}
                        >
                          {emoji}
                        </button>
                      ),
                    )}
                    {demoStickers.length > 0 && (
                      <button
                        onClick={() => setDemoStickers([])}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          background: 'none',
                          fontSize: '11px',
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Live 4-Cut Photostrip Real Output */}
              <div className="strip-preview-holder">
                <div
                  className="real-strip"
                  style={{
                    background: demoTheme.bg,
                    color: demoTheme.text,
                    borderColor: demoTheme.border,
                  }}
                >
                  <div className="real-strip-brand">DEARLY US · 인생네컷</div>

                  <div className="real-strip-frames">
                    {demoShots.map((shotUrl, idx) => (
                      <div key={idx} className="real-strip-cell">
                        <img src={shotUrl} alt={`Photobooth shot ${idx + 1}`} />
                        <span className="frame-tag">0{idx + 1}</span>
                      </div>
                    ))}
                  </div>

                  {/* Placed Stickers on strip */}
                  {demoStickers.length > 0 && (
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
                      {demoStickers.map((stk, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '18px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                          }}
                        >
                          {stk}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="real-strip-footer">
                    <input
                      type="text"
                      value={demoCoupleName}
                      onChange={(e) => setDemoCoupleName(e.target.value)}
                      className="real-strip-name"
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                      }}
                    />
                    <div className="real-strip-serial">
                      DEARLY US · <b>{roomCode.join('')}</b>
                    </div>
                  </div>
                </div>

                {/* Strip Actions */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '250px',
                  }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={downloadDemoStrip}
                    style={{ justifyContent: 'center' }}
                  >
                    Download Photo Strip 💾
                  </button>
                  <Link
                    className="btn btn-grad"
                    href="/photobooth"
                    style={{ justifyContent: 'center' }}
                  >
                    Open Full Studio ▷
                  </Link>
                  <Link
                    className="btn btn-ghost"
                    href="/shop"
                    style={{ justifyContent: 'center', fontSize: '13px' }}
                  >
                    Save Free Keepsakes 🎁
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Quiz Live Demo Showcase */}
      <section className="section" id="quiz-demo" style={{ background: 'transparent', borderTop: 'none', padding: '64px 0 0' }}>
        <div className="wrap">
          <ScrollReveal animation="fade-up">
            <div className="qd-grid">
              <div className="section-head" style={{ margin: 0 }}>
                <div className="kicker">See it in action</div>
                <h2>Watch a round of our most-played game.</h2>
                <img
                  className="qd-art"
                  src="/photos/quiz-duo.webp"
                  width="1264"
                  height="848"
                  alt="Two phones playing the couples quiz together, one pink and one blue"
                />
                <p>
                  One question, two screens. You both lock in privately — nobody
                  can peek — then the answers flip at the exact same second.
                  Match, and the confetti flies.
                </p>
                <p style={{ marginTop: '18px' }}>
                  <Link className="btn btn-primary" href="/quiz">
                    Play it free <span className="arr">▷</span>
                  </Link>
                </p>
              </div>
              <div
                className="qd-stage"
                aria-label="Animated example of a quiz round"
              >
                <div className="qd-card pink">
                  <div className="qd-who">
                    <b>{partnerA}</b> · answers honestly
                  </div>
                  <div className="qd-q">
                    What&apos;s {partnerA}&apos;s go-to karaoke song? 🎤
                  </div>
                  <div className="qd-opt pick">Bohemian Rhapsody 🎸</div>
                  <div className="qd-opt">Something by IU 🎧</div>
                  <div className="qd-opt">Rap god, allegedly 🎤</div>
                  <span className="qd-lock">locked in ✓</span>
                </div>
                <div className="qd-card blue">
                  <div className="qd-who">
                    <b>{partnerB}</b> · guesses answer
                  </div>
                  <div className="qd-q">
                    What&apos;s {partnerA}&apos;s go-to karaoke song? 🎤
                  </div>
                  <div className="qd-opt pick">Bohemian Rhapsody 🎸</div>
                  <div className="qd-opt">Something by IU 🎧</div>
                  <div className="qd-opt">Rap god, allegedly 🎤</div>
                  <span className="qd-lock">locked in ✓</span>
                </div>
                <svg
                  className="qd-cursor pink"
                  viewBox="0 0 24 24"
                  fill="#F5739E"
                  stroke="#fff"
                  strokeWidth="1.5"
                >
                  <path d="M4 2l16 7.5-7 2.2L9.8 19z" />
                </svg>
                <svg
                  className="qd-cursor blue"
                  viewBox="0 0 24 24"
                  fill="#5B8DEF"
                  stroke="#fff"
                  strokeWidth="1.5"
                >
                  <path d="M4 2l16 7.5-7 2.2L9.8 19z" />
                </svg>
                <div className="qd-badge">✓ Matched! 💞</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Keepsake Print Band */}
      <section className="section print-band" id="print" style={{ padding: '64px 0 0', margin: 0, background: 'transparent', borderTop: 'none' }}>
        <div className="wrap">
          <ScrollReveal animation="fade-up">
            <div className="pb-grid">
              <div className="pb-copy">
                <div className="kicker">Digital Keepsakes &amp; Print Sheets</div>
                <h2>
                  Preserve your memories with{' '}
                  <span className="grad">printable DIY keepsakes</span>.
                </h2>
                <p>
                  Turn today&apos;s session into printable 4×6 photo sheets,
                  couple lockscreen wallpapers, and DIY fridge magnet templates.
                </p>
                <ul className="pb-feats">
                  <li>
                    300 DPI high-res printable photo sheets for standard 4×6 paper
                  </li>
                  <li>
                    Matching couple lockscreen &amp; desktop wallpaper pairs
                  </li>
                  <li>Instant PNG &amp; PDF downloads for both of you</li>
                </ul>
                <div className="pb-cta-row">
                  <Link className="btn btn-grad" href="/shop">
                    Open Keepsakes Studio <span className="arr">▷</span>
                  </Link>
                  <span className="pb-ships">
                    ✨ 300 DPI high-res layouts · Print at home or any local photo kiosk
                  </span>
                </div>
              </div>
              <div className="pb-art">
                <div className="pb-proof" id="pb-proof">
                  <div className="strip pb-magnet" aria-hidden="true">
                    <div className="frame lit">
                      <span className="num">01</span>
                      <img
                        className="shot"
                        src="/photos/frame1.webp"
                        width="503"
                        height="377"
                        alt=""
                      />
                    </div>
                    <div className="frame lit">
                      <span className="num">02</span>
                      <img
                        className="shot"
                        src="/photos/frame2.webp"
                        width="503"
                        height="377"
                        alt=""
                      />
                    </div>
                    <div className="frame lit">
                      <span className="num">03</span>
                      <img
                        className="shot"
                        src="/photos/frame3.webp"
                        width="503"
                        height="377"
                        alt=""
                      />
                    </div>
                    <div className="serial">
                      dearly us · <b>♡ us</b>
                    </div>
                  </div>
                  <span className="pb-tag">
                    DIY<small>Print</small>
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const POSE_PROMPTS = [
  'Shot 1 of 4: Big warm smile! 📸',
  'Shot 2 of 4: Make a silly face / cheeky wink 😉',
  'Shot 3 of 4: Half-finger heart to the center 🫰',
  'Shot 4 of 4: Blow a kiss or cozy candle pose 🕯️',
];

const THEMES = [
  { id: 'classic', name: 'Classic White (인생네컷)', bg: '#FFFFFF', text: '#17181C', border: '#E3E5EA' },
  { id: 'sunset', name: 'Sunset Romance', bg: 'linear-gradient(180deg, #FFE4D6, #FFD6E8)', text: '#23242A', border: '#FFB3C7' },
  { id: 'vintage', name: 'Vintage Sepia Film', bg: '#F6EDE6', text: '#4A332D', border: '#D1C4B2' },
  { id: 'cyber', name: 'Cyber Blue', bg: '#101726', text: '#DCEBFF', border: '#5FA0FF' },
  { id: 'pastel', name: 'Soft Lavender', bg: '#F3EEFC', text: '#4D3678', border: '#D8C9F2' },
  { id: 'dark', name: 'Midnight Noir', bg: '#17181C', text: '#F8F9FB', border: '#33353D' },
];

export default function PhotoboothPage() {
  const [roomCode] = useState('KX7RM');
  const [mode, setMode] = useState<'simulated' | 'webcam'>('simulated');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [currentShot, setCurrentShot] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [capturedShots, setCapturedShots] = useState<string[]>([
    '/photos/frame1.webp',
    '/photos/frame2.webp',
    '/photos/frame3.webp',
    '/photos/frame4.webp',
  ]);
  const [isShooting, setIsShooting] = useState(false);
  const [completed, setCompleted] = useState(true);
  const [stickers, setStickers] = useState<string[]>([]);
  const [coupleName, setCoupleName] = useState('Mia ♡ Alex');
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize webcam if selected
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (mode === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
        })
        .catch(() => {
          setMode('simulated');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [mode]);

  const startPhotoSession = () => {
    setIsShooting(true);
    setCompleted(false);
    setCurrentShot(0);
    const newShots: string[] = [];

    const takeShot = (index: number) => {
      if (index >= 4) {
        setIsShooting(false);
        setCompleted(true);
        return;
      }

      setCurrentShot(index);
      setCountdown(3);

      setTimeout(() => setCountdown(2), 1000);
      setTimeout(() => setCountdown(1), 2000);
      setTimeout(() => {
        setCountdown(null);
        setFlashing(true);
        setTimeout(() => setFlashing(false), 300);

        if (mode === 'webcam' && videoRef.current && canvasRef.current) {
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
          newShots.push(`/photos/frame${index + 1}.webp`);
          setCapturedShots([...newShots]);
        }

        setTimeout(() => takeShot(index + 1), 1200);
      }, 3000);
    };

    takeShot(0);
  };

  const addSticker = (sticker: string) => {
    if (stickers.length < 8) {
      setStickers([...stickers, sticker]);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadStrip = () => {
    // Generate image on canvas and trigger download
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = selectedTheme.bg.startsWith('linear') ? '#FFFFFF' : selectedTheme.bg;
    ctx.fillRect(0, 0, 600, 1600);

    // Border
    ctx.strokeStyle = '#E3E5EA';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 568, 1568);

    // Title
    ctx.fillStyle = selectedTheme.text;
    ctx.font = 'bold 24px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('angie · 인생네컷', 300, 60);

    // Draw 4 frame boxes
    for (let i = 0; i < 4; i++) {
      const y = 80 + i * 350;
      ctx.fillStyle = '#F8F9FB';
      ctx.fillRect(40, y, 520, 320);
      ctx.strokeStyle = '#E3E5EA';
      ctx.strokeRect(40, y, 520, 320);

      // Frame text
      ctx.fillStyle = '#8B8E98';
      ctx.font = '14px monospace';
      ctx.fillText(`0${i + 1} · CALGARY ♡ JAKARTA`, 300, y + 165);
    }

    // Bottom details
    ctx.fillStyle = selectedTheme.text;
    ctx.font = 'bold 20px Pretendard, sans-serif';
    ctx.fillText(coupleName, 300, 1510);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#5B5E68';
    ctx.fillText(`ROOM: ${roomCode} · ${new Date().toLocaleDateString()}`, 300, 1540);

    const a = document.createElement('a');
    a.download = `angie-photostrip-${roomCode}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            <Link className="btn btn-ghost" href="/activity">
              All Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 32px' }}>
          <span className="eyebrow">Online Photobooth · 인생네컷</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', marginBottom: '12px' }}>
            Capture both of you in <span className="grad">one frame</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            A shared countdown fires the shot on both screens at once — arrange into a 4-cut photostrip you can download
            or print as fridge magnets.
          </p>
        </div>

        {/* Main Studio Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* Left: Interactive Studio Screen */}
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${mode === 'simulated' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                  onClick={() => setMode('simulated')}
                >
                  👫 Couple Demo Mode
                </button>
                <button
                  className={`btn ${mode === 'webcam' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                  onClick={() => setMode('webcam')}
                >
                  📷 Live Webcam
                </button>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                {isShooting ? POSE_PROMPTS[currentShot] : 'Ready to shoot!'}
              </div>
            </div>

            {/* Live Camera Viewport / Simulated Dual Window */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/10',
                background: '#17181C',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {mode === 'webcam' ? (
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
                  <div style={{ position: 'relative', borderRight: '2px solid rgba(255,255,255,0.2)' }}>
                    <img
                      src="/photos/face-calgary.webp"
                      alt="Calgary camera"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        bottom: '12px',
                        background: 'rgba(23,24,28,0.7)',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Calgary (Mia)
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <img
                      src="/photos/face-jakarta.webp"
                      alt="Jakarta camera"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        bottom: '12px',
                        background: 'rgba(23,24,28,0.7)',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Jakarta (Alex)
                    </span>
                  </div>
                </div>
              )}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    background: 'rgba(23,24,28,0.3)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontFamily: 'var(--font-display)',
                    fontSize: '120px',
                    fontWeight: 900,
                  }}
                >
                  {countdown}
                </div>
              )}

              {/* Camera Flash */}
              {flashing && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 20,
                    background: '#FFFFFF',
                    opacity: 0.95,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>

            {/* Pose Helper & Controls */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontWeight: 600 }}>Pose Suggestion: </span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  {isShooting ? POSE_PROMPTS[currentShot] : 'Pick your favorite theme and smile together!'}
                </span>
              </div>

              <button
                className="btn btn-grad"
                onClick={startPhotoSession}
                disabled={isShooting}
                style={{ padding: '12px 28px', fontSize: '16px' }}
              >
                {isShooting ? 'Capturing 4 Shots...' : 'Take 4 Photos 📸'}
              </button>
            </div>

            {/* Filter / Frame Themes */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Select Photo Strip Theme:
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: selectedTheme.id === theme.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                      background: theme.bg,
                      color: theme.text,
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: selectedTheme.id === theme.id ? 'var(--shadow)' : 'none',
                      transform: selectedTheme.id === theme.id ? 'scale(1.04)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker Accessories */}
            <div style={{ marginTop: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Add Cute Stickers:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['💖', '✨', '🫰', '🌸', '👑', '🕊️', '💌', '🎀', '🧸', '🌟'].map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => addSticker(emoji)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontSize: '18px',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
                {stickers.length > 0 && (
                  <button
                    onClick={() => setStickers([])}
                    style={{
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontSize: '12px',
                      color: 'var(--ink-soft)',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Stickers
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Finished 4-Cut Photostrip Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '260px',
                background: selectedTheme.bg,
                color: selectedTheme.text,
                border: `1px solid ${selectedTheme.border}`,
                borderRadius: '8px',
                padding: '16px 14px 20px',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
              }}
            >
              {/* Header on Strip */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '.18em',
                  textAlign: 'center',
                  paddingBottom: '10px',
                  fontWeight: 700,
                }}
              >
                ANGIE · 인생네컷
              </div>

              {/* 4 Photo Frames */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {capturedShots.map((shot, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      background: 'var(--paper)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <img src={shot} alt={`Strip frame ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '6px',
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(255,255,255,0.7)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        color: '#17181C',
                      }}
                    >
                      0{idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Placed Stickers */}
              {stickers.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '-10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {stickers.map((s, i) => (
                    <span key={i} style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Strip Footer & Serial */}
              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <input
                  type="text"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: 'inherit',
                    outline: 'none',
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9.5px',
                    letterSpacing: '.2em',
                    opacity: 0.7,
                    marginTop: '4px',
                  }}
                >
                  ANGIE · <b>{roomCode}</b>
                </div>
              </div>
            </div>

            {/* Actions for strip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px' }}>
              <button className="btn btn-primary" onClick={downloadStrip} style={{ justifyContent: 'center' }}>
                Download Photo Strip 💾
              </button>
              <button className="btn btn-ghost" onClick={copyShareLink} style={{ justifyContent: 'center' }}>
                {copied ? '✓ Link Copied!' : 'Share with Partner 🔗'}
              </button>
              <Link className="btn btn-grad" href="/shop" style={{ justifyContent: 'center' }}>
                Print as Magnet ($12) 🧲
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

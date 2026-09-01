'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { ShinyText, AuroraBackground, SpotlightCard, MagnetButton } from '@/components/ui';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [roomCode] = useState(['K', 'X', '7', 'R', 'M']);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nickname, setNickname] = useState('Mia');
  const [partnerName, setPartnerName] = useState('Alex');

  // Presence cursors state
  const blueCursorRef = useRef<HTMLDivElement>(null);
  const pinkCursorRef = useRef<HTMLDivElement>(null);

  // Demo Section Photobooth State
  const DEMO_THEMES = [
    { id: 'classic', name: 'Classic White (인생네컷)', bg: '#FFFFFF', text: '#17181C', border: '#E3E5EA' },
    { id: 'vintage', name: 'Vintage 1930s Automat', bg: '#F6EDE6', text: '#4A332D', border: '#D1C4B2' },
    { id: 'sunset', name: 'Sunset Romance', bg: 'linear-gradient(180deg, #FFE4D6, #FFD6E8)', text: '#23242A', border: '#FFB3C7' },
    { id: 'cyber', name: 'Cyber Blue', bg: '#101726', text: '#DCEBFF', border: '#5FA0FF' },
    { id: 'noir', name: 'Midnight Noir', bg: '#17181C', text: '#F8F9FB', border: '#33353D' },
    { id: 'lavender', name: 'Soft Lavender', bg: '#F3EEFC', text: '#4D3678', border: '#D8C9F2' },
  ];

  const DEMO_POSES = [
    'Pose 1: Big warm smile at the camera! 📸',
    'Pose 2: Silly pucker or wink 😉',
    'Pose 3: Half-finger heart meeting in the center 🫰',
    'Pose 4: Blow a kiss or cozy candlelit dinner 🕯️',
  ];

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
  const [demoCoupleName, setDemoCoupleName] = useState('Mia ♡ Alex');
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
    ctx.fillText('angie · 인생네컷', 300, 60);

    // 4 Photo Frames
    for (let i = 0; i < 4; i++) {
      const y = 80 + i * 350;
      ctx.fillStyle = '#F8F9FB';
      ctx.fillRect(40, y, 520, 320);
      ctx.strokeStyle = demoTheme.border;
      ctx.strokeRect(40, y, 520, 320);

      ctx.fillStyle = '#5B5E68';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`0${i + 1} · CALGARY ♡ JAKARTA`, 300, y + 165);
    }

    // Footer
    ctx.fillStyle = demoTheme.text;
    ctx.font = 'bold 20px Pretendard, sans-serif';
    ctx.fillText(demoCoupleName, 300, 1510);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#5B5E68';
    ctx.fillText(`ROOM: ${roomCode.join('')} · ${new Date().toLocaleDateString()}`, 300, 1540);

    const a = document.createElement('a');
    a.download = `angie-photostrip-${roomCode.join('')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  // Presence cursors wandering animation
  useEffect(() => {
    let animId: number;
    let t = 0;
    const width = window.innerWidth;
    if (width <= 560) return;

    let bX = width * 0.72;
    let bY = 220;
    let pX = width * 0.28;
    let pY = 380;

    let targetBX = bX;
    let targetBY = bY;
    let targetPX = pX;
    let targetPY = pY;

    const interval = setInterval(() => {
      t += 1;
      const w = window.innerWidth;
      targetBX = w * (0.45 + 0.35 * Math.sin(t * 0.7));
      targetBY = 150 + 260 * Math.abs(Math.cos(t * 0.5));
      targetPX = w * (0.12 + 0.38 * Math.cos(t * 0.6));
      targetPY = 200 + 240 * Math.abs(Math.sin(t * 0.8));
    }, 2200);

    const loop = () => {
      bX += (targetBX - bX) * 0.025;
      bY += (targetBY - bY) * 0.025;
      pX += (targetPX - pX) * 0.025;
      pY += (targetPY - pY) * 0.025;

      if (blueCursorRef.current) {
        blueCursorRef.current.style.transform = `translate(${bX}px, ${bY}px)`;
      }
      if (pinkCursorRef.current) {
        pinkCursorRef.current.style.transform = `translate(${pX}px, ${pY}px)`;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Photobooth Develop Cycle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const runCycle = () => {
      setLitFrames([false, false, false, false]);
      setShotStep(0);

      const shootFrame = (frameIdx: number) => {
        if (frameIdx >= 4) {
          setShotStep(4);
          // Restart after pause
          timer = setTimeout(runCycle, 9000);
          return;
        }

        // 3..2..1 countdown
        setCountNum('3');
        setTimeout(() => setCountNum('2'), 500);
        setTimeout(() => setCountNum('1'), 1000);
        setTimeout(() => {
          setCountNum('');
          setFlashing(true);
          setTimeout(() => setFlashing(false), 280);

          setLitFrames((prev) => {
            const next = [...prev];
            next[frameIdx] = true;
            return next;
          });
          setShotStep(frameIdx + 1);

          timer = setTimeout(() => shootFrame(frameIdx + 1), 600);
        }, 1500);
      };

      timer = setTimeout(() => shootFrame(0), 1800);
    };

    runCycle();
    return () => clearTimeout(timer);
  }, []);

  // Stats count up on view
  useEffect(() => {
    let start: number | null = null;
    const duration = 1600;
    const targetDates = 24890;
    const targetSessions = 18450;
    const targetStrips = 52180;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setDatesCount(Math.floor(targetDates * ease));
      setSessionsCount(Math.floor(targetSessions * ease));
      setStripsCount(Math.floor(targetStrips * ease));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, []);

  const handleCellChange = (index: number, val: string) => {
    if (!val) return;
    const next = [...roomCode];
    next[index] = val.slice(-1).toUpperCase();
    setRoomCode(next);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode.join(''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Tagline Ribbon */}
      <div className="ribbon">
        <span className="ribbon-in">
          ♡ Making LDR couples experience dates like other couples · <b>13 Realtime Games Live</b>
        </span>
      </div>

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
          <nav>
            <Link href="/activity">Activities</Link>
            <Link href="/photobooth">Photobooth</Link>
            <Link href="/blog">Blog</Link>
            <a href="#faq">FAQ</a>
            <Link className="nav-shop" href="/shop" aria-label="Print shop" title="Print shop">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 8h14l-1.2 12.1a1.5 1.5 0 0 1-1.5 1.4H7.7a1.5 1.5 0 0 1-1.5-1.4L5 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <button
              className="nav-profile"
              onClick={() => setProfileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Profile
            </button>
            <Link className="btn btn-grad cta-nav" href="/activity">
              Browse activities <span className="arr">▷</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="top" style={{ position: 'relative', overflow: 'hidden' }}>
        <AuroraBackground />
        {/* Animated Presence Cursors */}
        <div className="cursor-layer" id="cursors">
          <div className="cursor blue" ref={blueCursorRef}>
            <svg width="30" height="34" viewBox="0 0 30 34">
              <path
                d="M3 2 L3 28 L10 21 L15 31 L19 29 L14 19 L24 19 Z"
                fill="#5FA0FF"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tag">{partnerName} (Jakarta)</span>
          </div>
          <div className="cursor pink" ref={pinkCursorRef}>
            <svg width="30" height="34" viewBox="0 0 30 34">
              <path
                d="M3 2 L3 28 L10 21 L15 31 L19 29 L14 19 L24 19 Z"
                fill="#FF7BA3"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tag">{nickname} (Calgary)</span>
          </div>
        </div>

        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-copy">
            <span className="eyebrow">
              made for two · <ShinyText text="17 realtime activities" />
            </span>
            <h1>
              Fun Dates for
              <br />
              <span className="pink">Long</span> <span className="blue">Distance</span>
              <br />
              Relationships
            </h1>
            <p className="lede">
              This was made for my LDR girlfriend, Angie. This is our little hub of dates and activities
              that kept us together through the distance this past 2 years. I hope you&apos;ll enjoy them too!
            </p>
            <div className="cta-row">
              <Link className="btn btn-grad" href="/activity">
                Pick an activity <span className="arr">▷</span>
              </Link>
              <Link className="btn btn-ghost" href="/photobooth">
                Open the photobooth
              </Link>
            </div>
            <div className="cta-row">
              <a
                className="appstore"
                href="https://apps.apple.com/id/app/angie-long-distance-couples/id6790503277"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.7 12.9c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.5 2 1 0 1.4-.6 2.6-.6s1.5.6 2.6.6c1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3zM14.7 6.4c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.4 1.3-.5.6-1 1.6-.8 2.5.9.1 1.9-.5 2.4-1.2z" />
                </svg>
                <span className="as-t">
                  <small>Download our app on</small>
                  <b>the App Store</b>
                </span>
              </a>
            </div>
            <p className="platforms" aria-label="Available on web, Android and Apple">
              <span className="plat-label">available on</span>
              <span className="plat">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M3 12h18M12 3c2.6 2.5 3.9 5.6 3.9 9S14.6 18.5 12 21c-2.6-2.5-3.9-5.6-3.9-9S9.4 5.5 12 3z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>{' '}
                Web
              </span>
              <span className="plat">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7.2 8.6h9.6c.4 0 .7.3.7.7v6.9a2 2 0 0 1-2 2h-.4v2.6a1.1 1.1 0 1 1-2.2 0v-2.6h-1.8v2.6a1.1 1.1 0 1 1-2.2 0v-2.6h-.4a2 2 0 0 1-2-2V9.3c0-.4.3-.7.7-.7zM4.4 9.1c.6 0 1.1.5 1.1 1.1v4.6a1.1 1.1 0 1 1-2.2 0v-4.6c0-.6.5-1.1 1.1-1.1zm15.2 0c.6 0 1.1.5 1.1 1.1v4.6a1.1 1.1 0 1 1-2.2 0v-4.6c0-.6.5-1.1 1.1-1.1zM15.5 3.2l1-1.5a.3.3 0 0 0-.5-.3l-1 1.6a6.3 6.3 0 0 0-5.9 0L8 1.4a.3.3 0 0 0-.5.3l1 1.5A5.4 5.4 0 0 0 6.5 7.7h11a5.4 5.4 0 0 0-2-4.5zM9.6 5.9a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2zm4.9 0a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2z" />
                </svg>{' '}
                Android
              </span>
              <span className="plat">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.7 12.9c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.5 2 1 0 1.4-.6 2.6-.6s1.5.6 2.6.6c1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3zM14.7 6.4c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.4 1.3-.5.6-1 1.6-.8 2.5.9.1 1.9-.5 2.4-1.2z" />
                </svg>{' '}
                iOS
              </span>
            </p>
            <p className="assure">
              <span>● you</span> &nbsp;+&nbsp; <span>● me</span>
            </p>
          </div>

          {/* Hero 3D Globe Projection & Photobooth Machine */}
          <div className="stage">
            <div className="globe">
              <svg className="gl-map" viewBox="0 0 600 600" aria-hidden="true">
                <defs>
                  <radialGradient id="gl-sphere" cx="34%" cy="27%" r="78%">
                    <stop offset="0%" stopColor="#9FD2F5" />
                    <stop offset="34%" stopColor="#79B7EA" />
                    <stop offset="68%" stopColor="#5495D6" />
                    <stop offset="100%" stopColor="#3A6FAE" />
                  </radialGradient>
                  <linearGradient id="gl-landfill" x1=".15" y1="0" x2=".9" y2=".9">
                    <stop offset="0%" stopColor="#6FD189" />
                    <stop offset="45%" stopColor="#41B76B" />
                    <stop offset="78%" stopColor="#2A9A57" />
                    <stop offset="100%" stopColor="#1C7A47" />
                  </linearGradient>
                  <linearGradient id="gl-arc-a" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#FF7BA3" stopOpacity=".15" />
                    <stop offset="100%" stopColor="#FF7BA3" stopOpacity=".95" />
                  </linearGradient>
                  <linearGradient id="gl-arc-b" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5FA0FF" stopOpacity=".15" />
                    <stop offset="100%" stopColor="#5FA0FF" stopOpacity=".95" />
                  </linearGradient>
                  <clipPath id="gl-clip">
                    <circle cx="300" cy="300" r="252" />
                  </clipPath>
                </defs>

                {/* Lit sphere background */}
                <circle cx="300" cy="300" r="252" fill="#7FC0FF" opacity=".40" className="gl-halo" />
                <circle cx="300" cy="300" r="252" fill="url(#gl-sphere)" />

                {/* Globe continent paths & graticules */}
                <g clipPath="url(#gl-clip)">
                  {/* Continents */}
                  <path
                    className="gl-land"
                    d="M 120 180 Q 180 140 240 180 T 360 220 T 460 160 Q 520 220 480 340 T 360 440 T 200 420 Q 110 320 120 180 Z"
                  />
                  <path
                    className="gl-glow"
                    d="M 140 200 Q 200 160 260 200 T 380 240 T 440 180 Q 490 230 460 330 T 340 420 T 220 400 Z"
                  />
                  {/* Meridian graticules */}
                  <ellipse cx="300" cy="300" rx="210" ry="250" className="gl-grat" />
                  <ellipse cx="300" cy="300" rx="140" ry="250" className="gl-grat" />
                  <ellipse cx="300" cy="300" rx="70" ry="250" className="gl-grat" />
                  <line x1="48" y1="300" x2="552" y2="300" className="gl-grat" />
                  <line x1="80" y1="200" x2="520" y2="200" className="gl-grat" />
                  <line x1="80" y1="400" x2="520" y2="400" className="gl-grat" />

                  {/* Arcs connecting Calgary & Jakarta */}
                  <path d="M 478 214 C 418 188 360 220 320 286" className="gl-arc pink" />
                  <path d="M 126 392 C 188 420 244 386 282 312" className="gl-arc blue" />
                </g>
              </svg>

              {/* Calgary Node */}
              <figure className="gnode a">
                <span className="gpin" aria-hidden="true"></span>
                <span className="gring" aria-hidden="true"></span>
                <img
                  className="gface"
                  src="/photos/face-calgary.webp"
                  width="92"
                  height="92"
                  alt="One half of the couple in Calgary"
                />
                <figcaption className="gcard">
                  <b>Calgary</b>
                  <span>Canada</span>
                </figcaption>
              </figure>

              {/* Jakarta Node */}
              <figure className="gnode b">
                <span className="gpin" aria-hidden="true"></span>
                <span className="gring" aria-hidden="true"></span>
                <img
                  className="gface"
                  src="/photos/face-jakarta.webp"
                  width="92"
                  height="92"
                  alt="Other half of the couple in Jakarta"
                />
                <figcaption className="gcard">
                  <b>Jakarta</b>
                  <span>Indonesia</span>
                </figcaption>
              </figure>

              {/* The Photobooth Machine */}
              <div className="booth">
                <div className="booth-head" aria-hidden="true">
                  <span className="bh-light l"></span>
                  <span className="bh-lens"></span>
                  <span className="bh-light r"></span>
                  <span className="bh-slot"></span>
                </div>

                <div className="prints">
                  {/* Active Animated Strip */}
                  <div className="strip" id="strip">
                    <div className="shotcount">shot {shotStep} / 4 {shotStep === 4 ? '✓' : ''}</div>
                    <div className="count">
                      <span className="num">{countNum}</span>
                    </div>
                    {flashing && <div className="flash" style={{ opacity: 0.9 }}></div>}

                    <div className={`frame ${litFrames[0] ? 'lit' : ''}`}>
                      <span className="num">01</span>
                      <img className="shot" src="/photos/frame1.webp" width="503" height="377" alt="Photobooth shot 1" />
                    </div>
                    <div className={`frame ${litFrames[1] ? 'lit' : ''}`}>
                      <span className="num">02</span>
                      <img className="shot" src="/photos/frame2.webp" width="503" height="377" alt="Photobooth shot 2" />
                    </div>
                    <div className={`frame ${litFrames[2] ? 'lit' : ''}`}>
                      <span className="num">03</span>
                      <img className="shot" src="/photos/frame3.webp" width="503" height="377" alt="Photobooth shot 3" />
                    </div>
                    <div className={`frame ${litFrames[3] ? 'lit' : ''}`}>
                      <span className="num">04</span>
                      <img className="shot" src="/photos/frame4.webp" width="503" height="377" alt="Photobooth shot 4" />
                    </div>
                    <div className="serial">
                      angie · <b>KX7RM</b>
                    </div>
                  </div>

                  {/* Secondary Decorative Strip */}
                  <div className="strip" id="strip2" aria-hidden="true">
                    <div className="frame lit">
                      <span className="num">01</span>
                      <img className="shot" src="/photos/b1.webp" width="503" height="377" alt="" />
                    </div>
                    <div className="frame lit">
                      <span className="num">02</span>
                      <img className="shot" src="/photos/b2.webp" width="503" height="377" alt="" />
                    </div>
                    <div className="frame lit">
                      <span className="num">03</span>
                      <img className="shot" src="/photos/b3.webp" width="503" height="377" alt="" />
                    </div>
                    <div className="frame lit">
                      <span className="num">04</span>
                      <img className="shot" src="/photos/b4.webp" width="503" height="377" alt="" />
                    </div>
                    <div className="serial">
                      angie · <b>7K2QF</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* August 1st Girlfriends Day Special Band */}
      <section className="section august-band" id="august-band">
        <div className="wrap">
          <Link className="august-card" href="/august">
            <span className="august-art">
              <img
                src="/august/gate.webp"
                alt="Watercolor painting of a couple walking into a garden"
                width="1440"
                height="930"
              />
              <span className="august-stamp">August 1 · Girlfriends Day</span>
            </span>
            <span className="august-body">
              <span className="august-eyebrow">Girlfriends Day Special</span>
              <h2>
                The <em>Couples Day Date</em> — a whole evening, already planned.
              </h2>
              <p>
                Seven things to play together in one shared room, from two cities. It starts easy,
                gets honest, and ends with the two of you designing matching outfits you both wear.
              </p>

              <ul className="august-run" style={{ marginTop: '20px' }}>
                <li><b>01</b> Photobooth</li>
                <li><b>02</b> Love Match</li>
                <li><b>03</b> Riddles</li>
                <li><b>04</b> Know-me quiz</li>
                <li><b>05</b> Debate</li>
                <li><b>06</b> Honest Cards</li>
                <li><b>07</b> Design the outfits</li>
              </ul>
              <span className="august-cta">
                <span className="btn">
                  Start Date Night Plan <span className="arr">▷</span>
                </span>
                <span className="when">two hours · she needs no account</span>
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* Closer Headline & Interactive Code Joiner */}
      <section className="section closer">
        <div className="wrap">
          <div className="closer-grid">
            <div>
              <h2>
                One hub of games &amp; dates for <span className="grad">long-distance couples</span>.
              </h2>
            </div>
            <div className="closer-aside">
              <p>
                Seventeen realtime games and dates you play in one shared room, at the same second.
                Open a room and send the code — they&apos;ll be there in a tap.
              </p>
              <div className="cta-row">
                <Link className="btn btn-grad" href="/activity">
                  Browse all activities <span className="arr">▷</span>
                </Link>
                <Link className="btn btn-ghost" href="/photobooth">
                  Join with a code
                </Link>
              </div>
              <div className="joincode">
                have a code? &nbsp;
                <div className="cells">
                  {roomCode.map((char, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleCellChange(idx, e.target.value)}
                      style={{
                        width: '32px',
                        height: '40px',
                        textAlign: 'center',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '17px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--paper-raised)',
                        color: 'var(--ink)',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={copyCode}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--pink)',
                    cursor: 'pointer',
                    marginLeft: '6px',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band (Social Proof) */}
      <section className="section stats" id="stats">
        <div className="wrap">
          <div className="statgrid">
            <div className="stat">
              <div className="n">{datesCount.toLocaleString()}+</div>
              <div className="l">active dates</div>
            </div>
            <div className="stat">
              <div className="n">{sessionsCount.toLocaleString()}+</div>
              <div className="l">photobooth sessions</div>
            </div>
            <div className="stat">
              <div className="n">{stripsCount.toLocaleString()}+</div>
              <div className="l">photostrips printed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Hub Directory */}
      <section className="section" id="activities">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">Activities to do together, apart</div>
            <h2 className="label-h">
              Pick tonight&apos;s <span className="grad">activity</span>.
            </h2>
            <p style={{ marginTop: '18px' }}>
              <Link className="btn btn-grad" href="/activity">
                Browse all activities <span className="arr">▷</span>
              </Link>
            </p>
          </div>

          {/* New spotlight cards */}
          <div className="spot">
            <span className="spot-label">New · the ones we can&apos;t stop playing</span>
            <Link className="act" href="/letter">
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="4" y="8" width="26" height="18" rx="2.5" stroke="#FF7BA3" strokeWidth="2" />
                  <path
                    d="M4.8 9.6L17 18.4 29.2 9.6"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="26" cy="24" r="6" fill="#fff" stroke="#5FA0FF" strokeWidth="2" />
                  <path
                    d="M26 21v3l2 1.4"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Letters to the Future <span className="badge new">New</span>
              </h3>
              <p>
                Write to the two of you years from now. Pick a date up to twelve years out — we hold the letter sealed until
                that morning, then send it to you, to them, or to both.
              </p>
              <span className="go">
                Write a letter <span className="arr">▷</span>
              </span>
            </Link>

            <Link className="act" href="/scrapbook">
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="5" y="5" width="24" height="24" rx="2.5" stroke="#5FA0FF" strokeWidth="2" />
                  <path d="M10 5v24" stroke="#5FA0FF" strokeWidth="2" />
                  <rect x="14" y="10" width="11" height="8" rx="1" stroke="#FF7BA3" strokeWidth="2" />
                  <path d="M14 23h11" stroke="#FF7BA3" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>
                Digital Scrapbook <span className="badge new">New</span>
              </h3>
              <p>
                The one thing here you come back to. Tape your real photostrips onto paper pages, draw on them, write
                captions in your own hand — both of you on the same page at once.
              </p>
              <span className="go">
                Open the book <span className="arr">▷</span>
              </span>
            </Link>

            <Link className="act" href="/birthday">
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="5" y="14" width="24" height="15" rx="2" stroke="#5FA0FF" strokeWidth="2" />
                  <path d="M5 19h24M17 14v15" stroke="#5FA0FF" strokeWidth="2" />
                  <path
                    d="M17 13.5s-5-2.6-5-5.6a2.6 2.6 0 014.3-1.8A2.6 2.6 0 0122 7.9c0 3-5 5.6-5 5.6z"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Birthday Gift Page <span className="badge new">New</span>
              </h3>
              <p>
                Build them a birthday page — a letter that types itself out, your photos, a live count of days together —
                then hand it over as a heart-shaped QR code they can scan.
              </p>
              <span className="go">
                Make their page <span className="arr">▷</span>
              </span>
            </Link>
          </div>

          <div className="grid-label">All games &amp; activities</div>
          <div className="acts">
            {/* Featured Wide Photobooth Tile */}
            <Link className="act feature" href="/photobooth">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="4" y="9" width="26" height="19" rx="3" stroke="#17181C" strokeWidth="2" />
                  <path d="M12 9l2-4h6l2 4" stroke="#17181C" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="17" cy="18" r="5" stroke="#FF7BA3" strokeWidth="2" />
                  <circle cx="26" cy="13" r="1.6" fill="#5FA0FF" />
                </svg>
              </div>
              <div className="copy">
                <h3>
                  Online Photobooth <span className="badge on">Always free</span>
                </h3>
                <p>
                  The realtime 인생네컷 booth for two — a shared countdown fires the shot on both screens at once, so every
                  frame holds both of you.
                </p>
              </div>
              <span className="arr-go">Open the booth ▷</span>
            </Link>

            <Link className="act" href="/quiz">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M10 7a3.5 3.5 0 013.6 3.6c0 2.6-3.6 3.4-3.6 6"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="22" r="1.5" fill="#FF7BA3" />
                  <path
                    d="M24 28s-6-3.6-6-8.2a3 3 0 015.2-2.1 3 3 0 015.2 2.1C28.4 24.4 24 28 24 28z"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Know Me Quiz <span className="badge hot">★ Most played</span>
              </h3>
              <p>Lock in privately, reveal together, score your compatibility — 17 packs from cute to spicy.</p>
            </Link>

            <Link className="act" href="/host">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>🎙️</span>
              </div>
              <h3>
                Date Host <span className="badge new">New</span>
              </h3>
              <p>An observant host reacts to your answers and crafts dynamic follow-up dilemmas in real time.</p>
            </Link>

            <Link className="act" href="/match">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M13 25S4 19.4 4 13.6A4.2 4.2 0 0111.6 11"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 25s9-5.6 9-11.4A4.2 4.2 0 0022.4 11"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17h3l2-3 3 6 2-3h3"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Love Match <span className="badge new">New</span>
              </h3>
              <p>Take the same personality test at the same instant — 16 types, Big Five, the stars — and get your match score.</p>
            </Link>

            <Link className="act" href="/dare">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="4" y="10" width="17" height="17" rx="3" stroke="#17181C" strokeWidth="2" />
                  <circle cx="9.5" cy="15.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="15.5" cy="15.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="9.5" cy="21.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="15.5" cy="21.5" r="1.6" fill="#5FA0FF" />
                  <path
                    d="M25 15s-5-3.2-5-6.4a2.6 2.6 0 014.5-1.8A2.6 2.6 0 0129 8.6C29 11.8 25 15 25 15z"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 19l2 3.2-3.2 1 2 3.2"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Truth or Dare <span className="badge new">New</span>
              </h3>
              <p>Seal a stake, battle through 20 tiny minigames — the loser of every round picks truth or dare.</p>
            </Link>

            <Link className="act" href="/future">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <circle cx="17" cy="19" r="6" stroke="#FF7BA3" strokeWidth="2" />
                  <path d="M4 25h26" stroke="#17181C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17 7v3M7 11l2 2M27 11l-2 2" stroke="#5FA0FF" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 29h16" stroke="#5FA0FF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>
                Our Future <span className="badge new">New</span>
              </h3>
              <p>Design your future together — home, travel, money, tiny humans — then turn it into a scrapbook vision board + plan.</p>
            </Link>

            <Link className="act" href="/arcade">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="4" y="7" width="26" height="17" rx="3" stroke="#17181C" strokeWidth="2" />
                  <circle cx="11" cy="15" r="3" stroke="#FF7BA3" strokeWidth="2" />
                  <path d="M11 12v-4" stroke="#FF7BA3" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="22" cy="14" r="1.6" fill="#5FA0FF" />
                  <circle cx="26" cy="17" r="1.6" fill="#5FA0FF" />
                  <path d="M11 28h12" stroke="#17181C" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Arcade</h3>
              <p>Your face on cartoon legs in ten tiny games — flappy, tetris duel, whack-a-partner.</p>
            </Link>

            <Link className="act" href="/debate">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="3" y="5" width="17" height="13" rx="3" stroke="#FF7BA3" strokeWidth="2" />
                  <path d="M9 18l-2 4 5-2" stroke="#FF7BA3" strokeWidth="2" strokeLinejoin="round" />
                  <rect x="14" y="14" width="17" height="13" rx="3" stroke="#5FA0FF" strokeWidth="2" />
                  <path d="M25 27l2 4-5-2" stroke="#5FA0FF" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Couples Debate</h3>
              <p>Argue it out on camera — an AI judge scores every round and crowns a winner.</p>
            </Link>

            <Link className="act" href="/draw">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="4" y="4" width="26" height="26" rx="3" stroke="#17181C" strokeWidth="2" />
                  <path d="M22 8l4 4-12 12-4 1 1-4z" stroke="#FF7BA3" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M7 27c3-5 6 1 9-3" stroke="#5FA0FF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Draw Together</h3>
              <p>Same prompt, two canvases — watch each other&apos;s strokes appear live.</p>
            </Link>

            <Link className="act" href="/court">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path d="M17 5v22" stroke="#17181C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 12h22" stroke="#17181C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 12l-3 7h6z" stroke="#FF7BA3" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M28 12l-3 7h6z" stroke="#5FA0FF" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M12 29h10" stroke="#17181C" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Couples Court</h3>
              <p>Plead your case, snap photo evidence — the AI judge delivers a verdict.</p>
            </Link>

            <Link className="act" href="/hunt">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <circle cx="15" cy="15" r="9" stroke="#FF7BA3" strokeWidth="2" />
                  <path d="M21.5 21.5l7 7" stroke="#5FA0FF" strokeWidth="2" strokeLinecap="round" />
                  <path d="M15 11v8M11 15h8" stroke="#5FA0FF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Snap Hunt</h3>
              <p>Race your homes to match a loose clue — cleverest find takes the round.</p>
            </Link>

            <Link className="act" href="/riddle">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M13 5a6 6 0 016.2 6.2c0 4.4-6.2 5.8-6.2 10.2"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="13" cy="27" r="2" fill="#FF7BA3" />
                  <path
                    d="M24 16l2 4.2 4.6.6-3.4 3.2.9 4.6L24 26.4l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6z"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Riddle Night</h3>
              <p>The legendary riddles — talk them out, lock in privately, reveal together.</p>
            </Link>

            <Link className="act" href="/iq">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect x="4" y="4" width="11" height="11" rx="2" stroke="#FF7BA3" strokeWidth="2" />
                  <rect x="19" y="4" width="11" height="11" rx="2" stroke="#5FA0FF" strokeWidth="2" />
                  <rect x="4" y="19" width="11" height="11" rx="2" stroke="#5FA0FF" strokeWidth="2" />
                  <path d="M21 24.5h7M24.5 21v7" stroke="#FF7BA3" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>IQ Duel</h3>
              <p>The same puzzles on both screens, against the clock — nothing reveals till the end.</p>
            </Link>

            <Link className="act" href="/lab">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M14 5h6M15 5v8l7 12a2.5 2.5 0 01-2.2 3.8H11.2A2.5 2.5 0 019 25l7-12V5"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path d="M12 21h10" stroke="#5FA0FF" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="15" cy="24.5" r="1.4" fill="#FF7BA3" />
                  <circle cx="19" cy="25.5" r="1.1" fill="#FF7BA3" />
                </svg>
              </div>
              <h3>
                The Lab <span className="badge new">New</span>
              </h3>
              <p>A study date with a scoreboard — real math &amp; science, versus or co-op.</p>
            </Link>

            <Link className="act" href="/cards">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>💌</span>
              </div>
              <h3>
                Honest Cards <span className="badge new">New</span>
              </h3>
              <p>A deck of honest questions — you both answer privately, it opens at once.</p>
            </Link>
            <Link className="act" href="/timezone">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>🌍</span>
              </div>
              <h3>
                Timezone Hub <span className="badge hot">★ Essential</span>
              </h3>
              <p>Visual 24h sun/moon horizon, golden overlap hours, and a millisecond airport reunion countdown.</p>
            </Link>

            <Link className="act" href="/bucket">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>🎯</span>
              </div>
              <h3>
                100 Dates Bucket List <span className="badge new">New</span>
              </h3>
              <p>Scratch off milestone cards from late-night video call dates to airport hugs and grocery runs.</p>
            </Link>

            <Link className="act" href="/scrapbook">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>📖</span>
              </div>
              <h3>
                Digital Scrapbook <span className="badge new">New</span>
              </h3>
              <p>Tape down photostrips, boarding passes, washi tape, and sticky notes on a shared memory corkboard.</p>
            </Link>

            <Link className="act" href="/letter">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>💌</span>
              </div>
              <h3>
                Time Capsule Letters <span className="badge new">New</span>
              </h3>
              <p>Write letters to future you, sealed in a vault until your chosen reunion anniversary.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Photobooth Live Interactive Showcase (Angie 인생네컷) */}
      <section className="section" id="photobooth-demo">
        <canvas ref={demoCanvasRef} style={{ display: 'none' }} />
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">Online Photobooth · 인생네컷</div>
            <h2>
              Capture both of you in <span className="grad">one frame</span> — at the exact same second.
            </h2>
            <p>
              A shared countdown fires the shot on both screens at once — arrange into a 4-cut photostrip you can download
              or print as fridge magnets. Try a live interactive test right here.
            </p>
          </div>

          <div className="booth-showcase-grid">
            {/* Left: Interactive Studio Booth Stage */}
            <div className={`booth-box ${demoTheme.id === 'vintage' ? 'vintage-automat' : ''}`}>
              {/* Studio Controls Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
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
                    style={{ padding: '5px 12px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
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
                      <video ref={demoVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="feed-city-badge pink">
                        <span className="dot"></span> You (Live Camera)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="booth-duo-view">
                    <div className="booth-feed-panel">
                      <img src="/photos/face-calgary.webp" alt="Calgary feed" />
                      <div className="feed-city-badge pink">
                        <span className="dot"></span> Calgary (Mia)
                      </div>
                    </div>
                    <div className="booth-feed-panel">
                      <img src="/photos/face-jakarta.webp" alt="Jakarta feed" />
                      <div className="feed-city-badge blue">
                        <span className="dot"></span> Jakarta (Alex)
                      </div>
                    </div>
                  </div>
                )}

                {/* 3..2..1 Countdown Flash */}
                {demoCountdown !== null && <div className="booth-flash-num">{demoCountdown}</div>}

                {/* Camera Flash Screen Effect */}
                {demoFlashing && <div className="booth-camera-flash" />}

                {/* AR Filter Overlays */}
                {demoFilter === 'sparkles' && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '32px', zIndex: 6 }}>
                    <span style={{ animation: 'gl-tw 1.5s infinite' }}>✨</span>
                    <span style={{ animation: 'gl-tw 2s infinite' }}>🌟</span>
                    <span style={{ animation: 'gl-tw 1.8s infinite' }}>✨</span>
                  </div>
                )}
                {demoFilter === 'hearts' && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '28px', zIndex: 6 }}>
                    <span style={{ animation: 'gl-pulse 1.6s infinite' }}>💖</span>
                    <span style={{ animation: 'gl-pulse 2.2s infinite' }}>💕</span>
                    <span style={{ animation: 'gl-pulse 1.9s infinite' }}>💗</span>
                  </div>
                )}
                {demoFilter === 'cat' && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', padding: '16px 40px', fontSize: '28px', zIndex: 6 }}>
                    <span>🐱</span>
                    <span>🐾</span>
                  </div>
                )}
              </div>

              {/* Shutter Trigger & AR Filter Controls */}
              <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', textTransform: 'uppercase', marginRight: '4px' }}>
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
                        border: demoFilter === f.id ? '1.5px solid var(--pink)' : '1px solid var(--line)',
                        background: demoFilter === f.id ? 'var(--pink-tint)' : 'var(--paper)',
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
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                <span style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--ink-soft)' }}>
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
                        border: demoTheme.id === theme.id ? '2px solid var(--pink)' : '1px solid var(--line)',
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
                <span style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--ink-soft)' }}>
                  Add Cute Stickers:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {['💖', '✨', '🫰', '🌸', '👑', '💌', '🎀', '🧸', '🌟'].map((emoji, i) => (
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
                  ))}
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
                <div className="real-strip-brand">ANGIE · 인생네컷</div>

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
                      <span key={i} style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
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
                    ANGIE · <b>{roomCode.join('')}</b>
                  </div>
                </div>
              </div>

              {/* Strip Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '250px' }}>
                <button className="btn btn-primary" onClick={downloadDemoStrip} style={{ justifyContent: 'center' }}>
                  Download Photo Strip 💾
                </button>
                <Link className="btn btn-grad" href="/photobooth" style={{ justifyContent: 'center' }}>
                  Open Full Studio ▷
                </Link>
                <Link className="btn btn-ghost" href="/shop" style={{ justifyContent: 'center', fontSize: '13px' }}>
                  Save Free Keepsakes 🎁
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Live Demo Showcase */}
      <section className="section" id="quiz-demo">
        <div className="wrap">
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
                One question, two screens. You both lock in privately — nobody can peek — then the answers flip at the
                exact same second. Match, and the confetti flies.
              </p>
              <p style={{ marginTop: '18px' }}>
                <Link className="btn btn-primary" href="/quiz">
                  Play it free <span className="arr">▷</span>
                </Link>
              </p>
            </div>
            <div className="qd-stage" aria-label="Animated example of a quiz round">
              <div className="qd-card pink">
                <div className="qd-who">
                  <b>Mia</b> · answers honestly
                </div>
                <div className="qd-q">What&apos;s Mia&apos;s go-to karaoke song? 🎤</div>
                <div className="qd-opt pick">Bohemian Rhapsody 🎸</div>
                <div className="qd-opt">Something by IU 🎧</div>
                <div className="qd-opt">Rap god, allegedly 🎤</div>
                <span className="qd-lock">locked in ✓</span>
              </div>
              <div className="qd-card blue">
                <div className="qd-who">
                  <b>Alex</b> · guesses her answer
                </div>
                <div className="qd-q">What&apos;s Mia&apos;s go-to karaoke song? 🎤</div>
                <div className="qd-opt pick">Bohemian Rhapsody 🎸</div>
                <div className="qd-opt">Something by IU 🎧</div>
                <div className="qd-opt">Rap god, allegedly 🎤</div>
                <span className="qd-lock">locked in ✓</span>
              </div>
              <svg className="qd-cursor pink" viewBox="0 0 24 24" fill="#F5739E" stroke="#fff" strokeWidth="1.5">
                <path d="M4 2l16 7.5-7 2.2L9.8 19z" />
              </svg>
              <svg className="qd-cursor blue" viewBox="0 0 24 24" fill="#5B8DEF" stroke="#fff" strokeWidth="1.5">
                <path d="M4 2l16 7.5-7 2.2L9.8 19z" />
              </svg>
              <div className="qd-badge">✓ Matched! 💞</div>
            </div>
          </div>
        </div>
      </section>

      {/* Keepsake Print Band */}
      <section className="section print-band" id="print">
        <div className="wrap">
          <div className="pb-grid">
            <div className="pb-copy">
              <div className="kicker">Digital Keepsakes &amp; Print Sheets</div>
              <h2>
                Preserve your memories with <span className="grad">printable DIY keepsakes</span>.
              </h2>
              <p>
                Turn today&apos;s session into printable 4×6 photo sheets, couple lockscreen wallpapers, and DIY fridge magnet templates.
              </p>
              <ul className="pb-feats">
                <li>300 DPI high-res printable photo sheets for standard 4×6 paper</li>
                <li>Matching couple lockscreen &amp; desktop wallpaper pairs</li>
                <li>Instant PNG &amp; PDF downloads for both of you</li>
              </ul>
              <div className="pb-cta-row">
                <Link className="btn btn-grad" href="/shop">
                  Open Keepsakes Studio <span className="arr">▷</span>
                </Link>
                <span className="pb-ships">✨ 300 DPI high-res layouts · Print at home or any local photo kiosk</span>
              </div>
            </div>
            <div className="pb-art">
              <div className="pb-proof" id="pb-proof">
                <div className="strip pb-magnet" aria-hidden="true">
                  <div className="frame lit">
                    <span className="num">01</span>
                    <img className="shot" src="/photos/frame1.webp" width="503" height="377" alt="" />
                  </div>
                  <div className="frame lit">
                    <span className="num">02</span>
                    <img className="shot" src="/photos/frame2.webp" width="503" height="377" alt="" />
                  </div>
                  <div className="frame lit">
                    <span className="num">03</span>
                    <img className="shot" src="/photos/frame3.webp" width="503" height="377" alt="" />
                  </div>
                  <div className="serial">
                    angie · <b>♡ us</b>
                  </div>
                </div>
                <span className="pb-tag">
                  DIY<small>Print</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Program Card */}
      <section className="section creator-band" id="creators">
        <div className="wrap">
          <div className="cb-card">
            <div>
              <div className="kicker">Creator program</div>
              <h2>
                Post one video, <span className="grad">get Angie free for life</span>.
              </h2>
              <p>
                Film a photobooth session with your partner or best friend, post it on TikTok or Instagram, and send us
                the link. If it&apos;s approved, you get a <b>Lifetime Pass</b> — every game, every HD download, forever.
              </p>
            </div>
            <div className="cb-cta">
              <Link className="btn btn-grad" href="/creators">
                Become a creator <span className="arr">▷</span>
              </Link>
              <span className="cb-sub">🎬 Takes 2 minutes to apply</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="section" id="faq">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">Good to know</div>
            <h2>Questions long distance couples ask.</h2>
          </div>
          <div className="faq">
            {[
              {
                q: 'What games can we play on Angie?',
                a: 'Fifteen realtime activities are live: Truth or Dare with 20 tiny minigames, Honest Cards, the Our Future planning date, the Love Match compatibility test, Riddle Night, IQ Duel, the How Well Do You Know Me quiz, the online photobooth, Couples Debate, Draw Together, Couples Court, Snap Hunt, Fashion Show, a face-avatar Arcade, and The Lab study-date game. Everything happens in one shared room at the same second — not messaging in parallel.',
              },
              {
                q: 'Is Angie free to play?',
                a: 'Yes. Open a room, share the 5-letter code, and play together for free — the photobooth is always free and every game has a free tier. Premium unlocks unlimited plays, every question pack, a game log of your scores, and fresh questions that never repeat.',
              },
              {
                q: 'How does a realtime online date work?',
                a: 'One person opens a room and sends the code; the other joins from anywhere. You see each other\'s live cursors, lock in answers privately, and reveal at the exact same second — and in the photobooth a shared countdown fires the shot on both screens at once.',
              },
              {
                q: 'Do we need to install an app?',
                a: 'No. Angie runs right in the browser on phone or laptop — nothing to download. There\'s also a native app if you prefer one.',
              },
              {
                q: 'Is the photobooth like 인생네컷 / Life4Cuts?',
                a: 'Yes — Angie\'s photobooth is built in the Korean Life4Cuts (인생네컷) style, but online and made for two people in different places. You get the same clean photo strip you\'d print from a booth.',
              },
            ].map((item, idx) => (
              <details
                key={idx}
                open={activeFaq === idx}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveFaq(activeFaq === idx ? null : idx);
                }}
              >
                <summary>
                  {item.q} <span className="pm">+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Profile Modal */}
      {profileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(23,24,28,0.5)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
          onClick={() => setProfileOpen(false)}
        >
          <div
            style={{
              width: 'min(440px, 100%)',
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Your Angie Profile</h3>
              <button
                onClick={() => setProfileOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--pink-tint)',
                  border: '2px solid var(--pink)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '24px',
                }}
              >
                🌸
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{nickname} &amp; {partnerName}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Connected Room: <b>{roomCode.join('')}</b></div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Partner&apos;s Nickname
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-grad"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setProfileOpen(false)}
              >
                Save Profile
              </button>
              <Link
                href="/photobooth"
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setProfileOpen(false)}
              >
                Open Booth 📸
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui';
import { SceneBackdrop } from './SceneBackdrop';
import { sounds } from '@/lib/sound';

interface PhotoboothDemoStudioProps {
  partnerA: string;
  partnerB: string;
  cityA?: string;
  cityB?: string;
  roomCode: string[];
}

export interface DemoPlacedSticker {
  id: string;
  emoji: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  rotation: number;
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

export const DEMO_COLOR_FILTERS = [
  {
    id: 'natural',
    name: 'Natural Warm',
    emoji: '☀️',
    filter: 'contrast(1.05) brightness(1.02) saturate(1.1)',
  },
  {
    id: 'haru-cyan',
    name: 'Haru Cyan',
    emoji: '🌊',
    filter: 'contrast(1.12) brightness(1.06) saturate(0.9) hue-rotate(-8deg)',
  },
  {
    id: 'mono',
    name: 'Life4 Mono',
    emoji: '🖤',
    filter: 'grayscale(1) contrast(1.2) brightness(0.98)',
  },
  {
    id: 'peach',
    name: 'Peachy Glow',
    emoji: '🍑',
    filter: 'contrast(1.06) saturate(1.25) sepia(0.12)',
  },
  {
    id: 'film90',
    name: '90s Film',
    emoji: '🎞️',
    filter: 'contrast(1.08) brightness(0.96) sepia(0.24) saturate(1.15)',
  },
];

export function PhotoboothDemoStudio({
  partnerA,
  partnerB,
  cityA = 'Calgary',
  cityB = 'Jakarta',
  roomCode,
}: PhotoboothDemoStudioProps) {
  const [demoMode, setDemoMode] = useState<'upload' | 'webcam'>('webcam');
  const [demoTheme, setDemoTheme] = useState(DEMO_THEMES[0]);
  const [demoPoseIdx, setDemoPoseIdx] = useState(0);
  const [demoFilter, setDemoFilter] = useState<
    'none' | 'sparkles' | 'hearts' | 'cat'
  >('none');
  const [demoColorFilter, setDemoColorFilter] = useState(DEMO_COLOR_FILTERS[0]);
  const [dragOverCutIdx, setDragOverCutIdx] = useState<number | null>(null);
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const [demoIsShooting, setDemoIsShooting] = useState(false);
  const [demoCountdown, setDemoCountdown] = useState<number | null>(null);
  const [demoFlashing, setDemoFlashing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [targetRetakeIdx, setTargetRetakeIdx] = useState<number | null>(null);
  const [demoTimerDuration, setDemoTimerDuration] = useState<3 | 5>(3);
  const [demoShootMode, setDemoShootMode] = useState<'auto' | 'manual'>('auto');
  const [demoCutTransforms, setDemoCutTransforms] = useState<
    { rotation: number; flipX: boolean }[]
  >([
    { rotation: 0, flipX: false },
    { rotation: 0, flipX: false },
    { rotation: 0, flipX: false },
    { rotation: 0, flipX: false },
  ]);
  const [demoShots, setDemoShots] = useState<string[]>([
    '/photos/frame1.webp',
    '/photos/frame2.webp',
    '/photos/frame3.webp',
    '/photos/frame4.webp',
  ]);
  const [demoStickers, setDemoStickers] = useState<DemoPlacedSticker[]>([
    { id: '1', emoji: '💖', x: 82, y: 15, rotation: 8 },
    { id: '2', emoji: '✨', x: 18, y: 88, rotation: -6 },
  ]);
  const [demoCoupleName, setDemoCoupleName] = useState(
    `${partnerA} ♡ ${partnerB}`,
  );

  useEffect(() => {
    setDemoCoupleName(`${partnerA} ♡ ${partnerB}`);
  }, [partnerA, partnerB]);

  const demoVideoRef = useRef<HTMLVideoElement>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shootTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Clear pending shoot timeouts
  const clearShootTimeouts = () => {
    shootTimeoutsRef.current.forEach(clearTimeout);
    shootTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearShootTimeouts();
  }, []);

  // Toggle live webcam in studio with ideal 1080p constraints
  useEffect(() => {
    let stream: MediaStream | null = null;
    setCameraError(null);

    if (demoMode === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user',
          },
        })
        .then((s) => {
          stream = s;
          if (demoVideoRef.current) {
            demoVideoRef.current.srcObject = s;
            demoVideoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Webcam permission or device error:', err);
          setCameraError(
            'Camera access was blocked or unavailable. Check browser permissions or upload photos.',
          );
          setDemoMode('upload');
        });
    }

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (demoVideoRef.current) {
        demoVideoRef.current.srcObject = null;
      }
    };
  }, [demoMode]);

  // Cancel any active shooting sequence
  const cancelShoot = () => {
    clearShootTimeouts();
    setDemoCountdown(null);
    setDemoFlashing(false);
    setDemoIsShooting(false);
    setTargetRetakeIdx(null);
    sounds.playTick();
  };

  // Drag & drop handlers for cut frames
  const handleDragOverCut = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCutIdx(idx);
  };

  const handleDragLeaveCut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCutIdx(null);
  };

  const handleDropOnCut = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCutIdx(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      sounds.playPop();
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (url) {
          setDemoShots((prev) => {
            const next = [...prev];
            next[idx] = url;
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sounds.playPop();
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (url) {
          if (typeof targetRetakeIdx === 'number') {
            setDemoShots((prev) => {
              const next = [...prev];
              next[targetRetakeIdx] = url;
              return next;
            });
            setTargetRetakeIdx(null);
          } else {
            setDemoShots((prev) => [
              url,
              prev[1] || url,
              prev[2] || url,
              prev[3] || url,
            ]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const moveDemoCut = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx < 0 ||
      fromIdx >= demoShots.length ||
      toIdx < 0 ||
      toIdx >= demoShots.length
    )
      return;
    sounds.playPop();
    setDemoShots((prev) => {
      const next = [...prev];
      const temp = next[fromIdx];
      next[fromIdx] = next[toIdx];
      next[toIdx] = temp;
      return next;
    });
    setDemoCutTransforms((prev) => {
      const next = [...prev];
      const temp = next[fromIdx];
      next[fromIdx] = next[toIdx];
      next[toIdx] = temp;
      return next;
    });
  };

  const rotateDemoCut = (idx: number) => {
    sounds.playTick();
    setDemoCutTransforms((prev) => {
      const next = [...prev];
      const cur = next[idx] || { rotation: 0, flipX: false };
      next[idx] = { ...cur, rotation: (cur.rotation + 90) % 360 };
      return next;
    });
  };

  const flipDemoCut = (idx: number) => {
    sounds.playTick();
    setDemoCutTransforms((prev) => {
      const next = [...prev];
      const cur = next[idx] || { rotation: 0, flipX: false };
      next[idx] = { ...cur, flipX: !cur.flipX };
      return next;
    });
  };

  // Trigger shooting sequence (all 4 shots or targeted single shot retake)
  const triggerDemoShoot = (specificIdx?: number) => {
    if (demoIsShooting) return;
    clearShootTimeouts();
    setDemoIsShooting(true);

    const isSingleRetake = typeof specificIdx === 'number';
    const isAuto = isSingleRetake ? false : demoShootMode === 'auto';
    const startIndex = isSingleRetake
      ? specificIdx
      : demoShootMode === 'manual'
        ? demoPoseIdx
        : 0;
    const endIndex = isAuto ? 4 : startIndex + 1;
    const currentShots = [...demoShots];

    const shootStep = (idx: number) => {
      if (idx >= endIndex) {
        setDemoIsShooting(false);
        setTargetRetakeIdx(null);
        sounds.playCelebration();
        return;
      }

      setDemoPoseIdx(idx % DEMO_POSES.length);
      const totalSec = demoTimerDuration;
      for (let s = totalSec; s >= 1; s--) {
        const delay = (totalSec - s) * 800;
        const t = setTimeout(() => {
          setDemoCountdown(s);
          sounds.playCountdownBeep(false);
        }, delay);
        shootTimeoutsRef.current.push(t);
      }

      const snapDelay = totalSec * 800;
      const tSnap = setTimeout(() => {
        setDemoCountdown(null);
        setDemoFlashing(true);
        sounds.playCountdownBeep(true);
        sounds.playShutter();

        const tFlash = setTimeout(() => setDemoFlashing(false), 250);
        shootTimeoutsRef.current.push(tFlash);

        if (
          demoMode === 'webcam' &&
          demoVideoRef.current &&
          demoCanvasRef.current
        ) {
          const v = demoVideoRef.current;
          const c = demoCanvasRef.current;
          const ctx = c.getContext('2d');
          if (ctx && v.videoWidth > 0) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;

            // Mirror horizontally so it matches preview
            ctx.save();
            ctx.translate(c.width, 0);
            ctx.scale(-1, 1);
            if (demoColorFilter.filter) {
              ctx.filter = demoColorFilter.filter;
            }
            ctx.drawImage(v, 0, 0, c.width, c.height);
            ctx.restore();

            // Bake AR Filter emoji onto capture if active
            if (demoFilter === 'sparkles') {
              ctx.font = `${Math.round(c.width * 0.08)}px "Apple Color Emoji", sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText('✨', c.width * 0.2, c.height * 0.22);
              ctx.fillText('🌟', c.width * 0.5, c.height * 0.16);
              ctx.fillText('✨', c.width * 0.8, c.height * 0.22);
            } else if (demoFilter === 'hearts') {
              ctx.font = `${Math.round(c.width * 0.08)}px "Apple Color Emoji", sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText('💖', c.width * 0.25, c.height * 0.2);
              ctx.fillText('💕', c.width * 0.75, c.height * 0.2);
            } else if (demoFilter === 'cat') {
              ctx.font = `${Math.round(c.width * 0.09)}px "Apple Color Emoji", sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText('🐱', c.width * 0.22, c.height * 0.22);
              ctx.fillText('🐾', c.width * 0.78, c.height * 0.22);
            }

            currentShots[idx] = c.toDataURL('image/webp');
            setDemoShots([...currentShots]);
          }
        } else {
          // Simulated demo rotation
          currentShots[idx] = `/photos/frame${idx + 1}.webp`;
          setDemoShots([...currentShots]);
        }

        if (isAuto && idx + 1 < endIndex) {
          const tNext = setTimeout(() => shootStep(idx + 1), 850);
          shootTimeoutsRef.current.push(tNext);
        } else {
          setDemoIsShooting(false);
          setTargetRetakeIdx(null);
          sounds.playCelebration();
        }
      }, snapDelay);

      shootTimeoutsRef.current.push(tSnap);
    };

    shootStep(startIndex);
  };

  // Add sticker onto the strip
  const addDemoSticker = (emoji: string) => {
    sounds.playPop();
    if (demoStickers.length >= 8) return;
    const defaultSpots = [
      { x: 84, y: 38, rotation: 10 },
      { x: 16, y: 62, rotation: -8 },
      { x: 84, y: 65, rotation: 12 },
      { x: 18, y: 36, rotation: -12 },
      { x: 50, y: 88, rotation: 0 },
      { x: 82, y: 88, rotation: 15 },
    ];
    const spot = defaultSpots[demoStickers.length % defaultSpots.length];
    setDemoStickers((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        emoji,
        x: spot.x,
        y: spot.y,
        rotation: spot.rotation,
      },
    ]);
  };

  const removeDemoSticker = (id: string) => {
    sounds.playTick();
    setDemoStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // High-Resolution 600x1600 Canvas Strip Exporter with Baked Color Filter & Stickers
  const generateDemoStripCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    if (demoTheme.bg.startsWith('linear')) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1600);
      if (demoTheme.id === 'sunset') {
        grad.addColorStop(0, '#FFE4D6');
        grad.addColorStop(1, '#FFD6E8');
      } else {
        grad.addColorStop(0, '#101726');
        grad.addColorStop(1, '#1A2942');
      }
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = demoTheme.bg;
    }
    ctx.fillRect(0, 0, 600, 1600);

    // Border
    ctx.strokeStyle = demoTheme.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, 568, 1568);

    // Header
    ctx.fillStyle = demoTheme.text;
    ctx.font = 'bold 24px Pretendard, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEARLY US · 인생네컷', 300, 62);

    // Helper to load images safely
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });
    };

    const loadedImages = await Promise.all(demoShots.map((s) => loadImage(s)));

    // 4 Photo Frames with real image rendering and object-fit cover
    for (let i = 0; i < 4; i++) {
      const y = 85 + i * 348;
      const w = 516;
      const h = 320;
      const x = 42;

      ctx.fillStyle = '#F8F9FB';
      ctx.fillRect(x, y, w, h);

      const img = loadedImages[i];
      if (img && img.width > 0 && img.height > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        if (demoColorFilter.filter) {
          ctx.filter = demoColorFilter.filter;
        }

        const transform = demoCutTransforms[i] || { rotation: 0, flipX: false };
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.translate(cx, cy);
        if (transform.rotation !== 0) {
          ctx.rotate((transform.rotation * Math.PI) / 180);
        }
        if (transform.flipX) {
          ctx.scale(-1, 1);
        }

        const isRotated = transform.rotation % 180 !== 0;
        const renderW = isRotated ? h : w;
        const renderH = isRotated ? w : h;
        const imgRatio = img.width / img.height;
        const frameRatio = renderW / renderH;
        let dw = renderW;
        let dh = renderH;

        if (imgRatio > frameRatio) {
          dw = renderH * imgRatio;
        } else {
          dh = renderW / imgRatio;
        }

        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      // Frame border
      ctx.strokeStyle = demoTheme.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      // Cut Number Tag
      ctx.fillStyle = 'rgba(23, 24, 28, 0.72)';
      ctx.fillRect(x + 8, y + 8, 30, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`0${i + 1}`, x + 23, y + 21);
    }

    // Bake Placed Stickers onto Canvas
    demoStickers.forEach((stk) => {
      ctx.save();
      const px = (stk.x / 100) * 600;
      const py = (stk.y / 100) * 1600;
      ctx.translate(px, py);
      ctx.rotate((stk.rotation * Math.PI) / 180);
      ctx.font = '36px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.fillText(stk.emoji, 0, 0);
      ctx.restore();
    });

    // Footer
    ctx.fillStyle = demoTheme.text;
    ctx.font = 'bold 22px Pretendard, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(demoCoupleName, 300, 1515);

    ctx.font = '13px monospace';
    ctx.fillStyle =
      demoTheme.id === 'noir' || demoTheme.id === 'cyber'
        ? '#8FA0B5'
        : '#5B5E68';
    ctx.fillText(
      `ROOM: ${roomCode.join('')} · ${new Date().toLocaleDateString()}`,
      300,
      1545,
    );

    return canvas;
  };

  const downloadDemoStrip = async () => {
    sounds.playTick();
    const canvas = await generateDemoStripCanvas();
    if (!canvas) return;

    const a = document.createElement('a');
    a.download = `dearly-us-photostrip-${roomCode.join('') || 'life4cuts'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    sounds.playCelebration();
  };

  const copyDemoStripToClipboard = async () => {
    sounds.playTick();
    try {
      const canvas = await generateDemoStripCanvas();
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (
          typeof navigator.clipboard?.write === 'function' &&
          typeof ClipboardItem !== 'undefined'
        ) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setClipboardCopied(true);
            sounds.playCelebration();
            setTimeout(() => setClipboardCopied(false), 2600);
            return;
          } catch {
            // fallback to download
          }
        }
        downloadDemoStrip();
      }, 'image/png');
    } catch {
      downloadDemoStrip();
    }
  };

  return (
    <div className="home-studio-sequence">
      {/* Photobooth Live Interactive Showcase (Dearly Us 인생네컷) */}
      <section
        className="section"
        id="photobooth-demo"
        style={{
          padding: 0,
          margin: 0,
          background: 'transparent',
          borderTop: 'none',
        }}
      >
        <SceneBackdrop scene="studio" />
        <canvas ref={demoCanvasRef} style={{ display: 'none' }} />
        <div className="wrap">
          <ScrollReveal animation="fade-up">
            <div className="section-head">
              <div className="kicker">Online Photobooth · 인생네컷</div>
              <h2>
                A moment together.
                <br />
                <span className="grad">A little proof to keep.</span>
              </h2>
              <p>
                A shared countdown fires the shot on both screens at once —
                arrange into a 4-cut photostrip you can download or print as
                fridge magnets. Take live photos or upload your favorites right here.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={0.1}>
            <div className="booth-showcase-grid">
              {/* Left: Interactive Studio Booth Stage */}
              <div
                className={`booth-box ${demoTheme.id === 'vintage' ? 'vintage-automat' : ''}`}
              >
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className={`btn ${demoMode === 'webcam' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                      onClick={() => {
                        sounds.playPop();
                        setDemoMode('webcam');
                        setCameraError(null);
                      }}
                    >
                      📷 Live Camera
                    </button>
                    <button
                      className={`btn ${demoMode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                      onClick={() => {
                        sounds.playPop();
                        setDemoMode('upload');
                        setTargetRetakeIdx(null);
                        fileInputRef.current?.click();
                      }}
                      title="Upload photos from your computer or phone"
                    >
                      📁 Upload Photos
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />

                    {/* Shoot Mode (Auto Sequence vs Manual Snap) */}
                    <div
                      style={{
                        display: 'inline-flex',
                        background: 'var(--paper)',
                        padding: '2px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <button
                        onClick={() => {
                          sounds.playTick();
                          setDemoShootMode('auto');
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: 'none',
                          background:
                            demoShootMode === 'auto' ? 'var(--pink)' : 'transparent',
                          color:
                            demoShootMode === 'auto' ? '#FFFFFF' : 'var(--ink-soft)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        ⚡ Auto 4-Cut
                      </button>
                      <button
                        onClick={() => {
                          sounds.playTick();
                          setDemoShootMode('manual');
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: 'none',
                          background:
                            demoShootMode === 'manual'
                              ? 'var(--pink)'
                              : 'transparent',
                          color:
                            demoShootMode === 'manual'
                              ? '#FFFFFF'
                              : 'var(--ink-soft)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        📸 Single Snap
                      </button>
                    </div>

                    {/* Timer Duration (3s vs 5s) */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                        Timer:
                      </span>
                      {([3, 5] as const).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => {
                            sounds.playTick();
                            setDemoTimerDuration(sec);
                          }}
                          style={{
                            padding: '2px 7px',
                            fontSize: '11px',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border:
                              demoTimerDuration === sec
                                ? '1.5px solid var(--pink)'
                                : '1px solid var(--line)',
                            background:
                              demoTimerDuration === sec
                                ? 'var(--pink-tint)'
                                : 'var(--paper)',
                            color:
                              demoTimerDuration === sec
                                ? 'var(--pink)'
                                : 'var(--ink-soft)',
                            cursor: 'pointer',
                          }}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                      }}
                      onClick={() => {
                        sounds.playPop();
                        setDemoPoseIdx((p) => (p + 1) % DEMO_POSES.length);
                      }}
                    >
                      🎲 Shuffle Pose
                    </button>
                  </div>
                </div>

                {/* Camera Permission or Device Error Alert */}
                {cameraError && (
                  <div
                    style={{
                      background: 'rgba(255, 77, 106, 0.12)',
                      border: '1px solid rgba(255, 77, 106, 0.35)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#FF6B8B',
                    }}
                  >
                    <span>⚠️ {cameraError}</span>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '2px 8px', fontSize: '11px', height: 'auto' }}
                      onClick={() => {
                        setCameraError(null);
                        setDemoMode('webcam');
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Camera Viewport Screen */}
                <div className="booth-cam-stage">
                  {/* Pose Prompt Top Banner */}
                  <div className="pose-prompt-card">
                    <span>📸</span>
                    <span>{DEMO_POSES[demoPoseIdx]}</span>
                  </div>

                  {/* Live Filter HUD Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(14, 16, 22, 0.76)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    <span>{demoColorFilter.emoji}</span>
                    <span>{demoColorFilter.name}</span>
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
                            transform: 'scaleX(-1)', // Mirrored for natural selfie framing
                            filter: demoColorFilter.filter,
                          }}
                        />
                        <div className="feed-city-badge pink">
                          <span className="dot"></span> You (Live Mirrored Camera)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setTargetRetakeIdx(null);
                        fileInputRef.current?.click();
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '260px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#131418',
                        cursor: 'pointer',
                        padding: '24px',
                        textAlign: 'center',
                        border: '2px dashed rgba(255, 123, 163, 0.4)',
                        borderRadius: '10px',
                      }}
                    >
                      <span style={{ fontSize: '40px', marginBottom: '10px' }}>📁</span>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          marginBottom: '4px',
                        }}
                      >
                        Photo Upload Mode
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.65)',
                          maxWidth: '300px',
                          lineHeight: 1.5,
                        }}
                      >
                        Click to upload photos from your device, or drag and drop any picture directly onto the cut frames below.
                      </span>
                      <button
                        className="btn btn-primary"
                        style={{
                          marginTop: '14px',
                          padding: '6px 14px',
                          fontSize: '12px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDemoMode('webcam');
                          setCameraError(null);
                        }}
                      >
                        📷 Switch to Live Camera
                      </button>
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
                      <span style={{ animation: 'pulse 1.5s infinite' }}>
                        ✨
                      </span>
                      <span style={{ animation: 'pulse 1.2s infinite 0.3s' }}>
                        🌟
                      </span>
                      <span style={{ animation: 'pulse 1.4s infinite 0.6s' }}>
                        ✨
                      </span>
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
                      <span style={{ animation: 'float 2.4s infinite 0.5s' }}>
                        💕
                      </span>
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

                {/* Shutter Trigger, Color Tone & AR Filter Controls */}
                <div
                  style={{
                    marginTop: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Color Grading Filter Pills */}
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
                      Color Tone:
                    </span>
                    {DEMO_COLOR_FILTERS.map((cf) => (
                      <button
                        key={cf.id}
                        onClick={() => {
                          sounds.playPop();
                          setDemoColorFilter(cf);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border:
                            demoColorFilter.id === cf.id
                              ? '1.5px solid var(--pink)'
                              : '1px solid var(--line)',
                          background:
                            demoColorFilter.id === cf.id
                              ? 'var(--pink-tint)'
                              : 'var(--paper)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cf.emoji} {cf.name}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
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
                          onClick={() => {
                            sounds.playPop();
                            setDemoFilter(f.id as any);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border:
                              demoFilter === f.id
                                ? '1.5px solid var(--pink)'
                                : '1px solid var(--line)',
                            background:
                              demoFilter === f.id
                                ? 'var(--pink-tint)'
                                : 'var(--paper)',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--ink)',
                            cursor: 'pointer',
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {demoIsShooting ? (
                        <button
                          className="btn btn-ghost"
                          onClick={cancelShoot}
                          style={{ padding: '10px 18px', fontSize: '14px', color: '#FF4D6A' }}
                        >
                          Cancel ⏹️
                        </button>
                      ) : null}

                      <button
                        className="btn btn-grad"
                        onClick={() => triggerDemoShoot()}
                        disabled={demoIsShooting}
                        style={{ padding: '10px 24px', fontSize: '15px' }}
                      >
                        {demoIsShooting
                          ? `Shooting Cut 0${demoPoseIdx + 1} 📸...`
                          : 'Take 4 Photos 📸'}
                      </button>
                    </div>
                  </div>
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
                  <div
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                  >
                    {DEMO_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          sounds.playPop();
                          setDemoTheme(theme);
                        }}
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
                          boxShadow:
                            demoTheme.id === theme.id
                              ? 'var(--shadow)'
                              : 'none',
                          transform:
                            demoTheme.id === theme.id ? 'scale(1.03)' : 'none',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Cute Stickers */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      Add Cute Stickers ({demoStickers.length}/8):
                    </span>
                    {demoStickers.length > 0 && (
                      <button
                        onClick={() => {
                          sounds.playTick();
                          setDemoStickers([]);
                        }}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          background: 'none',
                          fontSize: '11px',
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                      >
                        Clear Stickers
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    {['💖', '✨', '🫰', '🌸', '👑', '💌', '🎀', '🧸', '🌟', '🐾'].map(
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
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease',
                          }}
                        >
                          {emoji}
                        </button>
                      ),
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '6px', marginBottom: 0 }}>
                    💡 Tap any emoji to add to your strip · Drag stickers on the strip to reposition · Tap to remove.
                  </p>
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
                    position: 'relative',
                  }}
                >
                  <div className="real-strip-brand">DEARLY US · 인생네컷</div>

                  <div className="real-strip-frames">
                    {demoShots.map((shotUrl, idx) => (
                      <div
                        key={idx}
                        className="real-strip-cell"
                        onDragOver={(e) => handleDragOverCut(idx, e)}
                        onDragLeave={handleDragLeaveCut}
                        onDrop={(e) => handleDropOnCut(idx, e)}
                        style={{
                          position: 'relative',
                          outline:
                            dragOverCutIdx === idx
                              ? '2px dashed var(--pink)'
                              : 'none',
                          outlineOffset: '-2px',
                        }}
                      >
                        <img
                          src={shotUrl}
                          alt={`Photobooth shot ${idx + 1}`}
                          style={{
                            filter: demoColorFilter.filter,
                            transform: `rotate(${demoCutTransforms[idx]?.rotation || 0}deg) ${demoCutTransforms[idx]?.flipX ? 'scaleX(-1)' : ''}`,
                            opacity: dragOverCutIdx === idx ? 0.5 : 1,
                          }}
                        />
                        {dragOverCutIdx === idx && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255, 123, 163, 0.3)',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 800,
                              pointerEvents: 'none',
                              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            Drop on Cut 0{idx + 1} 📥
                          </div>
                        )}
                        <span className="frame-tag">0{idx + 1}</span>

                        {/* Cut Actions Toolbar: Reorder, Rotate, Flip, Retake */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '3px',
                            right: '3px',
                            display: 'flex',
                            gap: '2px',
                            zIndex: 6,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {idx > 0 && (
                            <button
                              onClick={() => moveDemoCut(idx, idx - 1)}
                              disabled={demoIsShooting}
                              title="Move Cut Left (◀)"
                              style={{
                                background: 'rgba(23, 24, 28, 0.85)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                borderRadius: '3px',
                                padding: '1px 4px',
                                fontSize: '8.5px',
                                cursor: 'pointer',
                              }}
                            >
                              ◀
                            </button>
                          )}
                          {idx < 3 && (
                            <button
                              onClick={() => moveDemoCut(idx, idx + 1)}
                              disabled={demoIsShooting}
                              title="Move Cut Right (▶)"
                              style={{
                                background: 'rgba(23, 24, 28, 0.85)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                borderRadius: '3px',
                                padding: '1px 4px',
                                fontSize: '8.5px',
                                cursor: 'pointer',
                              }}
                            >
                              ▶
                            </button>
                          )}
                          <button
                            onClick={() => rotateDemoCut(idx)}
                            disabled={demoIsShooting}
                            title="Rotate 90° Clockwise (↷)"
                            style={{
                              background: 'rgba(23, 24, 28, 0.85)',
                              color: '#FFFFFF',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              borderRadius: '3px',
                              padding: '1px 4px',
                              fontSize: '8.5px',
                              cursor: 'pointer',
                            }}
                          >
                            ↷
                          </button>
                          <button
                            onClick={() => flipDemoCut(idx)}
                            disabled={demoIsShooting}
                            title="Flip Horizontal (⇄)"
                            style={{
                              background: 'rgba(23, 24, 28, 0.85)',
                              color: '#FFFFFF',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              borderRadius: '3px',
                              padding: '1px 4px',
                              fontSize: '8.5px',
                              cursor: 'pointer',
                            }}
                          >
                            ⇄
                          </button>
                          <button
                            onClick={() => {
                              sounds.playPop();
                              triggerDemoShoot(idx);
                            }}
                            disabled={demoIsShooting}
                            title={`Retake Cut 0${idx + 1}`}
                            style={{
                              background: 'rgba(23, 24, 28, 0.85)',
                              color: '#FFFFFF',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              borderRadius: '3px',
                              padding: '1px 4px',
                              fontSize: '8.5px',
                              cursor: 'pointer',
                            }}
                          >
                            🔄
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Placed Stickers on strip directly with pointer capture drag */}
                  {demoStickers.map((stk) => (
                    <div
                      key={stk.id}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId);
                        } catch {}
                        const stripEl = e.currentTarget.parentElement;
                        if (!stripEl) return;
                        const rect = stripEl.getBoundingClientRect();
                        let hasMoved = false;

                        const onPointerMove = (moveEvt: PointerEvent) => {
                          hasMoved = true;
                          const newX = Math.max(
                            5,
                            Math.min(
                              95,
                              ((moveEvt.clientX - rect.left) / rect.width) * 100,
                            ),
                          );
                          const newY = Math.max(
                            4,
                            Math.min(
                              96,
                              ((moveEvt.clientY - rect.top) / rect.height) * 100,
                            ),
                          );
                          setDemoStickers((prev) =>
                            prev.map((s) =>
                              s.id === stk.id
                                ? { ...s, x: Math.round(newX), y: Math.round(newY) }
                                : s,
                            ),
                          );
                        };

                        const onPointerUp = () => {
                          window.removeEventListener('pointermove', onPointerMove);
                          window.removeEventListener('pointerup', onPointerUp);
                          if (!hasMoved) {
                            removeDemoSticker(stk.id);
                          }
                        };

                        window.addEventListener('pointermove', onPointerMove);
                        window.addEventListener('pointerup', onPointerUp);
                      }}
                      title="Drag to reposition · Tap to remove"
                      style={{
                        position: 'absolute',
                        left: `${stk.x}%`,
                        top: `${stk.y}%`,
                        transform: `translate(-50%, -50%) rotate(${stk.rotation}deg)`,
                        fontSize: '22px',
                        cursor: 'grab',
                        userSelect: 'none',
                        touchAction: 'none',
                        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))',
                        zIndex: 10,
                      }}
                    >
                      {stk.emoji}
                    </div>
                  ))}

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
                      DEARLY US · <b>{roomCode.join('') || 'LIFE4CUTS'}</b>
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
                  <button
                    className="btn btn-ghost"
                    onClick={copyDemoStripToClipboard}
                    style={{
                      justifyContent: 'center',
                      color: clipboardCopied ? 'var(--pink)' : undefined,
                    }}
                  >
                    {clipboardCopied ? '✓ Copied to Clipboard!' : 'Copy to Clipboard 📋'}
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
      <section
        className="section"
        id="quiz-demo"
        style={{
          background: 'transparent',
          borderTop: 'none',
          padding: '64px 0 0',
        }}
      >
        <div className="wrap">
          <ScrollReveal animation="fade-up">
            <div className="qd-grid">
              <div className="section-head" style={{ margin: 0 }}>
                <div className="kicker">See it in action</div>
                <h2>
                  Still finding little things
                  <br />
                  <em>to love about you.</em>
                </h2>
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
      <section
        className="section print-band"
        id="print"
        style={{
          padding: '64px 0 0',
          margin: 0,
          background: 'transparent',
          borderTop: 'none',
        }}
      >
        <div className="wrap">
          <ScrollReveal animation="fade-up">
            <div className="pb-grid">
              <div className="pb-copy">
                <div className="kicker">
                  Digital Keepsakes &amp; Print Sheets
                </div>
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
                    300 DPI high-res printable photo sheets for standard 4×6
                    paper
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
                    ✨ 300 DPI high-res layouts · Print at home or any local
                    photo kiosk
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

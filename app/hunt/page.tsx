'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { Confetti } from '@/components/shared/Confetti';

export default function HuntPage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [promptIdx, setPromptIdx] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [hunting, setHunting] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [scores, setScores] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [confettiActive, setConfettiActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const prompts = [
    `Find: Something pink or heart-shaped in your room! 💖`,
    `Find: A gift, souvenir, or letter ${partnerB} gave you! 🎁`,
    `Find: The coziest oversized hoodie or sweater in your closet! 🧥`,
    `Find: The sweetest midnight snack in your kitchen! 🍪`,
    `Find: A souvenir or photo that reminds you of ${partnerB}! 💌`,
    `Find: An item that matches ${partnerA}'s favorite color! 🎨`,
    `Find: Something you bought together during your favorite memory! ✨`,
  ];

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      sounds.playPop();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access not available. You can still play with manual click validation!');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (hunting && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setHunting(false);
            setSnapped(true);
            sounds.playCelebration();
            setConfettiActive(true);
            setTimeout(() => setConfettiActive(false), 3000);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hunting, seconds]);

  const startHunt = () => {
    sounds.playPop();
    setHunting(true);
    setSnapped(false);
    setCapturedPhoto(null);
    setSeconds(60);
  };

  const captureFrame = () => {
    if (!videoRef.current || !cameraActive) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Mirror horizontally
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  const handleFound = (who: 'a' | 'b') => {
    sounds.playCelebration();
    setHunting(false);
    setSnapped(true);
    setScores((prev) => ({ ...prev, [who]: prev[who] + 1 }));
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3500);

    const snap = captureFrame();
    if (snap) {
      setCapturedPhoto(snap);
    }
  };

  const handleNextClue = () => {
    sounds.playPop();
    setPromptIdx((p) => (p + 1) % prompts.length);
    setHunting(false);
    setSnapped(false);
    setCapturedPhoto(null);
    setSeconds(60);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Confetti active={confettiActive} />

      <header className="bar">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link className="brand" href="/" onClick={() => sounds.playPop()} aria-label="Dearly Us Home">
              <span className="brand-emblem" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 128 128" fill="none">
                  <rect width="128" height="128" rx="36" fill="#1C1924" />
                  <path d="M64 77 C51 93 29 86 29 64 C29 45 48 38 64 58" stroke="#FF4E78" strokeWidth="12" strokeLinecap="round" />
                  <path d="M64 58 C80 38 99 45 99 64 C99 86 77 93 64 77" stroke="#437EEB" strokeWidth="12" strokeLinecap="round" />
                  <circle cx="64" cy="67" r="5" fill="#FFFFFF" />
                </svg>
              </span>
              <span className="brand-dearly">Dearly</span>
              <span className="brand-us">Us</span>
              <span className="dots">
                <i className="p"></i>
                <i className="b"></i>
              </span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: 'var(--paper-raised)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{partnerA}:</span> <b style={{ color: 'var(--pink)' }}>{scores.a} PTS</b> · <span>{partnerB}:</span> <b style={{ color: 'var(--blue)' }}>{scores.b} PTS</b>
            </span>

            <Link className="btn btn-ghost" href="/activity" onClick={() => sounds.playPop()}>
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="eyebrow">Snap Hunt · 60s Room Scavenger</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '8px' }}>
            Race to find it, <span className="grad">snap it</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
            Hold the secret room item to your screen before time runs out!
          </p>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Prompt Banner */}
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>🔍</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '14px', maxWidth: '520px', margin: '0 auto 14px', lineHeight: 1.35 }}>
            {prompts[promptIdx]}
          </h2>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '44px', fontWeight: 900, color: 'var(--pink)', marginBottom: '20px' }}>
            {hunting ? `00:${String(seconds).padStart(2, '0')}` : '60 Seconds'}
          </div>

          {/* Camera Viewport (Optional Live Snap) */}
          <div style={{ maxWidth: '420px', margin: '0 auto 20px', position: 'relative' }}>
            {cameraActive ? (
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--line)', background: '#000', position: 'relative' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '240px', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                <button
                  onClick={stopCamera}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Turn Off 📷
                </button>
              </div>
            ) : (
              <button
                onClick={startCamera}
                className="btn btn-ghost"
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
              >
                📹 Turn On Webcam for Live Snaps
              </button>
            )}

            {cameraError && (
              <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px' }}>{cameraError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!hunting ? (
              <button className="btn btn-grad" onClick={startHunt} style={{ padding: '12px 32px', fontSize: '16px' }}>
                Start Scavenger Hunt ▷
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleFound('a')}
                  style={{ padding: '12px 20px', fontSize: '15px' }}
                >
                  📸 {partnerA} Found It! (+1)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleFound('b')}
                  style={{ padding: '12px 20px', fontSize: '15px' }}
                >
                  📸 {partnerB} Found It! (+1)
                </button>
              </div>
            )}

            <button
              className="btn btn-ghost"
              onClick={handleNextClue}
              style={{ padding: '12px 20px', fontSize: '15px' }}
            >
              Next Clue ▷
            </button>
          </div>

          {/* Souvenir Polaroid Snapshot */}
          {snapped && (
            <div
              style={{
                marginTop: '28px',
                padding: '20px',
                borderRadius: '16px',
                background: 'var(--paper-raised)',
                border: '1.5px solid var(--line)',
                display: 'inline-block',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {capturedPhoto && (
                <div
                  style={{
                    background: '#fff',
                    padding: '12px 12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    marginBottom: '14px',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedPhoto}
                    alt="Scavenger Snap"
                    style={{ width: '240px', height: '180px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)', marginTop: '8px' }}>
                    Captured in {60 - seconds}s · {partnerA} &amp; {partnerB}
                  </div>
                </div>
              )}

              <div style={{ color: '#0a7d4d', fontWeight: 800, fontSize: '15px' }}>
                🎉 Round Captured! Point saved on couple scoreboard.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

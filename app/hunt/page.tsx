'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { Confetti, CoupleNameBar, ActivityShell } from '@/components/shared';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

export default function HuntPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [promptIdx, setPromptIdx] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [hunting, setHunting] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [scores, setScores] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [confettiActive, setConfettiActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-hunt` : 'local-hunt',
    activityType: 'hunt',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { promptIdx },
  });

  const prompts = [
    `Find: Something pink or heart-shaped in your room! 💖`,
    `Find: A gift, souvenir, or letter ${partnerB} gave you! 🎁`,
    `Find: The coziest oversized hoodie or sweater in your closet! 🧥`,
    `Find: The sweetest midnight snack in your kitchen! 🍪`,
    `Find: A souvenir or photo that reminds you of ${partnerB}! 💌`,
    `Find: An item that matches ${partnerA}'s favorite color! 🎨`,
    `Find: Something you bought together during your favorite trip! ✨`,
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
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera access not available. You can still play with manual click validation!',
      );
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
    setKeepsakeSaved(false);
  };

  const handleSaveToKeepsakes = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      let file: File | undefined;
      if (capturedPhoto) {
        const res = await fetch(capturedPhoto);
        const blob = await res.blob();
        file = new File([blob], `scavenger-hunt-${Date.now()}.jpg`, { type: 'image/jpeg' });
      }

      await saveKeepsake({
        kind: 'activity',
        title: `Scavenger Hunt Discovery · Clue #${promptIdx + 1}`,
        file,
        activityPath: '/hunt',
        caption: `Found in ${60 - seconds}s: "${prompts[promptIdx]}". Score: ${scores.a} - ${scores.b}.`,
        metadata: {
          activityType: 'hunt',
          prompt: prompts[promptIdx],
          scores,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save hunt keepsake:', err);
    }
  };

  return (
    <ActivityShell
      activityTitle="Room Scavenger Hunt"
      activitySubtitle="60-Second Real World Sprint · WebCam Capture & Room Trophy Passport"
      currentStage={snapped ? 'remember' : hunting ? 'play' : 'ready'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Scavenger Hunt · Clue #${promptIdx + 1}`,
        subtitle: `${partnerA}: ${scores.a} · ${partnerB}: ${scores.b} PTS`,
        badge: '🔍 HUNT LOGGED',
      }}
      guidancePhase={snapped ? 'completed' : hunting ? 'locked' : 'ready'}
      guidancePrivacyNote="Camera photos stay strictly local unless you explicitly tap Save to Keepsakes to preserve them in Our Space."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '16px 0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 800,
              margin: '8px 0',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            Race to find it, <span className="grad">snap it</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '52ch', margin: '0 auto' }}>
            Hold the secret room item to your screen before time runs out!
          </p>
        </div>

        {/* Hunt Arena Card */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>🔍</div>
          <h2
            style={{
              fontSize: '21px',
              fontWeight: 800,
              maxWidth: '520px',
              margin: '0 auto 16px',
              lineHeight: 1.4,
            }}
          >
            {prompts[promptIdx]}
          </h2>

          {/* Countdown Clock */}
          <div
            style={{
              fontSize: '48px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              color: seconds <= 10 && hunting ? '#DC2626' : 'var(--ink)',
              marginBottom: '20px',
            }}
          >
            00:{seconds < 10 ? `0${seconds}` : seconds}
          </div>

          {/* Live WebCam Box */}
          {cameraActive && (
            <div style={{ maxWidth: '400px', margin: '0 auto 20px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--line)' }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
              />
            </div>
          )}

          {cameraError && (
            <div style={{ color: '#B45309', fontSize: '12.5px', marginBottom: '16px' }}>
              {cameraError}
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {!cameraActive ? (
              <button onClick={startCamera} className="btn btn-ghost" style={{ fontSize: '13px' }}>
                📸 Enable Camera
              </button>
            ) : (
              <button onClick={stopCamera} className="btn btn-ghost" style={{ fontSize: '13px' }}>
                Turn Off Camera
              </button>
            )}

            {!hunting ? (
              <button onClick={startHunt} className="btn btn-grad" style={{ padding: '12px 32px', fontSize: '15px' }}>
                Start 60s Countdown ⏱️
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleFound('a')}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '14px', background: 'var(--pink)' }}
                >
                  🌸 {partnerA} Found It!
                </button>
                <button
                  onClick={() => handleFound('b')}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '14px', background: 'var(--blue)' }}
                >
                  💙 {partnerB} Found It!
                </button>
              </div>
            )}
          </div>

          {/* Captured Polaroid Review */}
          {snapped && (
            <div
              style={{
                marginTop: '20px',
                padding: '24px',
                borderRadius: '16px',
                background: 'var(--paper)',
                border: '1.5px solid var(--line)',
                display: 'inline-block',
                textAlign: 'center',
                animation: 'gl-rise 0.25s ease',
              }}
            >
              {capturedPhoto && (
                <div
                  style={{
                    background: '#FFF',
                    padding: '12px 12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                    marginBottom: '16px',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedPhoto}
                    alt="Scavenger Snap"
                    style={{
                      width: '260px',
                      height: '190px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)', marginTop: '8px' }}>
                    Captured in {60 - seconds}s · {partnerA} &amp; {partnerB}
                  </div>
                </div>
              )}

              <div style={{ color: '#0A7D4D', fontWeight: 800, fontSize: '15px', marginBottom: '16px' }}>
                🎉 Clue Solved! Score logged on couple scoreboard.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSaveToKeepsakes}
                  disabled={keepsakeSaved || keepsakeSaving}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  {keepsakeSaved ? '✓ Saved to Keepsakes!' : keepsakeSaving ? 'Archiving...' : 'Save Discovery 💾'}
                </button>
                <button onClick={handleNextClue} className="btn btn-grad" style={{ padding: '8px 22px', fontSize: '13px' }}>
                  Next Room Clue ▷
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ActivityShell>
  );
}

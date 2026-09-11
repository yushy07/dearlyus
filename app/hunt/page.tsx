'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { Confetti, CoupleNameBar, ActivityShell } from '@/components/shared';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { uploadTemporaryActivityAsset } from '@/lib/activity-records';

export default function HuntPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();
  const { space } = useCoupleSpace();

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
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'sending' | 'received' | 'failed'>('idle');
  const [partnerProof, setPartnerProof] = useState<string | null>(null);

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
    const snapshot = runtime.snapshot as {
      roundIndex?: number; scoreA?: number; scoreB?: number; deadlineAt?: string | null;
      proofAUrl?: string | null; proofBUrl?: string | null;
    };
    if (typeof snapshot.roundIndex === 'number') setPromptIdx(snapshot.roundIndex % prompts.length);
    if (typeof snapshot.scoreA === 'number' && typeof snapshot.scoreB === 'number') {
      setScores({ a: snapshot.scoreA, b: snapshot.scoreB });
    }
    if (snapshot.deadlineAt) {
      setDeadlineAt(snapshot.deadlineAt);
      setHunting(new Date(snapshot.deadlineAt).getTime() > Date.now());
    }
    const remoteUrl = runtime.isHost ? snapshot.proofBUrl : snapshot.proofAUrl;
    if (remoteUrl) setPartnerProof(remoteUrl);
  }, [runtime.snapshot, runtime.isHost]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (hunting && deadlineAt) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1000));
        setSeconds(remaining);
        if (remaining === 0) {
          setHunting(false);
          setSnapped(true);
        }
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hunting, deadlineAt]);

  const startHunt = () => {
    sounds.playPop();
    setHunting(true);
    setSnapped(false);
    setCapturedPhoto(null);
    setSeconds(60);
    const deadline = new Date(Date.now() + 60_000).toISOString();
    setDeadlineAt(deadline);
    void runtime.sendEvent('hunt_prompt_start', { prompt: prompts[promptIdx], deadlineAt: deadline });
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
    const scorer = runtime.transportName === 'mock' ? who : runtime.isHost ? 'a' : 'b';
    sounds.playCelebration();
    setHunting(false);
    setSnapped(true);
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3500);

    const snap = captureFrame();
    if (snap) {
      setCapturedPhoto(snap);
      if (space?.id) {
        setUploadState('sending');
        void fetch(snap).then((response) => response.blob()).then(async (blob) => {
        const asset = await uploadTemporaryActivityAsset({
          coupleId: space.id, sessionId: runtime.sessionId, file: blob, mediaKind: 'image',
        });
        await runtime.sendEvent('hunt_proof_submit', {
          promptIndex: promptIdx, assetId: asset.id, signedUrl: asset.signedUrl,
          submittedBy: runtime.currentUserId, isA: scorer === 'a',
        });
        await runtime.sendEvent('hunt_react', {
          scoreA: scorer === 'a' ? scores.a + 1 : scores.a,
          scoreB: scorer === 'b' ? scores.b + 1 : scores.b,
        });
        setUploadState('received');
      }).catch((error) => {
        setUploadState('failed');
        console.error('Failed to share private hunt proof:', error);
      });
      }
    } else {
      void runtime.sendEvent('hunt_proof_submit', {
        promptIndex: promptIdx, submittedBy: runtime.currentUserId, isA: scorer === 'a',
      });
      void runtime.sendEvent('hunt_react', {
        scoreA: scorer === 'a' ? scores.a + 1 : scores.a,
        scoreB: scorer === 'b' ? scores.b + 1 : scores.b,
      });
    }
  };

  const handleNextClue = () => {
    sounds.playPop();
    const next = (promptIdx + 1) % prompts.length;
    setPromptIdx(next);
    setHunting(false);
    setSnapped(false);
    setCapturedPhoto(null);
    setSeconds(60);
    setKeepsakeSaved(false);
    setPartnerProof(null);
    setUploadState('idle');
    const nextDeadline = new Date(Date.now() + 60_000).toISOString();
    void runtime.sendEvent('hunt_next_round', { prompt: prompts[next], deadlineAt: nextDeadline });
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
                  disabled={runtime.transportName !== 'mock' && !runtime.isHost}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '14px', background: 'var(--pink)' }}
                >
                  🌸 {partnerA} Found It!
                </button>
                <button
                  onClick={() => handleFound('b')}
                  disabled={runtime.transportName !== 'mock' && runtime.isHost}
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

              {uploadState === 'sending' && (
                <p style={{ fontSize: '12px' }}>Sending your proof securely…</p>
              )}
              {uploadState === 'failed' && (
                <p style={{ color: '#B45309', fontSize: '12px' }}>
                  Upload failed. Tap your Found It button to retry.
                </p>
              )}
              {partnerProof && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>
                    Your partner&apos;s proof
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partnerProof}
                    alt="Partner scavenger hunt proof"
                    style={{ width: '220px', borderRadius: '10px' }}
                  />
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

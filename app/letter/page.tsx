'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Confetti,
  CoupleNameBar,
  ActivityShell,
} from '@/components/shared';
import { sounds } from '@/lib/sound';
import {
  WaxSealEnvelope,
} from '@/components/ui';
import { useCoupleProfile } from '@/lib/couple';
import { sanitizeSafeAudioUrl } from '@/lib/audio-security';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';

export { sanitizeSafeAudioUrl };

interface SealedCapsule {
  id: string;
  title: string;
  author: string;
  unlockDate: string;
  content: string;
  stamp: string;
  waxColor: string;
  voiceNoteUrl?: string;
  voiceDurationSec?: number;
}

const WAX_COLORS = [
  { id: 'crimson', name: 'Royal Crimson', hex: '#991B1B' },
  { id: 'rose', name: 'Rose Quartz', hex: '#E11D48' },
  { id: 'plum', name: 'Midnight Plum', hex: '#4C1D95' },
  { id: 'honey', name: 'Warm Amber', hex: '#B45309' },
];

export default function LetterPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [activeWriter, setActiveWriter] = useState<'A' | 'B'>('A');
  const [unlockDate, setUnlockDate] = useState('2027-08-01');
  const [letterTitle, setLetterTitle] = useState(
    'To Us on Our Next Chapter 💌',
  );
  const [letterContent, setLetterContent] = useState(
    'If you are reading this, we have officially closed the distance. Remember the late night video calls, the airport goodbyes, and how we promised each other this day would come? I love you more than ever.',
  );
  const [stamp, setStamp] = useState('🌸');
  const [selectedWax, setSelectedWax] = useState(WAX_COLORS[1]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [activeCapsule, setActiveCapsule] = useState<SealedCapsule | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Vault state
  const [vault, setVault] = useState<SealedCapsule[]>([
    {
      id: '1',
      title: 'Our 1st Milestone Capsule',
      author: `${partnerA} ♡ ${partnerB}`,
      unlockDate: '2026-10-15',
      content:
        'Locked in the digital vault. Only accessible when our countdown reaches zero.',
      stamp: '💖',
      waxColor: '#E11D48',
    },
    {
      id: '2',
      title: 'The Day We Close the Distance',
      author: partnerB,
      unlockDate: '2027-05-20',
      content: 'A secret letter written on a quiet evening, looking forward to our home.',
      stamp: '✈️',
      waxColor: '#4C1D95',
    },
  ]);

  const [sealedSuccessfully, setSealedSuccessfully] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-letter` : 'local-letter',
    activityType: 'letter',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { letterTitle, unlockDate },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dearly_sealed_vault');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitizedVault: SealedCapsule[] = parsed.map((item) => ({
            id: String(item?.id || ''),
            title: String(item?.title || ''),
            author: String(item?.author || ''),
            unlockDate: String(item?.unlockDate || ''),
            content: String(item?.content || ''),
            stamp: String(item?.stamp || '💌'),
            waxColor: String(item?.waxColor || '#E11D48'),
            voiceNoteUrl: sanitizeSafeAudioUrl(item?.voiceNoteUrl),
            voiceDurationSec:
              typeof item?.voiceDurationSec === 'number'
                ? item.voiceDurationSec
                : undefined,
          }));
          setVault(sanitizedVault);
        }
      }
    } catch {}
  }, []);

  const saveVault = (capsules: SealedCapsule[]) => {
    try {
      localStorage.setItem('dearly_sealed_vault', JSON.stringify(capsules));
    } catch {}
  };

  const startVoiceRecording = async () => {
    try {
      sounds.playPop();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Audio recording is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert('Please allow microphone access to record your voice memo.');
    }
  };

  const stopVoiceRecording = () => {
    sounds.playPop();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const deleteVoiceRecording = () => {
    sounds.playPop();
    if (recordedAudioUrl) {
      try {
        URL.revokeObjectURL(recordedAudioUrl);
      } catch {}
    }
    setRecordedAudioUrl(null);
    setRecordSeconds(0);
  };

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterContent.trim() || !letterTitle.trim()) return;

    const currentAuthor = activeWriter === 'A' ? partnerA : partnerB;
    const newCapsule: SealedCapsule = {
      id: Date.now().toString(),
      title: letterTitle,
      author: `${currentAuthor} (for ${currentAuthor === partnerA ? partnerB : partnerA})`,
      unlockDate,
      content: letterContent,
      stamp,
      waxColor: selectedWax.hex,
      voiceNoteUrl: sanitizeSafeAudioUrl(recordedAudioUrl),
      voiceDurationSec: recordSeconds > 0 ? recordSeconds : undefined,
    };

    const updated = [...vault, newCapsule];
    setVault(updated);
    saveVault(updated);
    setSealedSuccessfully(true);
    sounds.playCelebration();
    setConfettiActive(true);

    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Wax Sealed Capsule · ${letterTitle}`,
        activityPath: '/letter',
        caption: `Sealed by ${currentAuthor} with ${selectedWax.name} wax. Unlocks on ${unlockDate}.`,
        metadata: {
          activityType: 'letter',
          unlockDate,
          stamp,
          waxColor: selectedWax.hex,
          author: currentAuthor,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch {}

    setTimeout(() => setConfettiActive(false), 3000);
  };

  return (
    <ActivityShell
      activityTitle="Letters to the Future"
      activitySubtitle="Wax Seal Time Capsule · Dual Writing Desks & Timestamp Locks"
      currentStage={sealedSuccessfully ? 'remember' : letterContent.length > 20 ? 'play' : 'ready'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Sealed Letter · ${letterTitle.slice(0, 24)}`,
        subtitle: `Locked until ${unlockDate} · ${vault.length} in Vault`,
        badge: '💌 WAX SEALED',
      }}
      guidancePhase={sealedSuccessfully ? 'locked' : 'private'}
      guidancePrivacyNote="Letters are private while drafting. Once stamped with digital wax, they are locked until the designated unlock date."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '16px 0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 800,
              margin: '8px 0',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            Write now, <span className="grad">open years from now</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '52ch', margin: '0 auto' }}>
            A sealed time-capsule letter locked with digital wax until your chosen reunion date or anniversary.
          </p>
        </div>

        {/* Dual Desk Switcher */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveWriter('A');
              sounds.playPop();
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              border: activeWriter === 'A' ? '2px solid #E11D48' : '1px solid var(--line)',
              background: activeWriter === 'A' ? '#FFF5F8' : '#FFF',
              fontWeight: 700,
              fontSize: '13px',
              color: activeWriter === 'A' ? '#BE123C' : 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            🌸 {partnerA}&apos;s Desk
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveWriter('B');
              sounds.playPop();
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              border: activeWriter === 'B' ? '2px solid #2563EB' : '1px solid var(--line)',
              background: activeWriter === 'B' ? '#EFF6FF' : '#FFF',
              fontWeight: 700,
              fontSize: '13px',
              color: activeWriter === 'B' ? '#1D4ED8' : 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            💙 {partnerB}&apos;s Desk
          </button>
        </div>

        {!sealedSuccessfully ? (
          <form
            onSubmit={handleSeal}
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
              display: 'grid',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Letter Envelope Title:
              </label>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  fontSize: '15px',
                  fontWeight: 700,
                }}
                required
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: 'var(--ink-soft)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Unlock Milestone Date:
                </label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              {/* Wax & Stamp Ceremony Selectors */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: 'var(--ink-soft)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Wax Color &amp; Stamp:
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {WAX_COLORS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWax(w)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: w.hex,
                        border: selectedWax.id === w.id ? '2px solid #17181C' : '2px solid #FFF',
                        boxShadow: selectedWax.id === w.id ? `0 0 0 2px ${w.hex}` : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                  <div style={{ width: '1px', height: '24px', background: 'var(--line)', margin: '0 4px' }} />
                  {['🌸', '💖', '💍', '🕊️', '✈️', '💌'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStamp(s)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: stamp === s ? '2px solid var(--pink)' : '1px solid var(--line)',
                        background: stamp === s ? 'var(--pink-tint)' : '#fff',
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Letter Body */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Dear Future Us (Letter Body):
              </label>
              <textarea
                rows={6}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                placeholder="Write your heartfelt thoughts, dreams, and promises to read years from now..."
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  fontSize: '14.5px',
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}
                required
              />
            </div>

            {/* Voice Note Whisper Box */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px dashed #E5D5C5',
                borderRadius: '14px',
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🎙️</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#2B231E' }}>
                      Whisper Inscription (Voice Memo)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      Attach your real voice inside the wax-sealed capsule
                    </div>
                  </div>
                </div>

                {recordedAudioUrl && (
                  <button
                    type="button"
                    onClick={deleteVoiceRecording}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#D93838',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Discard Recording
                  </button>
                )}
              </div>

              {!recordedAudioUrl ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="btn btn-outline"
                      style={{ padding: '6px 14px', fontSize: '12.5px' }}
                    >
                      ● Record Voice Note
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12.5px', background: '#D93838' }}
                    >
                      ■ Stop ({recordSeconds}s)
                    </button>
                  )}
                  {isRecording && (
                    <span style={{ fontSize: '12px', color: '#D93838', fontWeight: 700 }}>
                      Recording voice note...
                    </span>
                  )}
                </div>
              ) : (
                <audio controls src={recordedAudioUrl} style={{ width: '100%', height: '36px' }} />
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="submit"
                className="btn btn-grad"
                style={{ padding: '14px 44px', fontSize: '15px' }}
              >
                Melt Wax &amp; Seal Letter Ceremony 💌
              </button>
            </div>
          </form>
        ) : (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              animation: 'gl-rise 0.3s ease',
              marginBottom: '40px',
            }}
          >
            <div style={{ maxWidth: '320px', margin: '0 auto 24px' }}>
              <WaxSealEnvelope
                stampEmoji={stamp}
                isUnlocked={false}
                title={letterTitle}
              />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '12px 0 8px' }}>
              Letter Sealed &amp; Vaulted!
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '48ch', margin: '0 auto 24px' }}>
              Your words are safely preserved until {unlockDate}. It has also been saved to your couple space keepsakes.
            </p>

            <button
              onClick={() => {
                setSealedSuccessfully(false);
                setLetterTitle('Another Letter to Our Future 💌');
                setLetterContent('');
                setRecordedAudioUrl(null);
              }}
              className="btn btn-ghost"
              style={{ fontSize: '13px' }}
            >
              + Inscribe Another Sealed Letter
            </button>
          </div>
        )}

        {/* Sealed Vault Grid */}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
            Couple Vault ({vault.length} Letters)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {vault.map((cap) => (
              <div
                key={cap.id}
                style={{
                  background: 'var(--paper-raised)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>{cap.stamp}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                    🔒 UNLOCKS: {cap.unlockDate}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)', marginBottom: '4px' }}>
                  {cap.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                  By {cap.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ActivityShell>
  );
}

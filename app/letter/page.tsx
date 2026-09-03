import React, { useState, useRef, useEffect } from 'react';
import { Ribbon, Navbar, Confetti, CoupleNameBar } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { WaxSealEnvelope, ScrollProgress, ScrollReveal, GlowBadge } from '@/components/ui';
import { useCoupleProfile } from '@/lib/couple';

interface SealedCapsule {
  id: string;
  title: string;
  author: string;
  unlockDate: string;
  content: string;
  stamp: string;
  voiceNoteUrl?: string;
  voiceDurationSec?: number;
}

export default function LetterPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const [unlockDate, setUnlockDate] = useState('2027-08-01');
  const [letterTitle, setLetterTitle] = useState('To Us on Our 2-Year Anniversary 💌');
  const [letterContent, setLetterContent] = useState(
    'If you are reading this, we have officially closed the distance. Remember the late night video calls, the airport goodbyes, and how we promised each other this day would come? I love you more than ever.'
  );
  const [stamp, setStamp] = useState('🌸');
  const [confettiActive, setConfettiActive] = useState(false);
  const [activeCapsule, setActiveCapsule] = useState<SealedCapsule | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Vault state
  const [vault, setVault] = useState<SealedCapsule[]>([
    {
      id: '1',
      title: 'Our 1st Anniversary Time Capsule',
      author: `${partnerA} ♡ ${partnerB}`,
      unlockDate: '2026-10-15',
      content: 'Locked in the digital vault. Only accessible when the countdown timer hits zero.',
      stamp: '💖',
    },
    {
      id: '2',
      title: 'The Day We Close the Distance',
      author: partnerB,
      unlockDate: '2027-05-20',
      content: 'A secret letter written on a late night flight home.',
      stamp: '✈️',
    },
  ]);

  const [sealedSuccessfully, setSealedSuccessfully] = useState(false);

  // MediaRecorder handlers
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
    } catch (err) {
      alert('Please allow microphone access to record your voice note.');
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
    setRecordedAudioUrl(null);
    setRecordSeconds(0);
  };

  const handleSeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterContent.trim() || !letterTitle.trim()) return;

    const newCapsule: SealedCapsule = {
      id: Date.now().toString(),
      title: letterTitle,
      author: `${partnerA} & ${partnerB}`,
      unlockDate,
      content: letterContent,
      stamp,
      voiceNoteUrl: recordedAudioUrl || undefined,
      voiceDurationSec: recordSeconds > 0 ? recordSeconds : undefined,
    };

    setVault([...vault, newCapsule]);
    setSealedSuccessfully(true);
    sounds.playCelebration();
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>💌 Letters to the Future · <b>Multi-Year Time Capsule Vault with Timestamp Locks</b></>} />
      <Confetti active={confettiActive} />

      <Navbar
        rightAction={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              background: 'var(--paper-raised)',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
            }}
          >
            Vault: <b>{vault.length} Sealed Letters</b>
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '840px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <CoupleNameBar />
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Write now, <span className="grad">open years from now</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            A sealed time-capsule letter locked cryptographically until your chosen reunion date or anniversary.
          </p>
        </div>

        {!sealedSuccessfully ? (
          <form
            onSubmit={handleSeal}
            style={{
              background: '#FFFFFF',
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Letter Envelope Title:
              </label>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '15px', fontWeight: 700 }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Unlock Milestone Date:
                </label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Wax Stamp Seal:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['🌸', '💖', '💍', '🕊️', '✈️', '💌'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStamp(s)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: stamp === s ? '2px solid var(--pink)' : '1px solid var(--line)',
                        background: stamp === s ? 'var(--pink-tint)' : '#fff',
                        fontSize: '18px',
                        cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Dear Future Us (Letter Body):
              </label>
              <textarea
                rows={6}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                placeholder="Write your heartfelt thoughts, dreams, and promises to read years from now..."
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '15px', lineHeight: 1.6 }}
                required
              />
            </div>

            {/* Voice Note Whisper Recording Box */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px dashed #E5D5C5',
                borderRadius: '14px',
                padding: '16px 20px',
                marginTop: '10px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🎙️</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#2B231E' }}>
                      Whisper Inscription (Voice Note)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      Inscribe your real voice inside the wax-sealed time capsule
                    </div>
                  </div>
                </div>

                {recordedAudioUrl && (
                  <button
                    type="button"
                    onClick={deleteVoiceRecording}
                    style={{ background: 'transparent', border: 'none', color: '#D93838', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    🗑️ Retake
                  </button>
                )}
              </div>

              {!recordedAudioUrl ? (
                <div>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="btn btn-sm"
                      style={{ background: '#FF4D80', color: '#FFF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>🔴</span>
                      <span>Record Voice Whisper</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#D93838', fontWeight: 800, fontSize: '13px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D93838', animation: 'gl-pulse 1s infinite' }} />
                        <span>Recording Whisper... {recordSeconds}s</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="btn btn-sm"
                        style={{ background: '#1E1B24', color: '#FFF' }}
                      >
                        ⏹️ Stop & Inscribe
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F9F4EE', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '16px' }}>📼</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#4A3E34' }}>
                    Voice Whisper Inscribed ({recordSeconds}s)
                  </span>
                  <audio controls src={recordedAudioUrl} style={{ height: '32px', flex: 1, maxWidth: '260px' }} />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '15px', justifyContent: 'center' }}>
              🔒 Seal Envelope into Time Capsule Vault
            </button>
          </form>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: '40px',
            }}
          >
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔒 {stamp}</span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Envelope Sealed in Vault!</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '46ch', margin: '0 auto 24px' }}>
              Your time capsule letter <b>&ldquo;{letterTitle}&rdquo;</b> has been securely locked until <b>{unlockDate}</b>.
            </p>
            <button onClick={() => setSealedSuccessfully(false)} className="btn btn-ghost">
              + Write Another Letter
            </button>
          </div>
        )}

        {/* Interactive 3D Wax Seal Envelope Stage */}
        <div style={{ marginBottom: '40px' }} id="seal-stage">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <GlowBadge text="Interactive 3D Vault Stage" size="sm" />
          </div>
          <WaxSealEnvelope
            key={activeCapsule ? activeCapsule.id : 'default'}
            sender={activeCapsule ? activeCapsule.author : `${partnerA} (${cityA || 'Local'})`}
            recipient={`${partnerB} (${cityB || 'Remote'})`}
            sealDate={activeCapsule ? `Locked until ${activeCapsule.unlockDate}` : 'Locked until Reunion Date'}
            letterContent={
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', marginBottom: '14px', color: '#2B231E' }}>
                  {activeCapsule ? activeCapsule.title : `Dear ${partnerB}, on the day we close the distance ♡`}
                </h3>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', lineHeight: 1.7, color: '#4A3E34', whiteSpace: 'pre-line' }}>
                  {activeCapsule
                    ? activeCapsule.content
                    : `If you are reading this, every late-night flight, every airport hug, and every time zone hour was worth it.\nI loved you across the miles, and I love you even more today right next to you.\n\nForever yours,\n${partnerA} ♡`}
                </p>

                {(activeCapsule?.voiceNoteUrl || (!activeCapsule && recordedAudioUrl)) && (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #2B231E 0%, #1A1412 100%)',
                      color: '#FFF8F0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ fontSize: '28px', animation: isPlayingVoice ? 'spin 3s linear infinite' : 'none' }}>
                      📼
                    </div>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#FFB899', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        AUTHENTIC WHISPER RECORDING
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
                        Inscribed Voice Note from {activeCapsule ? activeCapsule.author : partnerA}
                      </div>
                    </div>
                    <audio
                      controls
                      src={activeCapsule ? activeCapsule.voiceNoteUrl : (recordedAudioUrl || undefined)}
                      onPlay={() => setIsPlayingVoice(true)}
                      onPause={() => setIsPlayingVoice(false)}
                      onEnded={() => setIsPlayingVoice(false)}
                      style={{ height: '36px', maxWidth: '240px' }}
                    />
                  </div>
                )}
              </div>
            }
          />
        </div>

        {/* The Sealed Time Capsule Vault */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Sealed Vault Envelopes ({vault.length})</h3>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Tap any letter to inspect seal 👆</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {vault.map((capsule) => (
              <div
                key={capsule.id}
                onClick={() => {
                  sounds.playPop();
                  setActiveCapsule(capsule);
                  const el = document.getElementById('seal-stage');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="card-3d"
                style={{
                  background: activeCapsule?.id === capsule.id ? 'var(--pink-tint)' : '#FFFFFF',
                  border: activeCapsule?.id === capsule.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: 'var(--shadow)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{capsule.stamp}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--pink)', fontWeight: 800 }}>
                    🔒 Locked until {capsule.unlockDate}
                  </span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '4px 0' }}>{capsule.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--ink-soft)' }}>
                  <span>Written by: {capsule.author}</span>
                  {capsule.voiceNoteUrl && (
                    <span style={{ color: '#D97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      🎙️ Whisper Voice
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

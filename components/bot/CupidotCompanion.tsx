import React, { useState, useEffect, useRef } from 'react';
import { CupidotBot, BotState } from './CupidotBot';
import { getRandomCupidotThought, getPokedCupidotDilemma, CupidotDilemma } from '@/lib/cupidot';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { speakCupidot, getStoredVoiceMode, setStoredVoiceMode, VoiceMode, VoiceMood } from '@/lib/voice';
import { RomanticEmergencyModal } from './RomanticEmergencyModal';

export function CupidotCompanion() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [botState, setBotState] = useState<BotState>('idle');
  const [thought, setThought] = useState(getRandomCupidotThought());
  const [activeDilemma, setActiveDilemma] = useState<CupidotDilemma | null>(null);
  const [pokedCount, setPokedCount] = useState(0);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('chirp');
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  useEffect(() => {
    setVoiceMode(getStoredVoiceMode());
  }, []);

  // Cycle cheeky thoughts every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setThought(getRandomCupidotThought());
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const toggleVoiceMode = () => {
    sounds.playTick();
    const modes: VoiceMode[] = ['chirp', 'speech', 'mute'];
    const nextIdx = (modes.indexOf(voiceMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setVoiceMode(nextMode);
    setStoredVoiceMode(nextMode);
    if (nextMode !== 'mute') {
      speakCupidot("Voice updated!", { mood: 'happy' });
    }
  };

  const pokeTimestampsRef = useRef<number[]>([]);

  const handlePoke = () => {
    sounds.playPop();
    const now = Date.now();
    pokeTimestampsRef.current = [...pokeTimestampsRef.current.filter((t: number) => now - t < 6000), now];

    // Rapid poke tantrum
    if (pokeTimestampsRef.current.length >= 3) {
      setBotState('angry');
      setPokedCount((prev) => prev + 1);
      setIsOpen(true);
      const angryLines = [
        `Hey! Stop poking my nose! I am a sophisticated Cupid AI, not a squeaky stress ball! 😤💢`,
        `Personal space violation! One more poke and I will report you to Judge Cupidot! 🔨😡`,
        `Ouch! Do that again and I am assigning fifty relationship penalty chores to your record! 😤`,
      ];
      const line = angryLines[Math.floor(Math.random() * angryLines.length)];
      speakCupidot(line, {
        mood: 'angry',
        onEnd: () => {
          setBotState('pouty');
          setTimeout(() => setBotState('idle'), 2500);
        },
      });
      return;
    }

    setBotState('love');
    const dilemma = getPokedCupidotDilemma(partnerA, partnerB);
    setActiveDilemma(dilemma);
    setPokedCount((prev) => prev + 1);
    setIsOpen(true);
    speakCupidot(dilemma.question, { mood: 'sassy' });

    setTimeout(() => {
      setBotState('happy');
    }, 1500);
  };

  return (
    <>
      {/* Floating Cupidot Companion Dock Pill */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        {/* Cheeky Floating Thought Bubble */}
        {!isOpen && (
          <div
            onClick={() => {
              sounds.playPop();
              setIsOpen(true);
              setBotState('happy');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1.5px solid rgba(255, 123, 163, 0.35)',
              padding: '6px 14px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(255, 77, 128, 0.15), 0 2px 6px rgba(0,0,0,0.06)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: '#C93B6B',
              cursor: 'pointer',
              maxWidth: '260px',
              animation: 'fade-in 0.3s ease',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {thought}
          </div>
        )}

        {/* 3D Bot Mini Trigger Button */}
        <div
          onClick={() => {
            sounds.playPop();
            setIsOpen(!isOpen);
            setBotState(isOpen ? 'idle' : 'happy');
          }}
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFF5F7 0%, #FFE5EC 100%)',
            border: '2px solid rgba(255, 77, 128, 0.4)',
            boxShadow: '0 10px 30px rgba(255, 77, 128, 0.3), inset 0 2px 6px rgba(255,255,255,0.8)',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            setBotState('love');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1.0)';
            setBotState('idle');
          }}
          title="Cupidot 3D Romantic Mascot · Poke for Drama"
        >
          <div style={{ width: '80px', height: '80px', marginTop: '6px' }}>
            <CupidotBot state={botState} scale={2.4} showGlow={false} showParticles={false} />
          </div>

          {/* Tiny Status Indicator Pulse */}
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10B981',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 8px #10B981',
            }}
          />
        </div>
      </div>

      {/* Expanded Cheeky Dilemma Drawer Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 16px',
            background: 'rgba(15, 17, 23, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sounds.playPop();
              setIsOpen(false);
              setBotState('idle');
            }
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '2px solid rgba(255, 123, 163, 0.3)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3), 0 0 30px rgba(255, 77, 128, 0.2)',
              width: '100%',
              maxWidth: '420px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* 3D Header Stage with Cupidot */}
            <div
              style={{
                background: 'linear-gradient(180deg, #FFF0F5 0%, #FFFFFF 100%)',
                padding: '24px 20px 12px',
                textAlign: 'center',
                position: 'relative',
                borderBottom: '1px solid rgba(255, 123, 163, 0.15)',
              }}
            >
              <div style={{ width: '130px', height: '130px', margin: '0 auto -10px' }}>
                <CupidotBot state={botState} scale={2.1} />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 77, 128, 0.1)', color: '#FF4D80', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                <span>ʚ🤖💘ɞ</span>
                <span>CUPIDOT · CHEEKY AI COMPANION</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '8px 0 2px', color: '#1B1C22' }}>
                &ldquo;You asked for drama? I deliver.&rdquo;
              </h3>
              <p style={{ fontSize: '12px', color: '#6A6C75', margin: 0 }}>
                Autonomous on-device heuristic engine · Active when Gemini rests
              </p>

              {/* Quick Controls Bar: Voice & Emergency */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={toggleVoiceMode}
                  style={{
                    background: '#FFF',
                    border: '1px solid rgba(255, 77, 128, 0.25)',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: voiceMode === 'mute' ? '#888' : '#FF4D80',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Toggle Cupidot Voice Mode"
                >
                  {voiceMode === 'chirp' ? '🐥 Cute Chirps' : voiceMode === 'speech' ? '🗣️ Read Aloud' : '🔇 Muted'}
                </button>

                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsOpen(false);
                    setEmergencyOpen(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #FF4D80, #FF758C)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(255, 77, 128, 0.3)',
                  }}
                >
                  <span>🚨</span>
                  <span>Emergency Roulette</span>
                </button>
              </div>

              <button
                onClick={() => {
                  sounds.playPop();
                  setIsOpen(false);
                  setBotState('idle');
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            {/* Content: Dilemma or Poke Action */}
            <div style={{ padding: '20px' }}>
              {activeDilemma ? (
                <div style={{ background: '#FFFDF9', border: '1.5px solid #F3E8DC', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>
                      🔥 CHEEKY DILEMMA #{pokedCount}
                    </span>
                    <span style={{ fontSize: '12px' }}>🌶️</span>
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.4, color: '#1B1C22', margin: '0 0 12px' }}>
                    &ldquo;{activeDilemma.question}&rdquo;
                  </h4>

                  <div style={{ display: 'grid', gap: '6px' }}>
                    {activeDilemma.options.map((opt, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          sounds.playPop();
                          setBotState('celebration');
                          setTimeout(() => setBotState('happy'), 1500);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E0D6',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#E11D48', marginTop: '12px', background: 'rgba(255, 77, 128, 0.06)', padding: '8px 10px', borderRadius: '8px' }}>
                    {activeDilemma.commentary}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: '13px', color: '#555761', margin: '0 0 16px' }}>
                    Need a spicy question to make your partner blush? Cupidot has dozens ready.
                  </p>
                </div>
              )}

              {/* Emotion & Tone Tester Bar */}
              <div style={{ marginBottom: '16px', background: '#FFFDF9', border: '1px dashed #FFD6E8', borderRadius: '14px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', textTransform: 'uppercase' }}>
                    🎭 EMOTION &amp; TONE TESTER
                  </span>
                  <span style={{ fontSize: '10px', color: '#888' }}>Tap to hear &amp; see 3D reactions</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[
                    { state: 'angry' as BotState, mood: 'angry' as VoiceMood, label: 'Angry 😤', line: "Stop stealing the blanket! That is a Class One relationship felony! 😡" },
                    { state: 'sassy' as BotState, mood: 'sassy' as VoiceMood, label: 'Sassy 💅', line: "Oh please! We both know you were the one who fell in love first. 😏" },
                    { state: 'shock' as BotState, mood: 'shock' as VoiceMood, label: 'Shocked 😲', line: "Wait, you finished the midnight snack without saving me a bite?! 🍕😱" },
                    { state: 'tweaking' as BotState, mood: 'tweaking' as VoiceMood, label: 'Tweaking ⚡', line: "Alert! Proximity magnetic overload! Mutual devotion is off the charts! 🤖✨" },
                    { state: 'pouty' as BotState, mood: 'pouty' as VoiceMood, label: 'Pouty 🥺', line: "Hmph. Fine. You didn't reply to my voice note for fourteen minutes. 💔" },
                    { state: 'love' as BotState, mood: 'love' as VoiceMood, label: 'Lovey 💖', line: "You two are the cutest humans on this entire planet. My circuits are melting. 🥰" },
                    { state: 'celebration' as BotState, mood: 'celebration' as VoiceMood, label: 'Party 🥳', line: "Woohoo! Maximum romantic aura unlocked! Time to celebrate! 🎉" },
                  ].map((item) => (
                    <button
                      key={item.state}
                      onClick={() => {
                        sounds.playPop();
                        setBotState(item.state);
                        speakCupidot(item.line, {
                          mood: item.mood,
                          onEnd: () => setTimeout(() => setBotState('happy'), 1500),
                        });
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '16px',
                        border: botState === item.state ? '1.5px solid #FF4D80' : '1px solid #E5E0D6',
                        background: botState === item.state ? '#FFF0F5' : '#FFF',
                        color: botState === item.state ? '#FF4D80' : '#444',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action: Poke Again */}
              <button
                onClick={handlePoke}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #FF4D80 0%, #FF9E64 100%)',
                  boxShadow: '0 6px 20px rgba(255, 77, 128, 0.35)',
                }}
              >
                <span>🌶️</span>
                <span>{activeDilemma ? 'Poke Again for Another Dilemma' : 'Poke Cupidot for a Cheeky Dilemma 🌶️'}</span>
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setIsOpen(false);
                  setEmergencyOpen(true);
                }}
                className="btn btn-ghost"
                style={{
                  width: '100%',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#FF4D80',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>🚨</span>
                <span>Trigger Romantic Emergency Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spontaneous Romantic Emergency Modal */}
      <RomanticEmergencyModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        partnerA={partnerA}
        partnerB={partnerB}
      />
    </>
  );
}

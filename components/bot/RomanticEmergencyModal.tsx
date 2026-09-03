'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CupidotBot } from './CupidotBot';
import { sounds } from '@/lib/sound';
import { speakCupidot } from '@/lib/voice';

export interface RomanticEmergencyProps {
  isOpen: boolean;
  onClose: () => void;
  partnerA: string;
  partnerB: string;
}

type EmergencyType = 'blitz' | 'stare' | 'compliment';

const BLITZ_QUESTIONS = [
  'Cupidot Emergency: Who has the most chaotic midnight snack cravings? 🍫',
  'Cupidot Emergency: Who takes longer to get ready for a video call date? 💄',
  'Cupidot Emergency: In a zombie apocalypse, who survives 5 minutes longer? 🧟',
  'Cupidot Emergency: Who would accidentally burn the toast on anniversary breakfast? 🍞',
  'Cupidot Emergency: Who is more likely to fall asleep during movie night? 🍿',
  'Cupidot Emergency: Who hogs the blanket in spirit across the miles? 🛌',
];

const COMPLIMENT_PROMPTS = [
  'must look their partner in the eye and confess the exact moment they realized they were in deep trouble (in love).',
  'must name 3 specific little habits of their partner that make them smile every single day.',
  'must speak aloud their favorite physical feature of their partner without using the word "cute".',
  'must explain why the long distance is 1000% worth every single kilometer.',
  'must describe their partner using only 3 romantic adjectives and a dramatic opera bow.',
];

export function RomanticEmergencyModal({ isOpen, onClose, partnerA, partnerB }: RomanticEmergencyProps) {
  const [eventType, setEventType] = useState<EmergencyType>('blitz');
  const [timer, setTimer] = useState<number>(30);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [pickA, setPickA] = useState<string | null>(null);
  const [pickB, setPickB] = useState<string | null>(null);
  const [currentBlitz, setCurrentBlitz] = useState<string>(BLITZ_QUESTIONS[0]);
  const [currentCompliment, setCurrentCompliment] = useState<string>('');
  const [assignedSpeaker, setAssignedSpeaker] = useState<string>(partnerA);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamActive, setWebcamActive] = useState(false);

  // Initialize new emergency challenge when opened
  useEffect(() => {
    if (isOpen) {
      const types: EmergencyType[] = ['blitz', 'stare', 'compliment'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      setEventType(chosen);
      setCompleted(false);
      setPickA(null);
      setPickB(null);

      sounds.playCelebration();

      if (chosen === 'blitz') {
        const q = BLITZ_QUESTIONS[Math.floor(Math.random() * BLITZ_QUESTIONS.length)];
        setCurrentBlitz(q);
        setTimer(30);
        setIsRunning(true);
        speakCupidot(`Emergency! ${q}`, { mood: 'talking' });
      } else if (chosen === 'stare') {
        setTimer(20);
        setIsRunning(true);
        speakCupidot("Romantic Emergency! Stare into each other's eyes for twenty seconds without smiling!", { mood: 'love' });
        // Start webcam for mirror
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setWebcamActive(true);
              }
            })
            .catch(() => {});
        }
      } else {
        const speaker = Math.random() > 0.5 ? partnerA : partnerB;
        setAssignedSpeaker(speaker);
        const prompt = COMPLIMENT_PROMPTS[Math.floor(Math.random() * COMPLIMENT_PROMPTS.length)];
        setCurrentCompliment(prompt);
        setIsRunning(false);
        speakCupidot(`${speaker} must look their partner in the eye right now!`, { mood: 'love' });
      }
    } else {
      setIsRunning(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setWebcamActive(false);
    }
  }, [isOpen, partnerA, partnerB]);

  // Countdown timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 4 && t > 1) {
            sounds.playCountdownBeep(true);
          }
          if (t === 1) {
            setIsRunning(false);
            if (eventType === 'stare') {
              setCompleted(true);
              sounds.playCelebration();
              speakCupidot("Challenge complete! You survived without cracking!", { mood: 'celebration' });
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, eventType]);

  const handleBlitzPick = (partner: 'A' | 'B', choice: string) => {
    sounds.playPop();
    if (partner === 'A') setPickA(choice);
    else setPickB(choice);

    const nextA = partner === 'A' ? choice : pickA;
    const nextB = partner === 'B' ? choice : pickB;

    if (nextA && nextB) {
      setIsRunning(false);
      setCompleted(true);
      sounds.playCelebration();
      speakCupidot("Both answered! Emergency contained with maximum romance!", { mood: 'celebration' });
    }
  };

  const handleComplimentSpoken = () => {
    sounds.playCelebration();
    setCompleted(true);
    speakCupidot("Approved by Cupidot! Ten out of ten romance points.", { mood: 'love' });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        background: 'rgba(26, 12, 19, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          border: '2px solid #FF4D80',
          boxShadow: '0 24px 80px rgba(255, 77, 128, 0.4), 0 0 40px rgba(255, 77, 128, 0.3)',
          width: '100%',
          maxWidth: '460px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          position: 'relative',
          animation: 'scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Siren Alert Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FF4D80 0%, #FF758C 100%)',
            color: '#FFF',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ animation: 'gl-pulse 1s infinite' }}>🚨</span>
            ROMANTIC EMERGENCY
          </span>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px' }}>
            CUPIDOT PROTOCOL
          </span>
        </div>

        {/* 3D Bot & Emergency Title Stage */}
        <div style={{ padding: '24px 24px 16px', background: 'linear-gradient(180deg, #FFF0F5 0%, #FFFFFF 100%)' }}>
          <div style={{ width: '120px', height: '120px', margin: '0 auto -10px' }}>
            <CupidotBot state={completed ? 'celebration' : 'love'} scale={2.2} />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '8px 0 4px', color: '#1E1B24' }}>
            {eventType === 'blitz' && '30-Second Rapid-Fire Blitz ⚡'}
            {eventType === 'stare' && 'Camera Staring Contest 👁️'}
            {eventType === 'compliment' && 'Spontaneous Praise Roulette 💖'}
          </h3>

          <p style={{ fontSize: '13px', color: '#6A6874', margin: 0 }}>
            {eventType === 'blitz' && 'Both of you must answer before the fuse runs out!'}
            {eventType === 'stare' && 'Hold eye contact into the camera. First one to laugh loses!'}
            {eventType === 'compliment' && 'Cupidot demands one partner deliver high-stakes sincerity.'}
          </p>
        </div>

        {/* Emergency Challenge Body */}
        <div style={{ padding: '16px 24px 28px' }}>
          {/* EVENT 1: BLITZ */}
          {eventType === 'blitz' && (
            <div>
              <div
                style={{
                  background: '#FFF5F8',
                  border: '1.5px dashed #FF7BA3',
                  borderRadius: '16px',
                  padding: '16px',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#2B231E',
                  marginBottom: '18px',
                }}
              >
                {currentBlitz}
              </div>

              {/* Timer Bar */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: timer <= 5 ? '#D93838' : '#FF4D80', marginBottom: '6px' }}>
                  <span>⏳ Fuse Ticking</span>
                  <span>{timer}s</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#F0E5EB', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(timer / 30) * 100}%`,
                      background: timer <= 5 ? '#D93838' : 'linear-gradient(90deg, #FF7BA3, #FF4D80)',
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
              </div>

              {!completed ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Partner A Options */}
                  <div style={{ background: '#FFF0F5', padding: '12px', borderRadius: '12px', border: '1px solid #FFD6E8' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--pink)', marginBottom: '8px' }}>🌸 {partnerA}</div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleBlitzPick('A', partnerA)}
                        style={{ background: pickA === partnerA ? 'var(--pink)' : '#FFF', color: pickA === partnerA ? '#FFF' : '#333' }}
                      >
                        Me 🙋‍♀️
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleBlitzPick('A', partnerB)}
                        style={{ background: pickA === partnerB ? 'var(--pink)' : '#FFF', color: pickA === partnerB ? '#FFF' : '#333' }}
                      >
                        {partnerB} 👉
                      </button>
                    </div>
                  </div>

                  {/* Partner B Options */}
                  <div style={{ background: '#F0F7FF', padding: '12px', borderRadius: '12px', border: '1px solid #D6E8FF' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--blue)', marginBottom: '8px' }}>💙 {partnerB}</div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleBlitzPick('B', partnerA)}
                        style={{ background: pickB === partnerA ? 'var(--blue)' : '#FFF', color: pickB === partnerA ? '#FFF' : '#333' }}
                      >
                        {partnerA} 👈
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleBlitzPick('B', partnerB)}
                        style={{ background: pickB === partnerB ? 'var(--blue)' : '#FFF', color: pickB === partnerB ? '#FFF' : '#333' }}
                      >
                        Me 🙋‍♂️
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#E6F9F0', border: '1px solid #10B981', color: '#0A7D4D', padding: '14px', borderRadius: '14px', fontWeight: 800 }}>
                  🎉 Emergency Cleared! {pickA === pickB ? "You both agreed unanimously!" : `Cheeky clash! ${partnerA} picked ${pickA} while ${partnerB} picked ${pickB}!`}
                </div>
              )}
            </div>
          )}

          {/* EVENT 2: STARE */}
          {eventType === 'stare' && (
            <div>
              <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '16px', overflow: 'hidden', background: '#2B231E', marginBottom: '16px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {!webcamActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '13px' }}>
                    Webcam mirror active · Look into each other&apos;s eyes 👀
                  </div>
                )}
                {/* Big Floating Timer Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(6px)',
                    color: timer <= 5 ? '#FF4D80' : '#FFF',
                    fontSize: '18px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {timer}s
                </div>
              </div>

              {completed ? (
                <div style={{ background: '#E6F9F0', border: '1px solid #10B981', color: '#0A7D4D', padding: '12px', borderRadius: '12px', fontWeight: 800 }}>
                  ✨ You held out without laughing! Mutual devotion certified.
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#555' }}>
                  Keep a straight face! 20 seconds of intense romantic eye contact across the miles.
                </p>
              )}
            </div>
          )}

          {/* EVENT 3: COMPLIMENT */}
          {eventType === 'compliment' && (
            <div>
              <div
                style={{
                  background: '#FFF9EB',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: '6px' }}>
                  🎯 The Directive for {assignedSpeaker}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#451A03', lineHeight: 1.5 }}>
                  <b>{assignedSpeaker}</b> {currentCompliment}
                </div>
              </div>

              {!completed ? (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                  onClick={handleComplimentSpoken}
                >
                  We Said It Out Loud! 💖
                </button>
              ) : (
                <div style={{ background: '#E6F9F0', border: '1px solid #10B981', color: '#0A7D4D', padding: '12px', borderRadius: '12px', fontWeight: 800 }}>
                  🥰 Romance validated by Cupidot! +100 Couple Aura Points.
                </div>
              )}
            </div>
          )}

          {/* Close / Dismiss Button */}
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ fontSize: '13px', color: 'var(--ink-soft)' }}
            >
              {completed ? 'Dismiss Emergency ✓' : 'Flee Romantic Emergency 🏃💨'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

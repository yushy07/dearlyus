'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { Confetti } from '@/components/shared/Confetti';

const MINIGAMES = [
  { id: 'tap', name: '⚡ Fast Tap Duel', desc: 'Tap as fast as you can in 5 seconds — reach maximum CPS to win!' },
  { id: 'reaction', name: '🎯 Reaction Rush', desc: 'Watch the traffic lights: 🔴 Ready... 🟡 Steady... 🟢 GO! Tap in under 300ms.' },
  { id: 'coin', name: '🪙 3D Coin Flip', desc: 'Heads or Tails — dramatic 3D spin through the air.' },
  { id: 'dice', name: '🎲 High Rollers', desc: 'Roll double dice for both players — highest total takes the round.' },
  { id: 'rps', name: '✂️ Rock Paper Scissors', desc: 'Live 3-second countdown shootout on camera!' },
  { id: 'timer', name: '⏱️ Blind 5.00s Clock', desc: 'Clock hides after 2.00s! Rely purely on your internal rhythm to stop at 5.00s.' },
];

const TRUTHS = [
  'What is the most embarrassing photo in your camera roll right now? (Show it to the camera!)',
  'What was your honest first impression of me the very first day we talked?',
  'What is one secret cheesy romantic thought you had about me recently?',
  'If we had 24 hours together with no budget anywhere on earth, what would you plan?',
  'What is a silly habit of mine that you secretly find adorable?',
  'What is one song that always makes you think of me no matter where you are?',
];

const DARES = [
  'Sing a 15-second love song to me in your most dramatic opera voice on FaceTime!',
  'Do your best, most hilarious impression of me when I am hungry or tired.',
  'Send a voice memo saying the sweetest thing you can think of in 10 seconds without pausing.',
  'Let me pick a funny filter and you have to keep it on your camera for the next 3 rounds.',
  'Text me a screenshot of your screen time today without cropping!',
  'Post a cute candid photo of us or of me on your story with a funny caption.',
];

// Helper to render authentic dice pips
function DiceFace({ val }: { val: number }) {
  const pips = [
    [],
    [4], // 1
    [0, 8], // 2
    [0, 4, 8], // 3
    [0, 2, 6, 8], // 4
    [0, 2, 4, 6, 8], // 5
    [0, 2, 3, 5, 6, 8], // 6
  ][val] || [4];

  return (
    <div
      style={{
        width: '56px',
        height: '56px',
        background: '#FFFFFF',
        border: '2px solid #D1D5DB',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: '6px',
        placeItems: 'center',
      }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
        <div
          key={idx}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: pips.includes(idx) ? '#1E293B' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}

export default function DarePage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const runtime = useActivityRuntime({
    sessionId: `mock-dare-${roomCode || 'local'}`,
    activityType: 'dare',
    roomId: roomCode || 'local',
    transportMode: 'mock',
  });
  const [selectedGame, setSelectedGame] = useState(MINIGAMES[0]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'result'>('idle');
  const [tapCount, setTapCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [partnerLoser, setPartnerLoser] = useState<string>(partnerB);
  const [activeCardType, setActiveCardType] = useState<'truth' | 'dare' | null>(null);
  const [cardPrompt, setCardPrompt] = useState<string>('');
  const [confettiActive, setConfettiActive] = useState(false);

  // Minigame states
  const [reactionStage, setReactionStage] = useState<'red' | 'yellow' | 'green' | 'early' | 'clicked'>('red');
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinSide, setCoinSide] = useState<'Heads' | 'Tails' | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResults, setDiceResults] = useState<{ you: number[]; partner: number[] }>({ you: [3, 4], partner: [2, 5] });
  const [rpsCountdown, setRpsCountdown] = useState<number | null>(null);
  const [rpsResults, setRpsResults] = useState<{ you: string; partner: string } | null>(null);
  const [timerStopSec, setTimerStopSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reactionTimeout1Ref = useRef<NodeJS.Timeout | null>(null);
  const reactionTimeout2Ref = useRef<NodeJS.Timeout | null>(null);
  const reactionStartRef = useRef<number>(0);
  const stopwatchRef = useRef<number>(0);

  const clearTimers = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (reactionTimeout1Ref.current) clearTimeout(reactionTimeout1Ref.current);
    if (reactionTimeout2Ref.current) clearTimeout(reactionTimeout2Ref.current);
    timerIntervalRef.current = null;
    reactionTimeout1Ref.current = null;
    reactionTimeout2Ref.current = null;
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleStartRound = () => {
    void runtime.sendEvent('dare_accept', {});
    clearTimers();
    sounds.playPop();
    setGameState('playing');
    setActiveCardType(null);

    if (selectedGame.id === 'tap') {
      setTapCount(0);
      setTimeLeft(5);
      let sec = 5;
      timerIntervalRef.current = setInterval(() => {
        sec -= 1;
        setTimeLeft(sec);
        if (sec <= 0) {
          clearTimers();
          setGameState('result');
          sounds.playCelebration();
          setTapCount((finalTaps) => {
            setPartnerLoser(finalTaps >= 24 ? partnerB : partnerA);
            return finalTaps;
          });
        }
      }, 1000);
    } else if (selectedGame.id === 'reaction') {
      setReactionStage('red');
      setReactionMs(null);

      // Transition to yellow after 1.2s, then to green after 1.5 - 3.2s
      reactionTimeout1Ref.current = setTimeout(() => {
        setReactionStage('yellow');
        sounds.playCountdownBeep(false);

        const greenDelay = 1200 + Math.random() * 2200;
        reactionTimeout2Ref.current = setTimeout(() => {
          setReactionStage('green');
          reactionStartRef.current = Date.now();
          sounds.playCountdownBeep(true);
        }, greenDelay);
      }, 1200);
    } else if (selectedGame.id === 'coin') {
      setCoinFlipping(true);
      setCoinSide(null);
      setTimeout(() => {
        const side = Math.random() > 0.5 ? 'Heads' : 'Tails';
        setCoinSide(side);
        setCoinFlipping(false);
        setGameState('result');
        setPartnerLoser(side === 'Heads' ? partnerB : partnerA);
        sounds.playCelebration();
      }, 1400);
    } else if (selectedGame.id === 'dice') {
      setDiceRolling(true);
      setTimeout(() => {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const p1 = Math.floor(Math.random() * 6) + 1;
        const p2 = Math.floor(Math.random() * 6) + 1;
        setDiceResults({ you: [d1, d2], partner: [p1, p2] });
        setDiceRolling(false);
        setGameState('result');
        const myTotal = d1 + d2;
        const partnerTotal = p1 + p2;
        setPartnerLoser(myTotal >= partnerTotal ? partnerB : partnerA);
        sounds.playCelebration();
      }, 1300);
    } else if (selectedGame.id === 'rps') {
      setRpsCountdown(3);
      let count = 3;
      timerIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setRpsCountdown(count);
          sounds.playCountdownBeep(false);
        } else {
          clearTimers();
          setRpsCountdown(null);
          sounds.playCountdownBeep(true);
        }
      }, 900);
    } else if (selectedGame.id === 'timer') {
      setTimerStopSec(0);
      setTimerRunning(true);
      stopwatchRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - stopwatchRef.current) / 1000;
        setTimerStopSec(parseFloat(elapsed.toFixed(2)));
      }, 30);
    }
  };

  const handleReactionClick = () => {
    if (reactionStage === 'red' || reactionStage === 'yellow') {
      clearTimers();
      setReactionStage('early');
      setPartnerLoser(partnerA);
      setGameState('result');
      void runtime.sendEvent('dare_complete', {});
      sounds.playCountdownBeep(false);
      return;
    }
    if (reactionStage === 'green') {
      const ms = Date.now() - reactionStartRef.current;
      setReactionMs(ms);
      setReactionStage('clicked');
      setGameState('result');
      void runtime.sendEvent('dare_complete', {});
      setPartnerLoser(ms < 320 ? partnerB : partnerA);
      sounds.playCelebration();
    }
  };

  const handleStopTimer = () => {
    clearTimers();
    setTimerRunning(false);
    setGameState('result');
    void runtime.sendEvent('dare_complete', {});
    const diff = Math.abs(5.0 - timerStopSec);
    setPartnerLoser(diff < 0.28 ? partnerB : partnerA);
    sounds.playCelebration();
  };

  const handleRpsPick = (pick: 'Rock' | 'Paper' | 'Scissors') => {
    const opts: Array<'Rock' | 'Paper' | 'Scissors'> = ['Rock', 'Paper', 'Scissors'];
    const pPick = opts[Math.floor(Math.random() * opts.length)];
    setRpsResults({ you: pick, partner: pPick });
    setGameState('result');
    void runtime.sendEvent('dare_complete', {});
    sounds.playCelebration();

    if (pick === pPick) {
      setPartnerLoser(Math.random() > 0.5 ? partnerB : partnerA);
    } else if (
      (pick === 'Rock' && pPick === 'Scissors') ||
      (pick === 'Paper' && pPick === 'Rock') ||
      (pick === 'Scissors' && pPick === 'Paper')
    ) {
      setPartnerLoser(partnerB);
    } else {
      setPartnerLoser(partnerA);
    }
  };

  const pickTruth = () => {
    sounds.playPop();
    setActiveCardType('truth');
    const random = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    setCardPrompt(random);
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  const pickDare = () => {
    sounds.playPop();
    setActiveCardType('dare');
    const random = DARES[Math.floor(Math.random() * DARES.length)];
    setCardPrompt(random);
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  const currentCps = (tapCount / Math.max(0.2, 5 - timeLeft)).toFixed(1);

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
              <span>{partnerA} vs {partnerB}</span>
            </span>

            <Link className="btn btn-ghost" href="/activity" onClick={() => sounds.playPop()}>
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="eyebrow">Truth or Dare · 6 Interactive Arenas</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '8px' }}>
            Lose the minigame, <span className="grad">face your dare</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
            Fast reflex challenges with custom physics and animations. Loser faces a spicy truth or dare!
          </p>
        </div>

        {/* Minigames Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
          {MINIGAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                clearTimers();
                setSelectedGame(game);
                setGameState('idle');
                setActiveCardType(null);
                sounds.playPop();
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: selectedGame.id === game.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: selectedGame.id === game.id ? 'var(--pink-tint)' : '#fff',
                color: selectedGame.id === game.id ? 'var(--pink)' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {game.name}
            </button>
          ))}
        </div>

        {/* Minigame Arena Card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>{selectedGame.name}</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '24px', maxWidth: '540px', margin: '0 auto 24px' }}>
            {selectedGame.desc}
          </p>

          {/* IDLE SCREEN */}
          {gameState === 'idle' && (
            <div style={{ padding: '24px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>
                {selectedGame.id === 'tap' && '⚡'}
                {selectedGame.id === 'reaction' && '🎯'}
                {selectedGame.id === 'coin' && '🪙'}
                {selectedGame.id === 'dice' && '🎲'}
                {selectedGame.id === 'rps' && '✌️'}
                {selectedGame.id === 'timer' && '⏱️'}
              </div>
              <button
                className="btn btn-grad"
                onClick={handleStartRound}
                style={{ padding: '14px 36px', fontSize: '18px', borderRadius: '14px' }}
              >
                Start Duel Round ▷
              </button>
            </div>
          )}

          {/* PLAYING SCREEN */}
          {gameState === 'playing' && (
            <div style={{ padding: '20px 0' }}>
              {/* 1. Fast Tap Arena */}
              {selectedGame.id === 'tap' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 900, color: 'var(--pink)' }}>
                      00:0{timeLeft}s
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', background: 'var(--paper-raised)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      ⚡ {currentCps} CPS
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playPop();
                      setTapCount((p) => p + 1);
                    }}
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--pink), var(--blue))',
                      color: '#fff',
                      border: 'none',
                      fontSize: '32px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 10px 25px rgba(255, 78, 120, 0.4)',
                      transform: `scale(${1 + Math.min(tapCount * 0.012, 0.25)})`,
                      transition: 'transform 0.06s ease',
                      userSelect: 'none',
                    }}
                  >
                    TAP!<br />
                    <span style={{ fontSize: '20px', opacity: 0.9 }}>{tapCount}</span>
                  </button>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>
                    Target: 24 taps (4.8 CPS) to avoid the punishment!
                  </p>
                </div>
              )}

              {/* 2. Reaction Arena with Traffic Lights */}
              {selectedGame.id === 'reaction' && (
                <div
                  onClick={handleReactionClick}
                  style={{
                    maxWidth: '380px',
                    margin: '0 auto',
                    padding: '36px 24px',
                    borderRadius: '20px',
                    background:
                      reactionStage === 'green'
                        ? '#10B981'
                        : reactionStage === 'yellow'
                        ? '#F59E0B'
                        : '#EF4444',
                    color: '#fff',
                    cursor: 'pointer',
                    userSelect: 'none',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'background 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: reactionStage === 'red' ? '#fff' : 'rgba(255,255,255,0.3)', border: '2px solid rgba(0,0,0,0.2)' }} />
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: reactionStage === 'yellow' ? '#fff' : 'rgba(255,255,255,0.3)', border: '2px solid rgba(0,0,0,0.2)' }} />
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: reactionStage === 'green' ? '#fff' : 'rgba(255,255,255,0.3)', border: '2px solid rgba(0,0,0,0.2)' }} />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900 }}>
                    {reactionStage === 'green' && '⚡ TAP NOW! ⚡'}
                    {reactionStage === 'yellow' && 'GET STEADY...'}
                    {reactionStage === 'red' && 'WAIT FOR GREEN...'}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '6px' }}>
                    {reactionStage === 'green' ? 'Click as fast as humanly possible!' : 'Do NOT tap early or you forfeit!'}
                  </div>
                </div>
              )}

              {/* 3. 3D Coin Flip */}
              {selectedGame.id === 'coin' && (
                <div style={{ padding: '28px 0' }}>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FCD34D, #B45309)',
                      border: '4px solid #F59E0B',
                      boxShadow: '0 12px 24px rgba(245, 158, 11, 0.4)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '48px',
                      animation: coinFlipping ? 'bounce 0.4s infinite' : 'none',
                    }}
                  >
                    🪙
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '16px' }}>
                    Spinning through the air...
                  </h3>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>
                    Heads = {partnerA} wins · Tails = {partnerB} wins
                  </p>
                </div>
              )}

              {/* 4. High Rollers Dice */}
              {selectedGame.id === 'dice' && (
                <div style={{ padding: '24px 0' }}>
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ animation: diceRolling ? 'bounce 0.4s infinite' : 'none' }}>
                      <DiceFace val={diceRolling ? Math.floor(Math.random() * 6) + 1 : 6} />
                    </div>
                    <div style={{ animation: diceRolling ? 'bounce 0.4s infinite 0.1s' : 'none' }}>
                      <DiceFace val={diceRolling ? Math.floor(Math.random() * 6) + 1 : 5} />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800 }}>
                    Rolling twin dice for both lovers...
                  </h3>
                </div>
              )}

              {/* 5. Rock Paper Scissors */}
              {selectedGame.id === 'rps' && (
                <div>
                  {rpsCountdown !== null ? (
                    <div style={{ padding: '20px 0' }}>
                      <div style={{ fontSize: '72px', fontWeight: 900, color: 'var(--pink)', animation: 'bounce 0.5s infinite' }}>
                        {rpsCountdown}
                      </div>
                      <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px' }}>
                        Get your hand ready on camera!
                      </h3>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
                        Shoot your choice:
                      </h3>
                      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                        {[
                          { id: 'Rock', icon: '🪨', label: 'Rock' },
                          { id: 'Paper', icon: '📄', label: 'Paper' },
                          { id: 'Scissors', icon: '✂️', label: 'Scissors' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleRpsPick(m.id as any)}
                            className="btn btn-ghost"
                            style={{
                              padding: '16px 22px',
                              borderRadius: '16px',
                              fontSize: '18px',
                              flexDirection: 'column',
                              gap: '6px',
                              border: '1.5px solid var(--line)',
                            }}
                          >
                            <span style={{ fontSize: '36px' }}>{m.icon}</span>
                            <span style={{ fontWeight: 800 }}>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Blind 5.00s Stopwatch */}
              {selectedGame.id === 'timer' && (
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '52px',
                      fontWeight: 900,
                      color: timerStopSec >= 2.0 ? '#EF4444' : 'var(--blue)',
                      marginBottom: '10px',
                    }}
                  >
                    {timerStopSec >= 2.0 && timerRunning ? '??:??s' : `${timerStopSec.toFixed(2)}s`}
                  </div>
                  {timerStopSec >= 2.0 && timerRunning && (
                    <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>
                      🙈 BLIND MODE ACTIVATED! Count 3, 4, 5 in your head!
                    </div>
                  )}
                  <button
                    className="btn btn-grad"
                    onClick={handleStopTimer}
                    style={{ padding: '16px 40px', fontSize: '18px', borderRadius: '14px' }}
                  >
                    ⏹️ STOP AT EXACTLY 5.00s!
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RESULT SCREEN */}
          {gameState === 'result' && !activeCardType && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>💥</div>
              <h3 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
                <span style={{ color: 'var(--pink)' }}>{partnerLoser}</span> Lost the Round!
              </h3>

              {/* Game specific breakdown */}
              {selectedGame.id === 'tap' && (
                <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '18px' }}>
                  Scored {tapCount} taps ({currentCps} CPS). Needed 24 to win!
                </p>
              )}
              {selectedGame.id === 'reaction' && reactionStage === 'early' && (
                <p style={{ color: '#EF4444', fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>
                  False start penalty! Tapped before green light flashed!
                </p>
              )}
              {selectedGame.id === 'reaction' && reactionMs && (
                <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '18px' }}>
                  Reaction time: <b>{reactionMs}ms</b> ({reactionMs < 280 ? '⚡ Lightning fast!' : reactionMs < 360 ? '👍 Decent speed' : '😴 Sluggish!'}).
                </p>
              )}
              {selectedGame.id === 'coin' && coinSide && (
                <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '18px' }}>
                  Landed on: <b>{coinSide}</b>!
                </p>
              )}
              {selectedGame.id === 'dice' && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                    <span>{partnerA}:</span>
                    <DiceFace val={diceResults.you[0]} />
                    <DiceFace val={diceResults.you[1]} />
                    <b>= {diceResults.you[0] + diceResults.you[1]}</b>
                    <span style={{ margin: '0 8px' }}>vs</span>
                    <span>{partnerB}:</span>
                    <DiceFace val={diceResults.partner[0]} />
                    <DiceFace val={diceResults.partner[1]} />
                    <b>= {diceResults.partner[0] + diceResults.partner[1]}</b>
                  </div>
                </div>
              )}
              {selectedGame.id === 'rps' && rpsResults && (
                <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '18px' }}>
                  {partnerA}: <b>{rpsResults.you}</b> vs {partnerB}: <b>{rpsResults.partner}</b>
                </p>
              )}
              {selectedGame.id === 'timer' && (
                <p style={{ color: 'var(--ink-soft)', fontSize: '15px', marginBottom: '18px' }}>
                  Stopped at: <b>{timerStopSec.toFixed(2)}s</b> (off by {Math.abs(5.0 - timerStopSec).toFixed(2)}s!).
                </p>
              )}

              <p style={{ color: 'var(--ink)', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                {partnerLoser}, pick your punishment:
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                <button
                  className="btn"
                  onClick={pickTruth}
                  style={{
                    padding: '14px 28px',
                    fontSize: '16px',
                    borderRadius: '12px',
                    background: 'var(--blue-tint)',
                    color: 'var(--blue)',
                    border: '1.5px solid var(--blue)',
                    fontWeight: 800,
                  }}
                >
                  💬 Pick a Truth
                </button>
                <button
                  className="btn btn-grad"
                  onClick={pickDare}
                  style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '12px' }}
                >
                  🔥 Pick a Dare
                </button>
              </div>
            </div>
          )}

          {/* CARD PROMPT DISPLAY */}
          {activeCardType && cardPrompt && (
            <div
              style={{
                marginTop: '20px',
                padding: '28px 24px',
                borderRadius: '16px',
                background: activeCardType === 'truth' ? 'var(--blue-tint)' : 'var(--pink-tint)',
                border: `2px solid ${activeCardType === 'truth' ? 'var(--blue)' : 'var(--pink)'}`,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: activeCardType === 'truth' ? 'var(--blue)' : 'var(--pink)',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                {activeCardType === 'truth' ? '💬 Truth for ' : '🔥 Dare for '} {partnerLoser}
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.4, marginBottom: '20px' }}>
                &ldquo;{cardPrompt}&rdquo;
              </h3>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="btn btn-grad"
                  onClick={() => {
                    sounds.playPop();
                    setGameState('idle');
                    setActiveCardType(null);
                  }}
                  style={{ padding: '10px 24px', fontSize: '15px' }}
                >
                  Dare Completed! Next Game ▷
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

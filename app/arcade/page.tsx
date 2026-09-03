'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { Confetti } from '@/components/shared/Confetti';

type GameMode = 'jump' | 'dodge' | 'catch';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export default function ArcadePage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [activePlayer, setActivePlayer] = useState<'a' | 'b'>('a');
  const [activeGame, setActiveGame] = useState<GameMode>('jump');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScores, setHighScores] = useState<{ a: number; b: number }>({ a: 220, b: 260 });
  const [confettiActive, setConfettiActive] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Game internal state refs for 60fps loop
  const playerRef = useRef({ x: 80, y: 240, vy: 0, width: 32, height: 32, isGrounded: true });
  const obstaclesRef = useRef<Array<{ x: number; y: number; width: number; height: number; speed: number; type: string }>>([]);
  const collectiblesRef = useRef<Array<{ x: number; y: number; size: number; speed: number; emoji: string; isHazard?: boolean }>>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({ left: false, right: false, jump: false });
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  // Load high scores
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dearly_arcade_high_scores');
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 3 + Math.random() * 4,
      });
    }
  };

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    sounds.playCelebration();
    const final = scoreRef.current;
    setScore(final);

    setHighScores((prev) => {
      if (final > prev[activePlayer]) {
        setIsNewRecord(true);
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 3500);
        const updated = { ...prev, [activePlayer]: final };
        try {
          localStorage.setItem('dearly_arcade_high_scores', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }, [activePlayer]);

  // Main 60 FPS Game Loop
  const runGameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current += 1;
    const frame = frameCountRef.current;

    // --- 1. CLEAR & BACKGROUND ---
    ctx.fillStyle = '#0F1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Starfield grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 20; i++) {
      const sx = (i * 37 + (activeGame === 'jump' ? -frame * 0.8 : 0)) % canvas.width;
      const adjustedX = sx < 0 ? sx + canvas.width : sx;
      const sy = (i * 47) % canvas.height;
      ctx.fillRect(adjustedX, sy, 2, 2);
    }

    // --- 2. GAME SPECIFIC LOGIC ---
    if (activeGame === 'jump') {
      // Runner ground
      const groundY = 270;
      ctx.strokeStyle = '#2E3240';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Moving ground dashes
      ctx.strokeStyle = '#FF4E78';
      ctx.lineWidth = 3;
      const offset = (frame * 5) % 40;
      for (let x = -offset; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 20, groundY);
        ctx.stroke();
      }

      // Player Physics
      const p = playerRef.current;
      if (keysRef.current.jump && p.isGrounded) {
        p.vy = -12.5;
        p.isGrounded = false;
        sounds.playPop();
        spawnParticles(p.x + 16, p.y + 24, '#FF7BA3', 6);
      }
      p.vy += 0.65; // gravity
      p.y += p.vy;

      if (p.y >= groundY - p.height) {
        p.y = groundY - p.height;
        p.vy = 0;
        p.isGrounded = true;
      }

      // Draw Player Heart
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💖', p.x + 16, p.y + 26);

      // Spawn Obstacles (Cactus/Spikes)
      if (frame % 85 === 0) {
        obstaclesRef.current.push({
          x: canvas.width + 20,
          y: groundY - 30,
          width: 26,
          height: 30,
          speed: 4.8 + Math.min(frame / 600, 3.5),
          type: 'obstacle',
        });
      }

      // Spawn floating Bonus Stars
      if (frame % 110 === 0) {
        collectiblesRef.current.push({
          x: canvas.width + 20,
          y: groundY - 60 - Math.random() * 50,
          size: 20,
          speed: 4.8,
          emoji: '⭐',
        });
      }

      // Update & Draw Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= obs.speed;

        ctx.font = '24px sans-serif';
        ctx.fillText('⚡', obs.x + 12, obs.y + 24);

        // Collision detection
        if (
          p.x < obs.x + obs.width - 6 &&
          p.x + p.width > obs.x + 6 &&
          p.y < obs.y + obs.height &&
          p.y + p.height > obs.y
        ) {
          obstaclesRef.current.splice(i, 1);
          livesRef.current -= 1;
          setLives(livesRef.current);
          sounds.playCountdownBeep(true);
          spawnParticles(p.x + 16, p.y + 16, '#EF4444', 16);

          if (livesRef.current <= 0) {
            handleGameOver();
            return;
          }
          continue;
        }

        if (obs.x < -40) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current += 15;
          setScore(scoreRef.current);
        }
      }

      // Update & Draw Collectibles
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const col = collectiblesRef.current[i];
        col.x -= col.speed;

        ctx.font = '22px sans-serif';
        ctx.fillText(col.emoji, col.x + 10, col.y + 18);

        // Catch Star
        if (
          p.x < col.x + col.size &&
          p.x + p.width > col.x &&
          p.y < col.y + col.size &&
          p.y + p.height > col.y
        ) {
          collectiblesRef.current.splice(i, 1);
          scoreRef.current += 50;
          setScore(scoreRef.current);
          sounds.playPop();
          spawnParticles(col.x, col.y, '#FDE047', 12);
          continue;
        }

        if (col.x < -30) {
          collectiblesRef.current.splice(i, 1);
        }
      }
    } else if (activeGame === 'dodge') {
      // Cosmic Dodge (Move Left/Right to avoid Falling Asteroids)
      const p = playerRef.current;
      const speed = 6;
      if (keysRef.current.left && p.x > 20) p.x -= speed;
      if (keysRef.current.right && p.x < canvas.width - 50) p.x += speed;
      p.y = 280;

      // Draw Spaceship Player
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚀', p.x + 16, p.y + 24);

      // Spawn falling Asteroids
      if (frame % 38 === 0) {
        obstaclesRef.current.push({
          x: 30 + Math.random() * (canvas.width - 60),
          y: -30,
          width: 28,
          height: 28,
          speed: 3.5 + Math.random() * 2.8,
          type: 'asteroid',
        });
      }

      // Spawn falling Glow Hearts
      if (frame % 70 === 0) {
        collectiblesRef.current.push({
          x: 30 + Math.random() * (canvas.width - 60),
          y: -30,
          size: 24,
          speed: 3.2,
          emoji: '💖',
        });
      }

      // Update Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.y += obs.speed;

        ctx.font = '24px sans-serif';
        ctx.fillText('🪨', obs.x, obs.y + 20);

        if (
          p.x < obs.x + obs.width - 6 &&
          p.x + p.width > obs.x - 6 &&
          p.y < obs.y + obs.height &&
          p.y + p.height > obs.y
        ) {
          obstaclesRef.current.splice(i, 1);
          livesRef.current -= 1;
          setLives(livesRef.current);
          sounds.playCountdownBeep(true);
          spawnParticles(p.x + 16, p.y + 16, '#EF4444', 16);

          if (livesRef.current <= 0) {
            handleGameOver();
            return;
          }
          continue;
        }

        if (obs.y > canvas.height + 20) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current += 20;
          setScore(scoreRef.current);
        }
      }

      // Update Collectibles
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const col = collectiblesRef.current[i];
        col.y += col.speed;

        ctx.font = '22px sans-serif';
        ctx.fillText(col.emoji, col.x, col.y + 20);

        if (
          p.x < col.x + col.size &&
          p.x + p.width > col.x - col.size &&
          p.y < col.y + col.size &&
          p.y + p.height > col.y
        ) {
          collectiblesRef.current.splice(i, 1);
          scoreRef.current += 40;
          setScore(scoreRef.current);
          sounds.playPop();
          spawnParticles(col.x, col.y, '#FF7BA3', 10);
          continue;
        }

        if (col.y > canvas.height + 20) {
          collectiblesRef.current.splice(i, 1);
        }
      }
    } else if (activeGame === 'catch') {
      // Berry Catch (Basket at Bottom catches Fruits)
      const p = playerRef.current;
      const speed = 7;
      if (keysRef.current.left && p.x > 20) p.x -= speed;
      if (keysRef.current.right && p.x < canvas.width - 60) p.x += speed;
      p.y = 285;

      // Draw Basket
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧺', p.x + 20, p.y + 24);

      // Spawn falling Treats and Hazards
      if (frame % 34 === 0) {
        const isBomb = Math.random() < 0.22;
        collectiblesRef.current.push({
          x: 30 + Math.random() * (canvas.width - 60),
          y: -25,
          size: 26,
          speed: 3.2 + Math.random() * 2.2,
          emoji: isBomb ? '💣' : ['🍓', '🍰', '🧁', '🍒'][Math.floor(Math.random() * 4)],
          isHazard: isBomb,
        });
      }

      // Update Collectibles & Hazards
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const col = collectiblesRef.current[i];
        col.y += col.speed;

        ctx.font = '24px sans-serif';
        ctx.fillText(col.emoji, col.x, col.y + 20);

        // Catch in basket
        if (
          p.x < col.x + col.size &&
          p.x + 40 > col.x - col.size &&
          p.y < col.y + col.size &&
          p.y + 35 > col.y
        ) {
          collectiblesRef.current.splice(i, 1);

          if (col.isHazard) {
            livesRef.current -= 1;
            setLives(livesRef.current);
            sounds.playCountdownBeep(true);
            spawnParticles(col.x, col.y, '#EF4444', 16);
            if (livesRef.current <= 0) {
              handleGameOver();
              return;
            }
          } else {
            scoreRef.current += 35;
            setScore(scoreRef.current);
            sounds.playPop();
            spawnParticles(col.x, col.y, '#10B981', 12);
          }
          continue;
        }

        if (col.y > canvas.height + 20) {
          collectiblesRef.current.splice(i, 1);
        }
      }
    }

    // --- 3. PARTICLES ---
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.035;
      if (pt.alpha <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // --- 4. HUD / SCANLINE EFFECT ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1.5);
    }

    animFrameRef.current = requestAnimationFrame(runGameLoop);
  }, [activeGame, handleGameOver]);

  const startGame = () => {
    sounds.playPop();
    setScore(0);
    setLives(3);
    scoreRef.current = 0;
    livesRef.current = 3;
    frameCountRef.current = 0;
    setIsNewRecord(false);

    playerRef.current = {
      x: activeGame === 'jump' ? 70 : 280,
      y: activeGame === 'jump' ? 240 : 280,
      vy: 0,
      width: 32,
      height: 32,
      isGrounded: true,
    };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    keysRef.current = { left: false, right: false, jump: false };

    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(runGameLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, runGameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        keysRef.current.jump = true;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysRef.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        keysRef.current.jump = false;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const currentPlayerName = activePlayer === 'a' ? partnerA : partnerB;

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
              <span>{partnerA}:</span> <b style={{ color: 'var(--pink)' }}>{highScores.a} PTS</b> · <span>{partnerB}:</span> <b style={{ color: 'var(--blue)' }}>{highScores.b} PTS</b>
            </span>

            <Link className="btn btn-ghost" href="/activity" onClick={() => sounds.playPop()}>
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '32px', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="eyebrow">Retro Arcade · 60 FPS 2D Minigames</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '6px 0' }}>
            Two Players, <span className="grad">Classic Arcade</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
            Genuine playable retro games with keyboard &amp; touch controls. Beat each other&apos;s records!
          </p>
        </div>

        {/* Player Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => {
              if (gameState === 'playing') return;
              sounds.playPop();
              setActivePlayer('a');
            }}
            style={{
              padding: '6px 18px',
              borderRadius: '20px',
              border: activePlayer === 'a' ? '2px solid var(--pink)' : '1px solid var(--line)',
              background: activePlayer === 'a' ? 'var(--pink-tint)' : '#FFFFFF',
              color: activePlayer === 'a' ? 'var(--pink)' : 'var(--ink)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🕹️ Player 1: {partnerA}
          </button>
          <button
            onClick={() => {
              if (gameState === 'playing') return;
              sounds.playPop();
              setActivePlayer('b');
            }}
            style={{
              padding: '6px 18px',
              borderRadius: '20px',
              border: activePlayer === 'b' ? '2px solid var(--blue)' : '1px solid var(--line)',
              background: activePlayer === 'b' ? 'var(--blue-tint)' : '#FFFFFF',
              color: activePlayer === 'b' ? 'var(--blue)' : 'var(--ink)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🕹️ Player 2: {partnerB}
          </button>
        </div>

        {/* Main Arcade Cabinet */}
        <div
          style={{
            background: '#15171E',
            border: '2px solid #282A36',
            borderRadius: '20px',
            padding: '24px 20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
            color: '#fff',
          }}
        >
          {/* Game Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '18px' }}>
            {[
              { id: 'jump', name: '🦘 Heart Jump', desc: 'Jump over spikes & grab gold stars!' },
              { id: 'dodge', name: '🚀 Cosmic Dodge', desc: 'Dodge falling asteroids & collect hearts!' },
              { id: 'catch', name: '🍓 Berry Catch', desc: 'Catch fresh berries, dodge bombs!' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  if (gameState === 'playing') return;
                  sounds.playPop();
                  setActiveGame(g.id as GameMode);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: activeGame === g.id ? '2px solid var(--pink)' : '1px solid #333544',
                  background: activeGame === g.id ? 'rgba(255,78,120,0.2)' : '#1C1F2B',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Arcade Status Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px 12px', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#8B8E98' }}>PLAYER: </span>
              <span style={{ color: activePlayer === 'a' ? 'var(--pink)' : 'var(--blue)', fontWeight: 900 }}>{currentPlayerName.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <span style={{ color: '#8B8E98' }}>SCORE: </span>
                <span style={{ color: '#FDE047', fontWeight: 900 }}>{score}</span>
              </div>
              <div>
                <span style={{ color: '#8B8E98' }}>LIVES: </span>
                <span style={{ color: '#EF4444', letterSpacing: '2px' }}>{'♥'.repeat(Math.max(0, lives))}</span>
              </div>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            style={{
              position: 'relative',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '2px solid #232736',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
              background: '#0F1117',
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={340}
              onClick={() => {
                if (activeGame === 'jump') {
                  keysRef.current.jump = true;
                  setTimeout(() => {
                    keysRef.current.jump = false;
                  }, 180);
                }
              }}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                cursor: activeGame === 'jump' ? 'pointer' : 'default',
              }}
            />

            {/* Overlay: Idle State */}
            {gameState === 'idle' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 17, 23, 0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '48px' }}>
                  {activeGame === 'jump' ? '🦘' : activeGame === 'dodge' ? '🚀' : '🍓'}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 800 }}>
                  {activeGame === 'jump' ? 'Heart Runner' : activeGame === 'dodge' ? 'Cosmic Dodge' : 'Sweet Berry Catch'}
                </h3>
                <p style={{ color: '#A1A4B5', fontSize: '14px', maxWidth: '380px' }}>
                  {activeGame === 'jump' && 'Tap screen or press Space / Up Arrow to leap over electric sparks!'}
                  {activeGame === 'dodge' && 'Use Left & Right arrows (or buttons below) to weave through falling meteors!'}
                  {activeGame === 'catch' && 'Slide your picnic basket under falling berries and avoid bombs!'}
                </p>
                <button
                  className="btn btn-grad"
                  onClick={startGame}
                  style={{ padding: '12px 32px', fontSize: '16px', borderRadius: '12px' }}
                >
                  Insert Coin &amp; Play ({currentPlayerName}) ▶
                </button>
              </div>
            )}

            {/* Overlay: Game Over */}
            {gameState === 'gameover' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 17, 23, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '40px' }}>💥</div>
                <h3 style={{ fontSize: '26px', fontWeight: 900 }}>ROUND OVER</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', color: '#FDE047', fontWeight: 900 }}>
                  {score} PTS {isNewRecord && '👑 NEW BEST!'}
                </div>
                <p style={{ color: '#A1A4B5', fontSize: '14px' }}>
                  {score > highScores[activePlayer === 'a' ? 'b' : 'a']
                    ? `🔥 ${currentPlayerName} is currently beating their partner!`
                    : `Partner record: ${highScores[activePlayer === 'a' ? 'b' : 'a']} PTS. Can you beat it?`}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button className="btn btn-grad" onClick={startGame} style={{ padding: '10px 24px', fontSize: '14px' }}>
                    Play Again ↺
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      sounds.playPop();
                      setActivePlayer((p) => (p === 'a' ? 'b' : 'a'));
                      setGameState('idle');
                    }}
                    style={{ padding: '10px 20px', fontSize: '14px', background: '#232635', color: '#fff' }}
                  >
                    Switch to {activePlayer === 'a' ? partnerB : partnerA} ▷
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* On-screen Touch Controls (Essential for mobile & quick gameplay) */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '14px' }}>
            {activeGame === 'jump' ? (
              <button
                onMouseDown={() => {
                  keysRef.current.jump = true;
                }}
                onMouseUp={() => {
                  keysRef.current.jump = false;
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.jump = true;
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.jump = false;
                }}
                className="btn btn-grad"
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  padding: '16px 20px',
                  fontSize: '18px',
                  borderRadius: '14px',
                  userSelect: 'none',
                  boxShadow: '0 6px 18px rgba(255, 78, 120, 0.35)',
                }}
              >
                🦘 TAP TO JUMP! (Space / ↑)
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
                <button
                  onMouseDown={() => {
                    keysRef.current.left = true;
                  }}
                  onMouseUp={() => {
                    keysRef.current.left = false;
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    keysRef.current.left = true;
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    keysRef.current.left = false;
                  }}
                  className="btn btn-ghost"
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontSize: '18px',
                    borderRadius: '12px',
                    background: '#232636',
                    color: '#fff',
                    border: '1px solid #3B3F54',
                    userSelect: 'none',
                  }}
                >
                  ◀ LEFT
                </button>
                <button
                  onMouseDown={() => {
                    keysRef.current.right = true;
                  }}
                  onMouseUp={() => {
                    keysRef.current.right = false;
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    keysRef.current.right = true;
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    keysRef.current.right = false;
                  }}
                  className="btn btn-ghost"
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontSize: '18px',
                    borderRadius: '12px',
                    background: '#232636',
                    color: '#fff',
                    border: '1px solid #3B3F54',
                    userSelect: 'none',
                  }}
                >
                  RIGHT ▶
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

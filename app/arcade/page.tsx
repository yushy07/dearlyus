'use client';

import { BrandLogo } from '@/components/shared/BrandLogo';
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
  decay?: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export default function ArcadePage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [activePlayer, setActivePlayer] = useState<'a' | 'b'>('a');
  const [activeGame, setActiveGame] = useState<GameMode>('jump');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<
    'idle' | 'playing' | 'paused' | 'gameover'
  >('idle');
  const [highScores, setHighScores] = useState<{ a: number; b: number }>({
    a: 340,
    b: 390,
  });
  const [confettiActive, setConfettiActive] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [crtEffect, setCrtEffect] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Game internal state refs for 60fps loop
  const playerRef = useRef({
    x: 80,
    y: 230,
    vx: 0,
    vy: 0,
    width: 36,
    height: 36,
    isGrounded: true,
    trail: [] as Array<{ x: number; y: number; alpha: number }>,
  });

  const obstaclesRef = useRef<
    Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      rot: number;
      type: string;
    }>
  >([]);
  const collectiblesRef = useRef<
    Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      rot: number;
      isHazard?: boolean;
      type: string;
      points: number;
    }>
  >([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const livesRef = useRef(3);
  const shakeRef = useRef(0);
  const flashRef = useRef(0);

  // Load high scores
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dearly_arcade_high_scores');
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 2.5 + Math.random() * 4,
        decay: 0.025 + Math.random() * 0.03,
      });
    }
  };

  const addFloatingText = (
    x: number,
    y: number,
    text: string,
    color: string,
  ) => {
    floatersRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.8,
    });
  };

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    if (soundEnabled) sounds.playCelebration();
    const final = scoreRef.current;
    setScore(final);

    setHighScores((prev) => {
      if (final > prev[activePlayer]) {
        setIsNewRecord(true);
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 3500);
        const updated = { ...prev, [activePlayer]: final };
        try {
          localStorage.setItem(
            'dearly_arcade_high_scores',
            JSON.stringify(updated),
          );
        } catch {}
        return updated;
      }
      return prev;
    });
  }, [activePlayer, soundEnabled]);

  // Vector Drawing Helpers for rich game visuals
  const drawHeart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    glow = true,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    // top left curve
    ctx.bezierCurveTo(
      -size / 2,
      -topCurveHeight,
      -size,
      topCurveHeight,
      0,
      size,
    );
    // top right curve
    ctx.bezierCurveTo(
      size,
      topCurveHeight,
      size / 2,
      -topCurveHeight,
      0,
      topCurveHeight,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number,
    color: string,
    rot: number,
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    let rotAngle = (Math.PI / 2) * 3;
    let x = 0;
    let y = 0;
    const step = Math.PI / spikes;

    ctx.moveTo(0, -outerR);
    for (let i = 0; i < spikes; i++) {
      x = Math.cos(rotAngle) * outerR;
      y = Math.sin(rotAngle) * outerR;
      ctx.lineTo(x, y);
      rotAngle += step;

      x = Math.cos(rotAngle) * innerR;
      y = Math.sin(rotAngle) * innerR;
      ctx.lineTo(x, y);
      rotAngle += step;
    }
    ctx.lineTo(0, -outerR);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawSpaceship = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number,
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Jet Engine Flame
    const flameH = 14 + Math.sin(frame * 0.5) * 6;
    ctx.fillStyle = '#FF7BA3';
    ctx.shadowColor = '#FF4E78';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-7, 16);
    ctx.lineTo(0, 16 + flameH);
    ctx.lineTo(7, 16);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = '#3B82F6';
    ctx.shadowColor = '#60A5FA';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(20, 14);
    ctx.lineTo(12, 16);
    ctx.lineTo(0, 10);
    ctx.lineTo(-12, 16);
    ctx.lineTo(-20, 14);
    ctx.closePath();
    ctx.fill();

    // Fuselage
    const grad = ctx.createLinearGradient(0, -22, 0, 12);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.6, '#E2E8F0');
    grad.addColorStop(1, '#94A3B8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(9, 10);
    ctx.lineTo(-9, 10);
    ctx.closePath();
    ctx.fill();

    // Cockpit Glowing Heart Window
    ctx.fillStyle = '#FF4E78';
    ctx.shadowColor = '#FF4E78';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawBasket = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = '#FF7BA3';
    ctx.shadowBlur = 8;

    // Basket body
    const grad = ctx.createLinearGradient(0, -10, 0, 20);
    grad.addColorStop(0, '#D97706');
    grad.addColorStop(1, '#78350F');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-24, -8, 48, 26, 6);
    ctx.fill();

    // Weave lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-18, -4);
    ctx.lineTo(18, 14);
    ctx.moveTo(18, -4);
    ctx.lineTo(-18, 14);
    ctx.stroke();

    // Handle
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -8, 16, Math.PI, 0);
    ctx.stroke();

    ctx.restore();
  };

  // Main 60 FPS Engine Loop
  const runGameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current += 1;
    const frame = frameCountRef.current;

    // Screen shake transform
    ctx.save();
    if (shakeRef.current > 0) {
      const sx = (Math.random() - 0.5) * shakeRef.current;
      const sy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(sx, sy);
      shakeRef.current -= 0.8;
      if (shakeRef.current < 0) shakeRef.current = 0;
    }

    // --- 1. CLEAR & BACKGROUND ATMOSPHERE ---
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0B0D14');
    bgGrad.addColorStop(0.6, '#111422');
    bgGrad.addColorStop(1, '#1A182E');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Multi-layer Starfield / Nebula
    for (let i = 0; i < 35; i++) {
      const speedMult = (i % 3) + 1;
      const sx =
        (i * 29 + (activeGame === 'jump' ? -frame * (0.5 * speedMult) : 0)) %
        canvas.width;
      const adjustedX = sx < 0 ? sx + canvas.width : sx;
      const sy =
        (i * 37 + (activeGame !== 'jump' ? frame * (0.4 * speedMult) : 0)) %
        canvas.height;
      const size = i % 4 === 0 ? 2.5 : 1.5;
      ctx.fillStyle =
        i % 2 === 0 ? 'rgba(255, 123, 163, 0.4)' : 'rgba(96, 165, 250, 0.45)';
      ctx.fillRect(adjustedX, sy, size, size);
    }

    // --- 2. GAME LOGIC ---
    if (activeGame === 'jump') {
      // HEART RUNNER (Side Scroller)
      const groundY = 275;

      // Glowing Synthwave Ground
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
      groundGrad.addColorStop(0, '#221C35');
      groundGrad.addColorStop(1, '#0F0D1A');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Neon horizon beam
      ctx.strokeStyle = '#FF4E78';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF4E78';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Cyber Grid Lines moving towards player
      ctx.strokeStyle = 'rgba(255, 78, 120, 0.25)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      const gridOffset = (frame * 5.2) % 36;
      for (let x = -gridOffset; x < canvas.width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 20, canvas.height);
        ctx.stroke();
      }

      // Player Physics
      const p = playerRef.current;
      if (keysRef.current.jump && p.isGrounded) {
        p.vy = -13.2;
        p.isGrounded = false;
        if (soundEnabled) sounds.playPop();
        spawnParticles(p.x, p.y + 14, '#FF7BA3', 8);
      }
      p.vy += 0.68; // gravity
      p.y += p.vy;

      if (p.y >= groundY - 26) {
        p.y = groundY - 26;
        p.vy = 0;
        p.isGrounded = true;
      }

      // Trail record
      if (frame % 3 === 0) {
        p.trail.unshift({ x: p.x, y: p.y, alpha: 0.6 });
        if (p.trail.length > 5) p.trail.pop();
      }

      // Draw Trail
      for (let t of p.trail) {
        t.alpha -= 0.04;
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.alpha);
        drawHeart(ctx, t.x, t.y, 16, '#FF7BA3', false);
        ctx.restore();
      }

      // Draw Beating Player Heart
      const beat = 18 + Math.sin(frame * 0.15) * 1.5;
      drawHeart(ctx, p.x, p.y, beat, '#FF4E78', true);

      // Spawn Obstacles (Neon Cyber Spikes)
      if (frame % 80 === 0) {
        obstaclesRef.current.push({
          x: canvas.width + 20,
          y: groundY - 26,
          width: 24,
          height: 26,
          speed: 5.2 + Math.min(frame / 600, 3.2),
          rot: 0,
          type: 'spike',
        });
      }

      // Spawn Collectibles (Rotating Golden Stars)
      if (frame % 95 === 0) {
        collectiblesRef.current.push({
          x: canvas.width + 20,
          y: groundY - 60 - Math.random() * 55,
          size: 14,
          speed: 5.2,
          rot: 0,
          type: 'star',
          points: 50,
        });
      }

      // Update & Draw Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= obs.speed;

        // Draw Spikes
        ctx.save();
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(obs.x, groundY);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Collision Check
        const dist = Math.hypot(
          p.x - (obs.x + obs.width / 2),
          p.y - (obs.y + obs.height / 2),
        );
        if (dist < 26) {
          obstaclesRef.current.splice(i, 1);
          livesRef.current -= 1;
          setLives(livesRef.current);
          comboRef.current = 0;
          setCombo(0);
          shakeRef.current = 10;
          flashRef.current = 0.4;
          if (soundEnabled) sounds.playCountdownBeep(true);
          spawnParticles(p.x, p.y, '#EF4444', 18);

          if (livesRef.current <= 0) {
            handleGameOver();
            ctx.restore();
            return;
          }
          continue;
        }

        if (obs.x < -30) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current += 15;
          setScore(scoreRef.current);
        }
      }

      // Update & Draw Collectibles
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const col = collectiblesRef.current[i];
        col.x -= col.speed;
        col.rot += 0.05;

        drawStar(
          ctx,
          col.x,
          col.y,
          5,
          col.size,
          col.size * 0.5,
          '#FDE047',
          col.rot,
        );

        // Catch Star
        const dist = Math.hypot(p.x - col.x, p.y - col.y);
        if (dist < 26) {
          collectiblesRef.current.splice(i, 1);
          comboRef.current += 1;
          setCombo(comboRef.current);
          const mult = comboRef.current >= 5 ? 2 : 1;
          const pts = col.points * mult;
          scoreRef.current += pts;
          setScore(scoreRef.current);
          if (soundEnabled) sounds.playPop();
          spawnParticles(col.x, col.y, '#FDE047', 14);
          addFloatingText(
            col.x,
            col.y,
            `+${pts}${mult > 1 ? ' 2X!' : ''}`,
            '#FDE047',
          );
          continue;
        }

        if (col.x < -30) {
          collectiblesRef.current.splice(i, 1);
        }
      }
    } else if (activeGame === 'dodge') {
      // COSMIC DODGE (Spaceship Dodging Meteors)
      const p = playerRef.current;
      const moveSpeed = 6.8;
      if (keysRef.current.left && p.x > 30) p.x -= moveSpeed;
      if (keysRef.current.right && p.x < canvas.width - 30) p.x += moveSpeed;
      p.y = 285;

      drawSpaceship(ctx, p.x, p.y, frame);

      // Spawn Meteors
      if (frame % 34 === 0) {
        obstaclesRef.current.push({
          x: 25 + Math.random() * (canvas.width - 50),
          y: -30,
          width: 26,
          height: 26,
          speed: 4.2 + Math.random() * 2.8,
          rot: Math.random() * Math.PI,
          type: 'meteor',
        });
      }

      // Spawn Floating Energy Hearts
      if (frame % 65 === 0) {
        collectiblesRef.current.push({
          x: 30 + Math.random() * (canvas.width - 60),
          y: -25,
          size: 16,
          speed: 3.4,
          rot: 0,
          type: 'heart',
          points: 40,
        });
      }

      // Update Meteors
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.y += obs.speed;
        obs.rot += 0.04;

        // Draw Fiery Meteor
        ctx.save();
        ctx.translate(obs.x, obs.y);
        ctx.rotate(obs.rot);
        ctx.fillStyle = '#FB923C';
        ctx.shadowColor = '#EA580C';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Meteor Core
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(0, 0, obs.width / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Collision Check
        const dist = Math.hypot(p.x - obs.x, p.y - obs.y);
        if (dist < 26) {
          obstaclesRef.current.splice(i, 1);
          livesRef.current -= 1;
          setLives(livesRef.current);
          comboRef.current = 0;
          setCombo(0);
          shakeRef.current = 10;
          flashRef.current = 0.4;
          if (soundEnabled) sounds.playCountdownBeep(true);
          spawnParticles(p.x, p.y, '#F97316', 16);

          if (livesRef.current <= 0) {
            handleGameOver();
            ctx.restore();
            return;
          }
          continue;
        }

        if (obs.y > canvas.height + 25) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current += 20;
          setScore(scoreRef.current);
        }
      }

      // Update Collectibles
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const col = collectiblesRef.current[i];
        col.y += col.speed;

        drawHeart(ctx, col.x, col.y, col.size, '#FF4E78', true);

        const dist = Math.hypot(p.x - col.x, p.y - col.y);
        if (dist < 26) {
          collectiblesRef.current.splice(i, 1);
          comboRef.current += 1;
          setCombo(comboRef.current);
          const mult = comboRef.current >= 5 ? 2 : 1;
          const pts = col.points * mult;
          scoreRef.current += pts;
          setScore(scoreRef.current);
          if (soundEnabled) sounds.playPop();
          spawnParticles(col.x, col.y, '#FF7BA3', 12);
          addFloatingText(
            col.x,
            col.y,
            `+${pts}${mult > 1 ? ' 2X!' : ''}`,
            '#FF7BA3',
          );
          continue;
        }

        if (col.y > canvas.height + 25) {
          collectiblesRef.current.splice(i, 1);
        }
      }
    } else if (activeGame === 'catch') {
      // BERRY CATCH (Basket collector)
      const p = playerRef.current;
      const moveSpeed = 7.5;
      if (keysRef.current.left && p.x > 35) p.x -= moveSpeed;
      if (keysRef.current.right && p.x < canvas.width - 35) p.x += moveSpeed;
      p.y = 290;

      drawBasket(ctx, p.x, p.y);

      // Spawn falling Treats and Spiked Bombs
      if (frame % 30 === 0) {
        const isHazard = Math.random() < 0.22;
        collectiblesRef.current.push({
          x: 30 + Math.random() * (canvas.width - 60),
          y: -25,
          size: 16,
          speed: 3.5 + Math.random() * 2.5,
          rot: 0,
          isHazard,
          type: isHazard ? 'bomb' : 'berry',
          points: isHazard ? 0 : 35,
        });
      }

      // Update Collectibles
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const col = collectiblesRef.current[i];
        col.y += col.speed;

        if (col.isHazard) {
          // Draw Spiked Bomb
          ctx.save();
          ctx.fillStyle = '#1E293B';
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(col.x, col.y, 12, 0, Math.PI * 2);
          ctx.fill();
          // Fuse
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(col.x, col.y - 12, 6, 0, Math.PI);
          ctx.stroke();
          ctx.restore();
        } else {
          // Draw Sweet Berry
          ctx.save();
          ctx.fillStyle = '#EC4899';
          ctx.shadowColor = '#F472B6';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(col.x, col.y, 11, 0, Math.PI * 2);
          ctx.fill();
          // Leaf
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.ellipse(col.x, col.y - 10, 4, 2, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Catch in basket
        const dist = Math.hypot(p.x - col.x, p.y - col.y);
        if (dist < 28) {
          collectiblesRef.current.splice(i, 1);

          if (col.isHazard) {
            livesRef.current -= 1;
            setLives(livesRef.current);
            comboRef.current = 0;
            setCombo(0);
            shakeRef.current = 10;
            flashRef.current = 0.4;
            if (soundEnabled) sounds.playCountdownBeep(true);
            spawnParticles(col.x, col.y, '#EF4444', 16);
            if (livesRef.current <= 0) {
              handleGameOver();
              ctx.restore();
              return;
            }
          } else {
            comboRef.current += 1;
            setCombo(comboRef.current);
            const mult = comboRef.current >= 5 ? 2 : 1;
            const pts = col.points * mult;
            scoreRef.current += pts;
            setScore(scoreRef.current);
            if (soundEnabled) sounds.playPop();
            spawnParticles(col.x, col.y, '#EC4899', 12);
            addFloatingText(
              col.x,
              col.y,
              `+${pts}${mult > 1 ? ' 2X!' : ''}`,
              '#EC4899',
            );
          }
          continue;
        }

        if (col.y > canvas.height + 25) {
          collectiblesRef.current.splice(i, 1);
        }
      }
    }

    // --- 3. PARTICLES ---
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay || 0.03;
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

    // --- 4. FLOATING SCORE TEXT ---
    for (let i = floatersRef.current.length - 1; i >= 0; i--) {
      const fl = floatersRef.current[i];
      fl.y += fl.vy;
      fl.alpha -= 0.025;
      if (fl.alpha <= 0) {
        floatersRef.current.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = fl.alpha;
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = fl.color;
      ctx.shadowColor = fl.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(fl.text, fl.x, fl.y);
      ctx.restore();
    }

    // --- 5. SCREEN FLASH (Damage / Collect) ---
    if (flashRef.current > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${flashRef.current})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashRef.current -= 0.05;
    }

    // --- 6. CRT SCANLINES & GLASS CURVE ---
    if (crtEffect) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.fillRect(0, y, canvas.width, 1);
      }
      // Subtle glass glare
      const glare = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      glare.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      glare.addColorStop(0.35, 'transparent');
      glare.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = glare;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore(); // Undo screen shake

    animFrameRef.current = requestAnimationFrame(runGameLoop);
  }, [activeGame, crtEffect, handleGameOver, soundEnabled]);

  const startGame = () => {
    if (soundEnabled) sounds.playPop();
    setScore(0);
    setCombo(0);
    setLives(3);
    scoreRef.current = 0;
    comboRef.current = 0;
    livesRef.current = 3;
    frameCountRef.current = 0;
    shakeRef.current = 0;
    flashRef.current = 0;
    setIsNewRecord(false);

    playerRef.current = {
      x: activeGame === 'jump' ? 70 : 280,
      y: activeGame === 'jump' ? 240 : 285,
      vx: 0,
      vy: 0,
      width: 36,
      height: 36,
      isGrounded: true,
      trail: [],
    };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    floatersRef.current = [];
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
      if (e.code === 'KeyP' || e.code === 'Escape') {
        setGameState((st) =>
          st === 'playing' ? 'paused' : st === 'paused' ? 'playing' : st,
        );
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
    <div
      style={{
        background: '#0F1016',
        minHeight: '100vh',
        paddingBottom: '80px',
        color: '#F8FAFC',
      }}
    >
      <Confetti active={confettiActive} />

      {/* Top Bar with Neon Glow */}
      <header
        className="bar"
        style={{ background: '#141724', borderBottom: '1px solid #282C3F' }}
      >
        <div
          className="wrap"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              className="brand"
              href="/"
              onClick={() => sounds.playPop()}
              aria-label="Dearly Us Home"
            >
              <BrandLogo tone="light" />
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: '#1D2132',
                color: '#E2E8F0',
                padding: '5px 14px',
                borderRadius: '20px',
                border: '1px solid #333952',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{partnerA}:</span>{' '}
              <b style={{ color: 'var(--pink)' }}>{highScores.a} PTS</b> ·{' '}
              <span>{partnerB}:</span>{' '}
              <b style={{ color: 'var(--blue)' }}>{highScores.b} PTS</b>
            </span>

            <Link
              className="btn btn-ghost"
              href="/activity"
              onClick={() => sounds.playPop()}
              style={{ color: '#E2E8F0', borderColor: '#333952' }}
            >
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '28px', maxWidth: '760px' }}>
        {/* Cabinet Marquee Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'linear-gradient(90deg, #FF4E78, #8B5CF6, #3B82F6)',
              padding: '2px',
              borderRadius: '24px',
              boxShadow: '0 0 20px rgba(255, 78, 120, 0.4)',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                background: '#151722',
                padding: '6px 20px',
                borderRadius: '22px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '1.5px',
                color: '#F8FAFC',
                textTransform: 'uppercase',
              }}
            >
              ★ DEARLY ARCADE · NEO RETRO 2-PLAYER CABINET ★
            </div>
          </div>

          <h1
            style={{
              fontSize: 'clamp(26px, 3.8vw, 38px)',
              margin: '4px 0',
              fontWeight: 900,
              letterSpacing: '-0.5px',
            }}
          >
            Two Screens,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FF7BA3, #60A5FA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Retro High Scores
            </span>
            .
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>
            Built for {partnerA} &amp; {partnerB}. Smooth 60 FPS physics engine,
            particle bursts, and combo multipliers.
          </p>
        </div>

        {/* Player Switcher Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => {
              if (gameState === 'playing') return;
              sounds.playPop();
              setActivePlayer('a');
            }}
            style={{
              padding: '8px 22px',
              borderRadius: '24px',
              border:
                activePlayer === 'a'
                  ? '2px solid #FF4E78'
                  : '1px solid #2D3349',
              background:
                activePlayer === 'a' ? 'rgba(255, 78, 120, 0.25)' : '#191C28',
              color: activePlayer === 'a' ? '#FF7BA3' : '#94A3B8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow:
                activePlayer === 'a'
                  ? '0 0 15px rgba(255, 78, 120, 0.35)'
                  : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🕹️ P1: {partnerA}
          </button>
          <button
            onClick={() => {
              if (gameState === 'playing') return;
              sounds.playPop();
              setActivePlayer('b');
            }}
            style={{
              padding: '8px 22px',
              borderRadius: '24px',
              border:
                activePlayer === 'b'
                  ? '2px solid #3B82F6'
                  : '1px solid #2D3349',
              background:
                activePlayer === 'b' ? 'rgba(59, 130, 246, 0.25)' : '#191C28',
              color: activePlayer === 'b' ? '#60A5FA' : '#94A3B8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow:
                activePlayer === 'b'
                  ? '0 0 15px rgba(59, 130, 246, 0.35)'
                  : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🕹️ P2: {partnerB}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PHYSICAL RETRO ARCADE CABINET WRAPPER */}
        {/* ========================================================================= */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1F2333 0%, #131520 100%)',
            border: '3px solid #383E58',
            borderRadius: '28px',
            padding: '24px 20px',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
            position: 'relative',
          }}
        >
          {/* Cabinet Top Header & Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {/* Game Selection Pills */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'jump', name: '🦘 Heart Runner' },
                { id: 'dodge', name: '🚀 Cosmic Dodge' },
                { id: 'catch', name: '🍓 Berry Catch' },
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
                    border:
                      activeGame === g.id
                        ? '2px solid #FF4E78'
                        : '1px solid #333952',
                    background:
                      activeGame === g.id
                        ? 'rgba(255, 78, 120, 0.2)'
                        : '#171A27',
                    color: activeGame === g.id ? '#FF7BA3' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {/* CRT & Audio Toggles */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCrtEffect(!crtEffect)}
                style={{
                  background: '#1A1D2B',
                  border: '1px solid #333952',
                  color: crtEffect ? '#34D399' : '#64748B',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                CRT {crtEffect ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: '#1A1D2B',
                  border: '1px solid #333952',
                  color: soundEnabled ? '#FDE047' : '#64748B',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                SFX {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
          </div>

          {/* Arcade Cabinet HUD Status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 14px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              borderBottom: '1px solid #23273A',
              marginBottom: '12px',
            }}
          >
            <div>
              <span style={{ color: '#64748B' }}>PLAYER: </span>
              <span
                style={{
                  color: activePlayer === 'a' ? 'var(--pink)' : 'var(--blue)',
                  fontWeight: 900,
                }}
              >
                {currentPlayerName.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {combo >= 3 && (
                <span
                  style={{
                    color: '#F59E0B',
                    fontWeight: 900,
                    animation: 'bounce 0.5s infinite',
                  }}
                >
                  🔥 {combo}X COMBO!
                </span>
              )}
              <div>
                <span style={{ color: '#64748B' }}>SCORE: </span>
                <span
                  style={{
                    color: '#FDE047',
                    fontWeight: 900,
                    fontSize: '15px',
                  }}
                >
                  {score}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>LIVES: </span>
                <span
                  style={{
                    color: '#EF4444',
                    letterSpacing: '2px',
                    fontSize: '15px',
                  }}
                >
                  {'♥'.repeat(Math.max(0, lives))}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CRT SCREEN CONTAINER WITH CURVED BEZEL */}
          {/* ========================================================================= */}
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '4px solid #11131C',
              boxShadow:
                'inset 0 0 30px rgba(0,0,0,0.9), 0 0 15px rgba(255, 78, 120, 0.2)',
              background: '#0B0D14',
            }}
          >
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
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

            {/* SCREEN OVERLAY: IDLE */}
            {gameState === 'idle' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(11, 13, 20, 0.88)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  backdropFilter: 'blur(3px)',
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    animation: 'bounce 0.8s infinite',
                  }}
                >
                  {activeGame === 'jump'
                    ? '💖'
                    : activeGame === 'dodge'
                      ? '🚀'
                      : '🧺'}
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    letterSpacing: '-0.3px',
                    margin: 0,
                  }}
                >
                  {activeGame === 'jump'
                    ? 'Heart Runner'
                    : activeGame === 'dodge'
                      ? 'Cosmic Dodge'
                      : 'Sweet Berry Catch'}
                </h3>
                <p
                  style={{
                    color: '#94A3B8',
                    fontSize: '14px',
                    maxWidth: '420px',
                    lineHeight: 1.4,
                    margin: '0 auto 8px',
                  }}
                >
                  {activeGame === 'jump' &&
                    'Leap over cyber sparks, grab golden stars, and build your combo streak!'}
                  {activeGame === 'dodge' &&
                    'Steer your neon starship through raining asteroid fields and collect energy hearts!'}
                  {activeGame === 'catch' &&
                    'Slide your picnic basket under falling treats, gather combos, and dodge bombs!'}
                </p>
                <button
                  className="btn btn-grad"
                  onClick={startGame}
                  style={{
                    padding: '12px 34px',
                    fontSize: '16px',
                    borderRadius: '14px',
                    boxShadow: '0 0 25px rgba(255, 78, 120, 0.5)',
                  }}
                >
                  Insert Coin &amp; Play ({currentPlayerName}) ▶
                </button>
              </div>
            )}

            {/* SCREEN OVERLAY: PAUSED */}
            {gameState === 'paused' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(11, 13, 20, 0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                }}
              >
                <h3
                  style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#FDE047',
                  }}
                >
                  PAUSED
                </h3>
                <button
                  className="btn btn-grad"
                  onClick={() => setGameState('playing')}
                  style={{ padding: '10px 26px', fontSize: '15px' }}
                >
                  Resume ▶
                </button>
              </div>
            )}

            {/* SCREEN OVERLAY: GAME OVER */}
            {gameState === 'gameover' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(11, 13, 20, 0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div style={{ fontSize: '42px' }}>💥</div>
                <h3
                  style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    margin: 0,
                  }}
                >
                  GAME OVER
                </h3>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '32px',
                    color: '#FDE047',
                    fontWeight: 900,
                  }}
                >
                  {score} PTS {isNewRecord && '👑 NEW BEST!'}
                </div>
                <p
                  style={{
                    color: '#94A3B8',
                    fontSize: '14px',
                    maxWidth: '380px',
                    margin: '4px 0 10px',
                  }}
                >
                  {score > highScores[activePlayer === 'a' ? 'b' : 'a']
                    ? `🔥 ${currentPlayerName} holds the crown over their partner!`
                    : `Partner record: ${highScores[activePlayer === 'a' ? 'b' : 'a']} PTS. Think you can top it?`}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-grad"
                    onClick={startGame}
                    style={{ padding: '10px 24px', fontSize: '14px' }}
                  >
                    Play Again ↺
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      sounds.playPop();
                      setActivePlayer((p) => (p === 'a' ? 'b' : 'a'));
                      setGameState('idle');
                    }}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      background: '#232635',
                      color: '#fff',
                    }}
                  >
                    Pass to {activePlayer === 'a' ? partnerB : partnerA} ▷
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TACTILE ARCADE BUTTON CONTROLLER PANEL */}
          {/* ========================================================================= */}
          <div
            style={{
              marginTop: '18px',
              padding: '16px',
              background: '#151722',
              borderRadius: '16px',
              border: '1px solid #282C3D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#64748B',
                fontFamily: 'var(--font-mono)',
              }}
            >
              KEYBOARD: <b>[SPACE]</b> / <b>[↑]</b> Jump · <b>[←] [→]</b> /{' '}
              <b>[A] [D]</b> Move · <b>[P]</b> Pause
            </div>

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
                style={{
                  background:
                    'linear-gradient(180deg, #FF6088 0%, #D81B4B 100%)',
                  border: '2px solid #FF95B1',
                  borderRadius: '16px',
                  padding: '14px 44px',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 900,
                  boxShadow:
                    '0 6px 0 #9E1034, 0 10px 20px rgba(255, 78, 120, 0.4)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transform: 'translateY(0)',
                  transition: 'transform 0.05s ease',
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') e.preventDefault();
                }}
              >
                🔴 JUMP [SPACE]
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
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
                  style={{
                    background:
                      'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                    border: '2px solid #60A5FA',
                    borderRadius: '14px',
                    padding: '14px 28px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 900,
                    boxShadow:
                      '0 5px 0 #1E3A8A, 0 8px 16px rgba(59, 130, 246, 0.3)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  ◀ LEFT [A]
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
                  style={{
                    background:
                      'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                    border: '2px solid #60A5FA',
                    borderRadius: '14px',
                    padding: '14px 28px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 900,
                    boxShadow:
                      '0 5px 0 #1E3A8A, 0 8px 16px rgba(59, 130, 246, 0.3)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  RIGHT ▶ [D]
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

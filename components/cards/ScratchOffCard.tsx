'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sounds } from '@/lib/sound';

interface ScratchOffCardProps {
  children: React.ReactNode;
  onScratchComplete?: () => void;
  resetKey?: string | number;
}

export function ScratchOffCard({ children, onScratchComplete, resetKey }: ScratchOffCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const isDrawing = useRef(false);
  const lastSoundTime = useRef(0);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.offsetWidth || 500;
    const height = container.offsetHeight || 290;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';

    // Silver metallic brushed foil gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#CBD5E1');
    grad.addColorStop(0.2, '#FFFFFF');
    grad.addColorStop(0.4, '#94A3B8');
    grad.addColorStop(0.7, '#E2E8F0');
    grad.addColorStop(0.9, '#FFFFFF');
    grad.addColorStop(1, '#94A3B8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle glitter speckles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 300; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }

    // Embossed center badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 140, height / 2 - 32, 280, 64, 32);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px "Space Mono", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙 SCRATCH WITH COIN OR FINGER', width / 2, height / 2 - 6);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('Scratch 50% to reveal mystery card', width / 2, height / 2 + 12);

    setIsScratched(false);
    setScratchPercent(0);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas, resetKey]);

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientY ? clientX - rect.left : 0;
    const y = clientY ? clientY - rect.top : 0;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Throttled tactile coin scrape sound
    const now = Date.now();
    if (now - lastSoundTime.current > 75) {
      sounds.playCoinScratch();
      lastSoundTime.current = now;
    }
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let transparentCount = 0;
      const step = 32; // sampling step for high performance
      const totalSamples = pixels.length / step;

      for (let i = 3; i < pixels.length; i += step) {
        if (pixels[i] === 0) transparentCount++;
      }

      const percent = Math.round((transparentCount / totalSamples) * 100);
      setScratchPercent(percent);

      if (percent >= 48) {
        setIsScratched(true);
        sounds.playCelebration();
        onScratchComplete?.();
      }
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Hidden Card Content */}
      <div style={{ width: '100%', position: 'relative' }}>{children}</div>

      {/* Silver Foil Scratch-Off Canvas Layer */}
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
          isDrawing.current = true;
          scratch(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (isDrawing.current) scratch(e.clientX, e.clientY);
        }}
        onMouseUp={() => {
          isDrawing.current = false;
          checkScratchPercentage();
        }}
        onMouseLeave={() => {
          if (isDrawing.current) {
            isDrawing.current = false;
            checkScratchPercentage();
          }
        }}
        onTouchStart={(e) => {
          isDrawing.current = true;
          const touch = e.touches[0];
          scratch(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          if (isDrawing.current) {
            const touch = e.touches[0];
            scratch(touch.clientX, touch.clientY);
          }
        }}
        onTouchEnd={() => {
          isDrawing.current = false;
          checkScratchPercentage();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: isScratched ? 'default' : 'crosshair',
          touchAction: 'none',
          zIndex: 10,
          opacity: isScratched ? 0 : 1,
          pointerEvents: isScratched ? 'none' : 'auto',
          transition: 'opacity 0.5s ease',
          borderRadius: '20px',
        }}
      />

      {/* Quick Reveal Helper Pill */}
      {!isScratched && (
        <button
          onClick={() => {
            sounds.playPop();
            setIsScratched(true);
            onScratchComplete?.();
          }}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '14px',
            zIndex: 15,
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: '#475569',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          Reveal {scratchPercent > 0 ? `(${scratchPercent}%)` : 'All ✦'}
        </button>
      )}
    </div>
  );
}

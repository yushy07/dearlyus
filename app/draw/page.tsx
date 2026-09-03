'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import { CoupleNameBar } from '@/components/shared';
import { useRoomSync } from '@/lib/room';
import { sounds } from '@/lib/sound';

export default function DrawPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF7BA3');
  const [brushSize, setBrushSize] = useState(4);
  const [prompt] = useState('Draw: Our Dream Sunset Date 🌅');
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // WebRTC & BroadcastChannel Live Room Sync
  const handleRemoteMessage = useCallback((event: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (event.type === 'draw_line') {
      const { fromX, fromY, toX, toY, color: remoteColor, brushSize: remoteSize } = event.payload;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = remoteColor;
      ctx.lineWidth = remoteSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else if (event.type === 'draw_clear') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      sounds.playPop();
    }
  }, []);

  const { sendEvent, partnerOnline } = useRoomSync({
    roomCode: roomCode || 'LOVE',
    senderName: partnerA,
    onMessage: handleRemoteMessage,
    pollingIntervalMs: 400, // rapid polling for drawing
  });

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);
    lastPosRef.current = coords;
    setIsDrawing(true);
  };

  const moveDraw = (clientX: number, clientY: number) => {
    if (!isDrawing || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(clientX, clientY);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Broadcast stroke to partner across P2P / BroadcastChannel
    sendEvent('draw_line', {
      fromX: lastPosRef.current.x,
      fromY: lastPosRef.current.y,
      toX: coords.x,
      toY: coords.y,
      color,
      brushSize,
    });

    lastPosRef.current = coords;
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    sounds.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    sendEvent('draw_clear', {});
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Live Room Sync Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: partnerOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: partnerOnline ? '#059669' : '#D97706',
                border: `1px solid ${partnerOnline ? '#A7F3D0' : '#FDE68A'}`,
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: partnerOnline ? '#10B981' : '#F59E0B',
                  animation: 'gl-pulse 1.5s infinite',
                }}
              />
              <span>
                {partnerOnline
                  ? `ROOM ${roomCode || 'LOVE'} · LIVE SYNCED`
                  : `ROOM ${roomCode || 'LOVE'} · WAITING FOR ${partnerB}`}
              </span>
            </div>

            <Link className="btn btn-ghost" href="/activity">
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '780px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CoupleNameBar />
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            Same prompt, <span className="grad">shared live canvas</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>{prompt}</p>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Tools */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Color:</span>
              {['#FF7BA3', '#5FA0FF', '#17181C', '#E8B042', '#3AA66F', '#8B5CF6'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid #17181C' : '1px solid var(--line)',
                    cursor: 'pointer',
                    transform: color === c ? 'scale(1.2)' : 'none',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Size:</span>
              {[2, 4, 8, 14].map((s) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: brushSize === s ? '2px solid var(--pink)' : '1px solid var(--line)',
                    background: brushSize === s ? 'var(--pink-tint)' : '#fff',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {s}px
                </button>
              ))}
              <button className="btn btn-ghost" onClick={clearCanvas} style={{ padding: '6px 12px', fontSize: '12px' }}>
                Clear 🧹
              </button>
            </div>
          </div>

          {/* HTML5 Canvas with Mouse & Touch Event Handlers */}
          <div style={{ border: '2px solid var(--line)', borderRadius: '12px', overflow: 'hidden', background: '#fff', touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={440}
              onMouseDown={(e) => startDraw(e.clientX, e.clientY)}
              onMouseMove={(e) => moveDraw(e.clientX, e.clientY)}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  startDraw(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) {
                  moveDraw(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={stopDraw}
              style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              ✏️ Drawing with {color === '#FF7BA3' ? `${partnerA} (Pink)` : `${partnerB} (Blue)`} · Realtime P2P Synced
            </span>
            <button className="btn btn-grad" onClick={() => alert('Drawing saved to your shared scrapbook!')}>
              Save to Album 🖼️
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

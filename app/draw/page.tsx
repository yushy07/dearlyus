'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import { CoupleNameBar, Ribbon, Navbar } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import type { StrokeBatch, StrokePoint } from '@/lib/activity-adapters/draw';

const COLOR_PALETTE = [
  '#FF7BA3', // Dearly Rose
  '#E11D48', // Ruby Passion
  '#F59E0B', // Warm Sunlight
  '#10B981', // Emerald Forest
  '#3B82F6', // Ocean Blue
  '#8B5CF6', // Twilight Lavender
  '#1F2937', // Midnight Slate
];

export default function DrawPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { user } = useSupabaseSession();
  const { sessionId, sendEvent, sendTransient, registerEventHandler, registerTransientHandler, recover } =
    useActivitySession();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();
  const localRuntime = useActivityRuntime({
    sessionId: sessionId || `mock-draw-${roomCode || 'local'}`,
    activityType: 'draw',
    userId: user?.id,
    roomId: roomCode || 'local',
    transportMode: 'mock',
    enabled: !sessionId,
    initialOptions: { prompt: 'Draw: Our Dream Sunset Date 🌅' },
  });
  const activitySendEvent = sessionId ? sendEvent : localRuntime.sendEvent;
  const activitySendTransient = sessionId ? sendTransient : localRuntime.sendTransient;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF7BA3');
  const [brushSize, setBrushSize] = useState(4);
  const [prompt] = useState('Draw: Our Dream Sunset Date 🌅');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  // Transient partner cursor state (zero DB storage)
  const [partnerCursor, setPartnerCursor] = useState<{
    x: number;
    y: number;
    userName: string;
    color: string;
    visible: boolean;
  } | null>(null);

  const lastPosRef = useRef<StrokePoint | null>(null);
  const currentPointsRef = useRef<StrokePoint[]>([]);
  const strokeSequenceRef = useRef<number>(0);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setup Canvas and render white background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Draw a smooth stroke batch on canvas
  const renderStrokeBatch = useCallback((batch: StrokeBatch) => {
    const canvas = canvasRef.current;
    if (!canvas || !batch.points || batch.points.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = batch.color;
    ctx.lineWidth = batch.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(batch.points[0].x, batch.points[0].y);
    for (let i = 1; i < batch.points.length; i++) {
      ctx.lineTo(batch.points[i].x, batch.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  // Listen to durable session events (batched strokes and canvas clears)
  useEffect(() => {
    const unregister = registerEventHandler((event) => {
      if (event.type === 'draw_batch') {
        const batch = event.payload as StrokeBatch;
        renderStrokeBatch(batch);
      } else if (event.type === 'draw_clear') {
        initCanvas();
        sounds.playPop();
      }
    });

    return () => {
      unregister();
    };
  }, [registerEventHandler, renderStrokeBatch, initCanvas]);

  useEffect(() => {
    if (sessionId || !localRuntime.lastEvent) return;
    const event = localRuntime.lastEvent;
    if (event.type === 'draw_batch') {
      const batch = event.payload as StrokeBatch;
      // The local artist has already painted this batch with zero latency.
      // Render only a partner's durable batch when the mock bus echoes it back.
      if (batch.userId !== localRuntime.currentUserId) renderStrokeBatch(batch);
    }
    if (event.type === 'draw_clear') initCanvas();
  }, [sessionId, localRuntime.lastEvent, localRuntime.currentUserId, renderStrokeBatch, initCanvas]);

  // Listen to transient cursor broadcasts (strictly ephemeral WebSocket, no DB rows)
  useEffect(() => {
    const unregister = registerTransientHandler('pointer_move', (payload: any) => {
      if (payload && payload.userId !== user?.id) {
        setPartnerCursor({
          x: payload.x,
          y: payload.y,
          userName: payload.userName || partnerB || 'Partner',
          color: payload.color || '#F59E0B',
          visible: true,
        });

        if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
        cursorTimeoutRef.current = setTimeout(() => {
          setPartnerCursor((prev) => (prev ? { ...prev, visible: false } : null));
        }, 3000);
      }
    });

    return () => {
      unregister();
    };
  }, [registerTransientHandler, user?.id, partnerB]);

  useEffect(() => {
    if (sessionId) return;
    return localRuntime.subscribeTransient('pointer_move', (payload: any) => {
      if (payload && payload.userId !== localRuntime.currentUserId) {
        setPartnerCursor({ x: payload.x, y: payload.y, userName: payload.userName || partnerB || 'Partner', color: payload.color || '#F59E0B', visible: true });
      }
    });
  }, [sessionId, localRuntime, partnerB]);

  const getCanvasCoords = (clientX: number, clientY: number): StrokePoint => {
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
    currentPointsRef.current = [coords];
    setIsDrawing(true);
  };

  const moveDraw = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);

    // Broadcast transient cursor coordinate to partner (ephemeral Realtime channel)
    activitySendTransient('pointer_move', {
      x: coords.x,
      y: coords.y,
      userId: user?.id,
      userName: partnerA,
      color,
    });

    if (!isDrawing || !lastPosRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw locally immediately for 0ms latency
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPosRef.current = coords;
    currentPointsRef.current.push(coords);

    // Batch and dispatch when batch reaches 18 points
    if (currentPointsRef.current.length >= 18) {
      flushStrokeBatch();
    }
  };

  const flushStrokeBatch = () => {
    if (currentPointsRef.current.length < 2) return;
    strokeSequenceRef.current += 1;

    const batch: StrokeBatch = {
      id: crypto.randomUUID(),
      userId: user?.id || localRuntime.currentUserId,
      sequence: strokeSequenceRef.current,
      color,
      brushSize,
      points: [...currentPointsRef.current],
      timestamp: new Date().toISOString(),
    };

    void activitySendEvent('draw_batch', batch);
    // Keep last point as starting point for smooth continuity
    const lastPoint = currentPointsRef.current[currentPointsRef.current.length - 1];
    currentPointsRef.current = [lastPoint];
  };

  const stopDraw = () => {
    if (isDrawing) {
      flushStrokeBatch();
      setIsDrawing(false);
      lastPosRef.current = null;
      currentPointsRef.current = [];
    }
  };

  const clearCanvas = () => {
    sounds.playPop();
    initCanvas();
    void activitySendEvent('draw_clear', { clearedAt: new Date().toISOString(), userId: user?.id || localRuntime.currentUserId });
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sounds.playCelebration();
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `dearly-us-drawing-${Date.now()}.png`;
    a.href = dataUrl;
    a.click();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleSaveToKeepsakes = async () => {
    const canvas = canvasRef.current;
    if (!canvas || keepsakeSaving || keepsakeSaved) return;

    sounds.playCelebration();
    try {
      // Export canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (blob) {
        const file = new File([blob], `drawing-${Date.now()}.png`, { type: 'image/png' });
        await saveKeepsake({
          kind: 'activity',
          title: `Our Artwork · ${prompt}`,
          file,
          activityPath: '/draw',
          caption: `Drawn together in room ${roomCode || 'LOVE'}`,
          metadata: {
            prompt,
            roomCode,
            partnerA,
            partnerB,
            date: new Date().toISOString(),
          },
        });
        setKeepsakeSaved(true);
      }
    } catch (err) {
      console.error('Failed to save drawing to keepsakes:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <Ribbon />
      <Navbar />
      <CoupleNameBar />

      <main style={{ flex: 1, maxWidth: '900px', margin: '0 auto', width: '100%', padding: '24px 16px 80px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            href="/arcade"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--ink-soft)',
              fontSize: '13.5px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ‹ Back to Date Arcade
          </Link>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: sessionId ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: sessionId ? '1px solid #10B981' : '1px solid #F59E0B',
              fontSize: '11px',
              fontWeight: 700,
              color: sessionId ? '#065F46' : '#92400E',
            }}
          >
            <span>{sessionId ? '● ROOM LIVE · BATCHED SYNC' : '○ LOCAL CANVAS'}</span>
          </div>
        </div>

        {/* Prompt Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="badge hot" style={{ marginBottom: '8px', display: 'inline-block' }}>
            Reference Activity · Draw Together
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {prompt}
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', margin: 0 }}>
            Batched strokes, transient live cursors, and checkpoint recovery.
          </p>
        </div>

        {/* Canvas & Floating Transient Partner Pointer */}
        <div
          style={{
            position: 'relative',
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid rgba(244, 114, 182, 0.3)',
            boxShadow: '0 20px 40px -15px rgba(225, 29, 72, 0.12)',
            overflow: 'hidden',
            margin: '0 auto 20px',
            maxWidth: '800px',
            touchAction: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              cursor: 'crosshair',
            }}
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
          />

          {/* Partner's Floating Transient Cursor */}
          {partnerCursor && partnerCursor.visible && (
            <div
              style={{
                position: 'absolute',
                left: `${(partnerCursor.x / 800) * 100}%`,
                top: `${(partnerCursor.y / 500) * 100}%`,
                pointerEvents: 'none',
                transform: 'translate(4px, -10px)',
                transition: 'all 0.05s ease-out',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: partnerCursor.color,
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>✏️</span>
                <span>{partnerCursor.userName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar & Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            padding: '16px 20px',
            borderRadius: '20px',
            border: '1px solid rgba(244, 114, 182, 0.25)',
          }}
        >
          {/* Color Palette */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-soft)' }}>Color:</span>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  sounds.playPop();
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '3px solid #1F2937' : '2px solid #FFFFFF',
                  boxShadow: color === c ? '0 0 0 2px #F43F5E' : '0 2px 6px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              />
            ))}
          </div>

          {/* Brush Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-soft)' }}>Size:</span>
            {[2, 4, 8, 14].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setBrushSize(size);
                  sounds.playPop();
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: brushSize === size ? '2px solid #E11D48' : '1px solid var(--line)',
                  background: brushSize === size ? '#FFF5F8' : '#FFFFFF',
                  color: brushSize === size ? '#BE123C' : 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {size}px
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={clearCanvas}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '999px' }}
            >
              🗑️ Clear
            </button>

            <button
              type="button"
              onClick={downloadDrawing}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '999px' }}
            >
              {savedFeedback ? 'Saved!' : '📥 PNG'}
            </button>

            <button
              type="button"
              onClick={handleSaveToKeepsakes}
              disabled={keepsakeSaved || keepsakeSaving}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #BE123C, #E11D48)',
              }}
            >
              {keepsakeSaved ? '✨ Saved to Keepsakes!' : keepsakeSaving ? 'Saving...' : '💾 Save to Keepsakes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import {
  CoupleNameBar,
  ActivityShell,
} from '@/components/shared';
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
  '#FFFFFF', // Pure Eraser
];

const DRAWING_PROMPTS = [
  'Our Dream Sunset Date 🌅',
  'Our Next Reunion City & Haven ✈️',
  'Portrait of Each Other with Eyes Closed! 🙈',
  'Our Ideal Rainy Sunday Sanctuary ☕',
  'Our Future Shared Living Room 🏡',
];

const STAMP_OPTIONS = ['💖', '🌸', '☕', '✨', '🐾', '💌'];

export default function DrawPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { user } = useSupabaseSession();
  const {
    sessionId,
    sendEvent,
    sendTransient,
    registerEventHandler,
    registerTransientHandler,
  } = useActivitySession();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [promptIdx, setPromptIdx] = useState(0);
  const prompt = DRAWING_PROMPTS[promptIdx];

  const localRuntime = useActivityRuntime({
    sessionId: sessionId || (roomCode ? `room-${roomCode}-draw` : 'local-draw'),
    activityType: 'draw',
    userId: user?.id,
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { prompt },
  });

  const activitySendEvent = sessionId ? sendEvent : localRuntime.sendEvent;
  const activitySendTransient = sessionId
    ? sendTransient
    : localRuntime.sendTransient;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'marker' | 'stamp'>('pen');
  const [activeStamp, setActiveStamp] = useState('💖');
  const [color, setColor] = useState('#FF7BA3');
  const [brushSize, setBrushSize] = useState(4);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  // Transient partner cursor state (ephemeral WebSocket, zero DB storage)
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

  // Setup Canvas and render warm textured paper background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FAF8F5';
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

  // Listen to durable session events
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
      if (batch.userId !== localRuntime.currentUserId) renderStrokeBatch(batch);
    }
    if (event.type === 'draw_clear') initCanvas();
  }, [
    sessionId,
    localRuntime.lastEvent,
    localRuntime.currentUserId,
    renderStrokeBatch,
    initCanvas,
  ]);

  // Listen to transient cursor broadcasts
  useEffect(() => {
    const unregister = registerTransientHandler(
      'pointer_move',
      (payload: any) => {
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
            setPartnerCursor((prev) =>
              prev ? { ...prev, visible: false } : null,
            );
          }, 3000);
        }
      },
    );

    return () => {
      unregister();
    };
  }, [registerTransientHandler, user?.id, partnerB]);

  useEffect(() => {
    if (sessionId) return;
    return localRuntime.subscribeTransient('pointer_move', (payload: any) => {
      if (payload && payload.userId !== localRuntime.currentUserId) {
        setPartnerCursor({
          x: payload.x,
          y: payload.y,
          userName: payload.userName || partnerB || 'Partner',
          color: payload.color || '#F59E0B',
          visible: true,
        });
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

  const applyStamp = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeStamp, x, y);
    ctx.restore();
    sounds.playPop();
  };

  const startDraw = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);

    if (tool === 'stamp') {
      applyStamp(coords.x, coords.y);
      return;
    }

    lastPosRef.current = coords;
    currentPointsRef.current = [coords];
    setIsDrawing(true);
  };

  const moveDraw = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);

    activitySendTransient('pointer_move', {
      x: coords.x,
      y: coords.y,
      userId: user?.id,
      userName: partnerA,
      color,
    });

    if (!isDrawing || !lastPosRef.current || tool === 'stamp') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = color;
    ctx.globalAlpha = tool === 'marker' ? 0.35 : 1.0;
    ctx.lineWidth = tool === 'marker' ? brushSize * 2.5 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    lastPosRef.current = coords;
    currentPointsRef.current.push(coords);

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
      brushSize: tool === 'marker' ? brushSize * 2.5 : brushSize,
      points: [...currentPointsRef.current],
      timestamp: new Date().toISOString(),
    };

    void activitySendEvent('draw_batch', batch);
    const lastPoint =
      currentPointsRef.current[currentPointsRef.current.length - 1];
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
    void activitySendEvent('draw_clear', {
      clearedAt: new Date().toISOString(),
      userId: user?.id || localRuntime.currentUserId,
    });
  };

  const nextPrompt = () => {
    sounds.playTick();
    setPromptIdx((prev) => (prev + 1) % DRAWING_PROMPTS.length);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sounds.playCelebration();
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `dearly-us-artwork-${Date.now()}.png`;
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
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (blob) {
        const file = new File([blob], `artwork-${Date.now()}.png`, {
          type: 'image/png',
        });
        await saveKeepsake({
          kind: 'activity',
          title: `Shared Canvas · ${prompt}`,
          file,
          activityPath: '/draw',
          caption: `Painted together in room ${roomCode || 'OUR-ROOM'}`,
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
    <ActivityShell
      activityTitle="Collaborative Drawing"
      activitySubtitle="Shared Realtime Canvas · Batched Strokes, Live Cursors & Stamps"
      currentStage={keepsakeSaved ? 'remember' : isDrawing ? 'play' : 'ready'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Shared Canvas · ${prompt.slice(0, 30)}`,
        subtitle: 'Multi-layer artwork saved to Our Space',
        badge: '🎨 CANVAS READY',
      }}
      guidancePhase={keepsakeSaved ? 'completed' : isDrawing ? 'private' : 'ready'}
      guidancePrivacyNote="Canvas strokes sync continuously in real time. Save to Our Space Keepsakes when you are both happy with your shared artwork."
    >
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '16px 0 40px' }}>
        {/* Header & Prompt */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <CoupleNameBar />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              margin: '8px 0',
              padding: '6px 16px',
              borderRadius: '999px',
              background: '#FFF5F8',
              border: '1px solid #FFD6E8',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)' }}>
              🎨 {prompt}
            </span>
            <button
              onClick={nextPrompt}
              className="btn btn-ghost"
              style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
            >
              Cycle Prompt ↻
            </button>
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '14px', margin: 0 }}>
            Zero-latency live drawing with batched stroke transmission and romantic physical paper aesthetics.
          </p>
        </div>

        {/* Canvas & Floating Transient Partner Pointer */}
        <div
          style={{
            position: 'relative',
            background: '#FAF8F5',
            borderRadius: '24px',
            border: '2px solid rgba(244, 114, 182, 0.3)',
            boxShadow: '0 20px 40px -15px rgba(225, 29, 72, 0.12)',
            overflow: 'hidden',
            margin: '0 auto 20px',
            maxWidth: '820px',
            touchAction: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={820}
            height={520}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              cursor: tool === 'stamp' ? 'pointer' : 'crosshair',
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
                left: `${(partnerCursor.x / 820) * 100}%`,
                top: `${(partnerCursor.y / 520) * 100}%`,
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
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            padding: '16px 20px',
            borderRadius: '20px',
            border: '1px solid rgba(244, 114, 182, 0.25)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          }}
        >
          {/* Tool Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                setTool('pen');
                sounds.playPop();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: tool === 'pen' ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: tool === 'pen' ? '#FFF5F8' : '#FFF',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🖊️ Fine Pen
            </button>
            <button
              onClick={() => {
                setTool('marker');
                sounds.playPop();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: tool === 'marker' ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: tool === 'marker' ? '#FFF5F8' : '#FFF',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🖍️ Soft Marker
            </button>
            <button
              onClick={() => {
                setTool('stamp');
                sounds.playPop();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: tool === 'stamp' ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: tool === 'stamp' ? '#FFF5F8' : '#FFF',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✨ Stamp
            </button>
          </div>

          {/* Color Palette or Stamps */}
          {tool !== 'stamp' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    sounds.playPop();
                  }}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid #1F2937' : '2px solid #E5E7EB',
                    boxShadow: color === c ? '0 0 0 2px #F43F5E' : '0 2px 4px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {STAMP_OPTIONS.map((stk) => (
                <button
                  key={stk}
                  onClick={() => {
                    setActiveStamp(stk);
                    sounds.playPop();
                  }}
                  style={{
                    fontSize: '18px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: activeStamp === stk ? '2px solid var(--pink)' : '1px solid var(--line)',
                    background: activeStamp === stk ? '#FFF5F8' : '#FFF',
                    cursor: 'pointer',
                  }}
                >
                  {stk}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={clearCanvas}
              className="btn btn-outline"
              style={{
                padding: '7px 14px',
                fontSize: '12.5px',
                borderRadius: '999px',
              }}
            >
              🗑️ Clear
            </button>

            <button
              type="button"
              onClick={downloadDrawing}
              className="btn btn-outline"
              style={{
                padding: '7px 14px',
                fontSize: '12.5px',
                borderRadius: '999px',
              }}
            >
              {savedFeedback ? 'Saved!' : '📥 PNG'}
            </button>

            <button
              type="button"
              onClick={handleSaveToKeepsakes}
              disabled={keepsakeSaved || keepsakeSaving}
              className="btn btn-primary"
              style={{
                padding: '7px 18px',
                fontSize: '12.5px',
                borderRadius: '999px',
              }}
            >
              {keepsakeSaved
                ? '✨ Saved to Keepsakes!'
                : keepsakeSaving
                  ? 'Saving...'
                  : '💾 Save to Keepsakes'}
            </button>
          </div>
        </div>
      </div>
    </ActivityShell>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CoupleNameBar,
  ActivityShell,
} from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

interface ScrapbookItem {
  id: string;
  type: 'polaroid' | 'ticket' | 'note' | 'sticker';
  content: string;
  imageUrl?: string;
  sub?: string;
  x: number;
  y: number;
  rotation: number;
}

const THEMES = [
  { id: 'tokyo', name: 'Tokyo Reunion', icon: '🌸', bg: '#F7F2E8' },
  { id: 'cozy', name: 'Cozy Morning Sanctuary', icon: '☕', bg: '#F5EFEB' },
  { id: 'paris', name: 'Parisian Sunset', icon: '✨', bg: '#FAF5EE' },
  { id: 'cabin', name: 'Rainy Mountain Cabin', icon: '🌲', bg: '#EFECE6' },
  { id: 'distance', name: 'Miles Apart, One Heart', icon: '✈️', bg: '#F0F4F8' },
];

export default function ScrapbookPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-scrapbook` : 'local-scrapbook',
    activityType: 'scrapbook',
    roomId: roomCode || 'local',
    transportMode: 'auto',
  });

  const [items, setItems] = useState<ScrapbookItem[]>([
    {
      id: '1',
      type: 'polaroid',
      content: 'Reunion Station Photo',
      imageUrl: '/photos/frame1.webp',
      sub: `${partnerA} ♡ ${partnerB} · Station Memory`,
      x: 40,
      y: 30,
      rotation: -4,
    },
    {
      id: '2',
      type: 'ticket',
      content: 'REUNION BOARDING PASS ♡ EXPRESS',
      sub: 'Countdown to our next chapter',
      x: 360,
      y: 40,
      rotation: 3,
    },
    {
      id: '3',
      type: 'note',
      content:
        '“The time difference feels like nothing when we talk until sunrise.”',
      sub: `${partnerA} ♡ ${partnerB}`,
      x: 50,
      y: 320,
      rotation: 2,
    },
    { id: '4', type: 'sticker', content: '💖', x: 260, y: 220, rotation: 12 },
    { id: '5', type: 'sticker', content: '✈️', x: 500, y: 190, rotation: -8 },
    { id: '6', type: 'sticker', content: '🌸', x: 120, y: 450, rotation: 5 },
  ]);

  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = React.useRef<{
    mouseX: number;
    mouseY: number;
    itemX: number;
    itemY: number;
  } | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const handlePointerDown = (e: React.PointerEvent, item: ScrapbookItem) => {
    setActiveItem(item.id);
    setDraggingId(item.id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      itemX: item.x,
      itemY: item.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (draggingId !== id || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              x: Math.max(10, Math.min(680, dragStartRef.current!.itemX + dx)),
              y: Math.max(10, Math.min(480, dragStartRef.current!.itemY + dy)),
            }
          : it,
      ),
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      void runtime.sendEvent('scrapbook_entry_add', { itemId: activeItem });
      dragStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const addStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newItem: ScrapbookItem = {
      id: Date.now().toString(),
      type: 'note',
      content: newNoteText.trim(),
      sub: `Note by ${partnerA} · Today`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      rotation: Math.floor(Math.random() * 12) - 6,
    };
    setItems([...items, newItem]);
    setNewNoteText('');
    sounds.playShutter();
  };

  const addStickerToBoard = (stk: string) => {
    const newItem: ScrapbookItem = {
      id: Date.now().toString(),
      type: 'sticker',
      content: stk,
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      rotation: Math.floor(Math.random() * 20) - 10,
    };
    setItems([...items, newItem]);
    sounds.playCountdownBeep(false);
  };

  const removeSelected = () => {
    if (activeItem) {
      setItems(items.filter((i) => i.id !== activeItem));
      setActiveItem(null);
      sounds.playPop();
    }
  };

  const handleSaveScrapbook = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Scrapbook Wall · ${selectedTheme.name}`,
        activityPath: '/scrapbook',
        caption: `Preserved scrapbook collage with ${items.length} keepsake items & notes.`,
        metadata: {
          activityType: 'scrapbook',
          theme: selectedTheme.name,
          itemCount: items.length,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save scrapbook keepsake:', err);
    }
  };

  return (
    <ActivityShell
      activityTitle="Scrapbook Wall"
      activitySubtitle="Corkboard Collage · Tape Down Polaroids, Ticket Stubs & Love Notes"
      currentStage={keepsakeSaved ? 'remember' : items.length > 5 ? 'play' : 'ready'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Scrapbook Wall · ${selectedTheme.name}`,
        subtitle: `${items.length} Keepsake Elements Pinned`,
        badge: '📖 COLLAGE READY',
      }}
      guidancePhase={keepsakeSaved ? 'completed' : 'ready'}
      guidancePrivacyNote="All items pinned to your shared wall are synchronized across your couple space."
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 800,
              margin: '8px 0',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            Our Digital <span className="grad">Scrapbook Wall</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '52ch', margin: '0 auto' }}>
            Pin photostrips, boarding passes, and love notes. Drag, position, and build your shared couple corkboard.
          </p>
        </div>

        {/* Theme Selector Ribbon */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => {
                setSelectedTheme(th);
                sounds.playTick();
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                border: selectedTheme.id === th.id ? '2px solid #8A5D3B' : '1px solid #D8CFC4',
                background: selectedTheme.id === th.id ? '#FFF' : 'rgba(255,255,255,0.6)',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#2B231E',
                cursor: 'pointer',
              }}
            >
              {th.icon} {th.name}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid #D8CFC4',
            borderRadius: '16px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          }}
        >
          {/* Sticker Palette */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: '#8A5D3B',
              }}
            >
              + STAMP:
            </span>
            {['💖', '✨', '✈️', '🌸', '💌', '📸', '🧸', '☕', '🍜'].map((stk) => (
              <button
                key={stk}
                onClick={() => addStickerToBoard(stk)}
                style={{
                  background: '#FFF',
                  border: '1px solid #E2D9C8',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                {stk}
              </button>
            ))}
          </div>

          {/* New Sticky Note Form */}
          <form onSubmit={addStickyNote} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Write a sweet note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #D8CFC4',
                fontSize: '12.5px',
                width: '180px',
              }}
            />
            <button
              type="submit"
              className="btn btn-sm"
              style={{ background: '#8A5D3B', color: '#FFF', padding: '6px 12px' }}
            >
              + Pin Note
            </button>
          </form>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeItem && (
              <button
                type="button"
                onClick={removeSelected}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px', color: '#BE123C' }}
              >
                🗑️ Remove Selected
              </button>
            )}

            <button
              onClick={handleSaveScrapbook}
              disabled={keepsakeSaved || keepsakeSaving}
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: '12.5px' }}
            >
              {keepsakeSaved ? '✓ Saved to Keepsakes!' : keepsakeSaving ? 'Saving...' : '💾 Save Scrapbook'}
            </button>
          </div>
        </div>

        {/* Corkboard Wall Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '560px',
            background: selectedTheme.bg,
            border: '8px solid #D4B895',
            borderRadius: '20px',
            boxShadow: 'inset 0 0 40px rgba(80,50,20,0.1), 0 16px 32px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            touchAction: 'none',
          }}
        >
          {items.map((item) => {
            const isSelected = activeItem === item.id;
            return (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item)}
                onPointerMove={(e) => handlePointerMove(e, item.id)}
                onPointerUp={handlePointerUp}
                style={{
                  position: 'absolute',
                  left: item.x,
                  top: item.y,
                  transform: `rotate(${item.rotation}deg)`,
                  cursor: draggingId === item.id ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  outline: isSelected ? '2px dashed #FF4D80' : 'none',
                  outlineOffset: '4px',
                  transition: draggingId === item.id ? 'none' : 'box-shadow 0.15s ease',
                  zIndex: isSelected ? 20 : 5,
                }}
              >
                {/* Washi Tape Header */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '18px',
                    background: 'rgba(255, 230, 200, 0.7)',
                    border: '1px dashed rgba(200, 160, 120, 0.5)',
                    borderRadius: '2px',
                    zIndex: 2,
                  }}
                />

                {/* Polaroid Item */}
                {item.type === 'polaroid' && (
                  <div
                    style={{
                      background: '#FFF',
                      padding: '12px 12px 28px',
                      borderRadius: '4px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                      width: '210px',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '170px',
                        background: '#ECE6DC',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                      }}
                    >
                      📸
                    </div>
                    <div
                      style={{
                        marginTop: '10px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'center',
                        color: '#554B45',
                        fontWeight: 600,
                      }}
                    >
                      {item.sub || item.content}
                    </div>
                  </div>
                )}

                {/* Boarding Pass / Ticket Item */}
                {item.type === 'ticket' && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #FFF9F2 0%, #FFF 100%)',
                      border: '1.5px dashed #CBB8A2',
                      padding: '16px 20px',
                      borderRadius: '8px',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                      width: '260px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: '#B45309',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ✦ PASSENGER PASS
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, margin: '4px 0', color: '#2B231E' }}>
                      {item.content}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7E6E65' }}>{item.sub}</div>
                  </div>
                )}

                {/* Sticky Note Item */}
                {item.type === 'note' && (
                  <div
                    style={{
                      background: '#FEF9C3',
                      padding: '18px',
                      borderRadius: '2px',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.09)',
                      width: '200px',
                      fontFamily: 'var(--font-serif, Georgia, serif)',
                      color: '#42372E',
                    }}
                  >
                    <p style={{ margin: '0 0 10px', fontSize: '13.5px', lineHeight: 1.4, fontStyle: 'italic' }}>
                      {item.content}
                    </p>
                    <div style={{ fontSize: '10.5px', color: '#8A7A6E', textAlign: 'right', fontWeight: 600 }}>
                      {item.sub}
                    </div>
                  </div>
                )}

                {/* Sticker Item */}
                {item.type === 'sticker' && (
                  <div
                    style={{
                      fontSize: '38px',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
                    }}
                  >
                    {item.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ActivityShell>
  );
}

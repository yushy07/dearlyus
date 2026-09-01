'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar } from '@/components/shared';
import { sounds } from '@/lib/sound';

interface ScrapbookItem {
  id: string;
  type: 'polaroid' | 'ticket' | 'note' | 'sticker';
  content: string;
  sub?: string;
  x: number;
  y: number;
  rotation: number;
}

export default function ScrapbookPage() {
  const [items, setItems] = useState<ScrapbookItem[]>([
    { id: '1', type: 'polaroid', content: '/photos/frame1.webp', sub: 'Tokyo Station · Aug 2026', x: 40, y: 30, rotation: -4 },
    { id: '2', type: 'ticket', content: 'REUNION PASS ♡ TOKYO', sub: 'Countdown to our next visit', x: 380, y: 50, rotation: 3 },
    { id: '3', type: 'note', content: '“The 6-hour time difference feels like nothing when we talk until sunrise.”', sub: 'Alex ♡ Mia', x: 60, y: 320, rotation: 2 },
    { id: '4', type: 'sticker', content: '💖', x: 260, y: 220, rotation: 12 },
    { id: '5', type: 'sticker', content: '✈️', x: 520, y: 200, rotation: -8 },
    { id: '6', type: 'sticker', content: '🌸', x: 120, y: 460, rotation: 5 },
  ]);

  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [exported, setExported] = useState(false);

  const addStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newItem: ScrapbookItem = {
      id: Date.now().toString(),
      type: 'note',
      content: newNoteText.trim(),
      sub: 'Memory Note · Today',
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
    }
  };

  const exportScrapbook = () => {
    sounds.playCelebration();
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div style={{ background: '#F4EFE6', minHeight: '100vh', paddingBottom: '80px', color: '#2B231E' }}>
      <Ribbon text={<>📖 Digital Scrapbook · <b>Tape Down Polaroids, Ticket Stubs &amp; Memories on a Shared Corkboard</b></>} />

      <Navbar
        rightAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportScrapbook} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
              {exported ? '✓ Saved Memory Sheet!' : 'Export Scrapbook PNG 💾'}
            </button>
          </div>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="eyebrow" style={{ color: '#8A5D3B' }}>Shared Memory Corkboard</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, margin: '8px 0' }}>
            Our Digital <span className="grad">Scrapbook Wall</span>
          </h1>
          <p style={{ color: '#6B5B52', fontSize: '16px', maxWidth: '52ch', margin: '0 auto' }}>
            Pin photostrips, boarding passes, and love notes. Drag and rotate items to build your couple album.
          </p>
        </div>

        {/* Toolbar */}
        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid #D8CFC4',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Sticker Palette */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#8A5D3B' }}>+ Pin Sticker:</span>
            {['💖', '✨', '✈️', '🌸', '💌', '📸', '🧸', '☕', '🍜'].map((stk) => (
              <button
                key={stk}
                onClick={() => addStickerToBoard(stk)}
                style={{
                  background: 'none',
                  border: '1px solid #E2D9C8',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                {stk}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {activeItem && (
              <button onClick={removeSelected} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '12px', color: '#D93838' }}>
                ✕ Remove Item
              </button>
            )}
            <Link href="/photobooth" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>
              + Add Photobooth Cut 📸
            </Link>
          </div>
        </div>

        {/* The Corkboard Canvas */}
        <div
          style={{
            background: '#FAF6EE',
            border: '12px solid #C4A482',
            borderRadius: '20px',
            minHeight: '560px',
            position: 'relative',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1), var(--shadow-lg)',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(#D6C2A5 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              style={{
                position: 'absolute',
                top: `${item.y}px`,
                left: `${item.x}px`,
                transform: `rotate(${item.rotation}deg)`,
                cursor: 'move',
                zIndex: activeItem === item.id ? 10 : 2,
                transition: 'box-shadow 0.15s ease',
              }}
            >
              {/* Polaroid Frame Item */}
              {item.type === 'polaroid' && (
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '12px 12px 28px 12px',
                    borderRadius: '4px',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.15)',
                    border: activeItem === item.id ? '2px solid var(--pink)' : '1px solid #E0D8CC',
                    width: '210px',
                  }}
                >
                  <div style={{ width: '100%', height: '150px', background: '#2B231E', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                    <img src={item.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '12px', color: '#5A4E45', textAlign: 'center' }}>
                    {item.sub}
                  </div>
                </div>
              )}

              {/* Virtual Flight Ticket Stub */}
              {item.type === 'ticket' && (
                <div
                  style={{
                    background: '#FEF9EF',
                    border: '1.5px dashed #B88E56',
                    borderRadius: '8px',
                    padding: '14px 20px',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.1)',
                    width: '260px',
                  }}
                >
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#8A5D3B', textTransform: 'uppercase' }}>
                    REUNION MILESTONE PASS
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#2B231E', marginTop: '2px' }}>{item.content}</div>
                  <div style={{ fontSize: '12px', color: '#8A5D3B', marginTop: '4px' }}>{item.sub}</div>
                </div>
              )}

              {/* Handwritten Sticky Note */}
              {item.type === 'note' && (
                <div
                  style={{
                    background: '#FFF275',
                    padding: '16px',
                    borderRadius: '2px',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
                    width: '220px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '14.5px',
                    lineHeight: 1.4,
                    color: '#2B231E',
                  }}
                >
                  {item.content}
                  <div style={{ fontSize: '11px', marginTop: '10px', textAlign: 'right', opacity: 0.7 }}>{item.sub}</div>
                </div>
              )}

              {/* Sticker Item */}
              {item.type === 'sticker' && (
                <span style={{ fontSize: '42px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>
                  {item.content}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Add Note Form */}
        <form onSubmit={addStickyNote} style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Write a sweet memory note to pin on the corkboard..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px solid #D8CFC4',
              background: '#fff',
              fontSize: '14px',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '13px' }}>
            + Pin Sticky Note
          </button>
        </form>
      </main>
    </div>
  );
}

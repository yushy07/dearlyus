'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar, Confetti } from '@/components/shared';
import { sounds } from '@/lib/sound';

const SHIRT_COLORS = [
  { id: 'vintage-white', name: 'Vintage Off-White', hex: '#F7F5F0', textHex: '#1E1E24' },
  { id: 'washed-black', name: 'Washed Charcoal', hex: '#26262B', textHex: '#F8F9FB' },
  { id: 'baby-pink', name: 'Blush Pink', hex: '#FDECEF', textHex: '#3D2A30' },
  { id: 'sky-blue', name: 'Sky Blue', hex: '#E8F1F8', textHex: '#223843' },
  { id: 'matcha', name: 'Matcha Sage', hex: '#E9EFE6', textHex: '#2B3A28' },
  { id: 'navy', name: 'Deep Midnight Navy', hex: '#161E2E', textHex: '#ECEFF4' },
];

const SHIRT_EMOJIS = ['🫰', '💖', '✨', '☕', '✈️', '🌏', '🍕', '🧸', '🌸', '💌', '🎬', '🍜'];

export default function ShirtsStudioPage() {
  const [selectedColor, setSelectedColor] = useState(SHIRT_COLORS[0]);
  const [customText, setCustomText] = useState('CALGARY ♡ JAKARTA');
  const [placedStickers, setPlacedStickers] = useState<string[]>(['🫰', '✈️', '💖']);
  const [viewSide, setViewSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [saved, setSaved] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  const addSticker = (s: string) => {
    if (placedStickers.length < 6) {
      setPlacedStickers([...placedStickers, s]);
      sounds.playCountdownBeep(false);
    }
  };

  const removeSticker = (idx: number) => {
    setPlacedStickers(placedStickers.filter((_, i) => i !== idx));
  };

  const handleExportPNG = () => {
    sounds.playCelebration();
    setConfettiActive(true);
    setSaved(true);
    setTimeout(() => {
      setConfettiActive(false);
      setSaved(false);
    }, 3000);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>👕 Couple Matching Outfits · <b>Interactive Outfit Designer for Two</b></>} />
      <Confetti active={confettiActive} />

      <Navbar
        rightAction={
          <Link className="btn btn-ghost" href="/fashion" style={{ padding: '6px 12px', fontSize: '13px' }}>
            Fashion Runway ▷
          </Link>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '980px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Digital Outfit Studio</span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '8px 0' }}>
            Design Matching <span className="grad">Couple Outfits</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '54ch', margin: '0 auto' }}>
            Customize matching shirts with your city names, coordinates, and photo stickers. Export high-res digital mockups for your couple scrapbook.
          </p>
        </div>

        <div className="booth-showcase-grid">
          {/* Shirt Visual Canvas */}
          <div className="booth-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 20px', minHeight: '440px' }}>
            {/* Front / Back Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button
                onClick={() => setViewSide('FRONT')}
                className={`btn ${viewSide === 'FRONT' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 14px', fontSize: '12px' }}
              >
                Front View
              </button>
              <button
                onClick={() => setViewSide('BACK')}
                className={`btn ${viewSide === 'BACK' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 14px', fontSize: '12px' }}
              >
                Back View
              </button>
            </div>

            {/* Simulated T-Shirt Vector Mockup */}
            <div
              style={{
                position: 'relative',
                width: '280px',
                height: '320px',
                background: selectedColor.hex,
                borderRadius: '24px 24px 12px 12px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.4)',
                border: '2px solid rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                transition: 'background 0.3s ease',
              }}
            >
              {/* Collar Ribbing */}
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  width: '90px',
                  height: '24px',
                  borderBottom: `2px solid ${selectedColor.textHex}`,
                  borderRadius: '0 0 50px 50px',
                  opacity: 0.25,
                }}
              />

              {viewSide === 'FRONT' ? (
                <>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '.18em',
                      color: selectedColor.textHex,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      marginBottom: '12px',
                      opacity: 0.9,
                    }}
                  >
                    {customText}
                  </div>

                  {/* Strip Graphics Box */}
                  <div
                    style={{
                      width: '110px',
                      height: '140px',
                      background: '#FFFFFF',
                      padding: '6px',
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ flex: 1, background: 'var(--paper)', borderRadius: '2px', overflow: 'hidden' }}>
                      <img src="/photos/frame1.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, background: 'var(--paper)', borderRadius: '2px', overflow: 'hidden' }}>
                      <img src="/photos/frame2.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>

                  {/* Sticker Badges */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                    {placedStickers.map((stk, i) => (
                      <span key={i} style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                        {stk}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: selectedColor.textHex }}>
                  <div style={{ fontSize: '42px', marginBottom: '8px' }}>💖</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800 }}>ANGIE LDR CLUB</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>EST. 2026 · DISTANCE CLOSED</div>
                </div>
              )}
            </div>
          </div>

          {/* Customizer Panel */}
          <div className="booth-box">
            <span className="eyebrow">Design Controls</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 16px' }}>Customize Twin Look</h3>

            {/* Palette */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Fabric Color: <b>{selectedColor.name}</b>
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {SHIRT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: c.hex,
                      border: selectedColor.id === c.id ? '3px solid var(--pink)' : '1px solid var(--line)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Custom Cities / Coordinates Text */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Chest Typography:
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={30}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px', fontWeight: 700 }}
              />
            </div>

            {/* Stickers Palette */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Add Photo Stickers ({placedStickers.length}/6):
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {SHIRT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addSticker(emoji)}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {placedStickers.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {placedStickers.map((s, idx) => (
                    <span
                      key={idx}
                      onClick={() => removeSticker(idx)}
                      style={{
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                      title="Click to remove"
                    >
                      {s} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleExportPNG}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', justifyContent: 'center' }}
            >
              {saved ? '✓ Digital Outfit Saved!' : 'Download Outfit Mockup PNG 💾'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

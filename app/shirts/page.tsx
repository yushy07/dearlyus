'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
  const [shirtSizeP1, setShirtSizeP1] = useState('M');
  const [shirtSizeP2, setShirtSizeP2] = useState('L');
  const [viewSide, setViewSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const addSticker = (s: string) => {
    if (placedStickers.length < 6) {
      setPlacedStickers([...placedStickers, s]);
    }
  };

  const copyDesignLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      {/* Ribbon */}
      <div className="ribbon">
        <span className="ribbon-in">
          👕 Couple Matching Shirts · <b>Design Together &amp; Ship to Both Cities</b> · $38 Twin-Pack
        </span>
      </div>

      {/* Top Navbar */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link className="btn btn-ghost" href="/shop" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Keepsakes Shop ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '980px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Design Studio for Two</span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '8px 0' }}>
            Design <span className="grad">Matching Shirts</span> Together
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '54ch', margin: '0 auto' }}>
            A shared canvas where both of you place text, doodles, and date stamps. Order a twin-pack that ships to both your addresses worldwide.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Left: Interactive T-Shirt Preview Mockup */}
          <div className="booth-box" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
              <button
                className={`btn ${viewSide === 'FRONT' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewSide('FRONT')}
                style={{ padding: '4px 14px', fontSize: '12px' }}
              >
                Front View
              </button>
              <button
                className={`btn ${viewSide === 'BACK' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewSide('BACK')}
                style={{ padding: '4px 14px', fontSize: '12px' }}
              >
                Back View
              </button>
            </div>

            {/* Mockup Shirt Container */}
            <div
              style={{
                position: 'relative',
                width: '280px',
                height: '320px',
                margin: '0 auto',
                background: selectedColor.hex,
                borderRadius: '24px 24px 8px 8px',
                border: '2px solid var(--line)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                color: selectedColor.textHex,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Collar detail */}
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '90px',
                  height: '24px',
                  borderBottom: `2px solid ${selectedColor.textHex}`,
                  borderRadius: '0 0 50px 50px',
                  opacity: 0.3,
                }}
              />

              {viewSide === 'FRONT' ? (
                <>
                  <div style={{ fontSize: '36px', marginBottom: '8px', display: 'flex', gap: '6px' }}>
                    {placedStickers.map((stk, i) => (
                      <span key={i} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
                        {stk}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '15px',
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                    }}
                  >
                    {customText}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      opacity: 0.7,
                      marginTop: '6px',
                      letterSpacing: '.15em',
                    }}
                  >
                    EST. {new Date().getFullYear()} · 10,840 KM
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', letterSpacing: '.1em' }}>
                    ANGIE
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>
                    ROOM: KX7RM · NO DISTANCE TOO FAR
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              100% Heavyweight Organic Cotton (240 GSM) · Screen Printed
            </div>
          </div>

          {/* Right: Studio Customizer Controls */}
          <div className="booth-box">
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '18px' }}>Customize Your Twin-Pack</h3>

            {/* Shirt Color Swatches */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--ink-soft)' }}>
                Fabric Color:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SHIRT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: selectedColor.id === c.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                      background: c.hex,
                      color: c.textHex,
                      fontSize: '12px',
                      fontWeight: 700,
                      boxShadow: selectedColor.id === c.id ? 'var(--shadow)' : 'none',
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Lettering */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                Custom Print Text:
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={30}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '15px',
                }}
              />
            </div>

            {/* Add Cute Icons */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--ink-soft)' }}>
                Add Badges &amp; Doodles:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SHIRT_EMOJIS.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => addSticker(emoji)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontSize: '18px',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
                {placedStickers.length > 0 && (
                  <button
                    onClick={() => setPlacedStickers([])}
                    style={{ padding: '0 10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'none', fontSize: '11px', color: 'var(--ink-soft)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Sizes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--pink)' }}>
                  Mia&apos;s Size (Calgary):
                </label>
                <select
                  value={shirtSizeP1}
                  onChange={(e) => setShirtSizeP1(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 700 }}
                >
                  {['XS', 'S', 'M', 'L', 'XL', '2XL'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--blue)' }}>
                  Alex&apos;s Size (Jakarta):
                </label>
                <select
                  value={shirtSizeP2}
                  onChange={(e) => setShirtSizeP2(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontWeight: 700 }}
                >
                  {['XS', 'S', 'M', 'L', 'XL', '2XL'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Price & Actions */}
            <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900 }}>$38.00 USD</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Includes 2 matching heavyweight shirts</div>
                </div>
                <span className="badge hot">Free Split Shipping</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-grad" onClick={() => setOrderModalOpen(true)} style={{ flex: 1, justifyContent: 'center' }}>
                Order Matching Twin-Pack 🛍️
              </button>
              <button className="btn btn-ghost" onClick={copyDesignLink}>
                {copied ? '✓ Copied' : 'Share 🔗'}
              </button>
            </div>
          </div>
        </div>

        {/* Order Modal */}
        {orderModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px' }}>
            <div className="booth-box" style={{ maxWidth: '480px', width: '100%', padding: '28px', background: 'var(--paper-raised)' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Complete Your Shirt Order</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', marginBottom: '18px' }}>
                Enter both shipping addresses so the twin-pack delivers straight to both of your doors.
              </p>
              <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                <input placeholder="Partner 1 Address (e.g. Calgary, Canada)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }} />
                <input placeholder="Partner 2 Address (e.g. Jakarta, Indonesia)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-grad" onClick={() => alert('Order simulated! Thank you for supporting Angie keepsakes.')} style={{ flex: 1, justifyContent: 'center' }}>
                  Proceed to Payment ($38) ▷
                </button>
                <button className="btn btn-ghost" onClick={() => setOrderModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

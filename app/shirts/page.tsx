'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Confetti, CoupleNameBar, ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

const SHIRT_COLORS = [
  { id: 'vintage-white', name: 'Vintage Cream', hex: '#F7F5F0', textHex: '#1E1E24' },
  { id: 'washed-charcoal', name: 'Washed Charcoal', hex: '#26262B', textHex: '#F8F9FB' },
  { id: 'blush-pink', name: 'Blush Rose', hex: '#FDECEF', textHex: '#3D2A30' },
  { id: 'sky-blue', name: 'Sky Harbor', hex: '#E8F1F8', textHex: '#223843' },
  { id: 'matcha', name: 'Matcha Sage', hex: '#E9EFE6', textHex: '#2B3A28' },
  { id: 'midnight-navy', name: 'Midnight Navy', hex: '#161E2E', textHex: '#ECEFF4' },
];

const SHIRT_EMOJIS = ['🫰', '💖', '✨', '☕', '✈️', '🌏', '🍕', '🧸', '🌸', '💌', '🎬', '🍜'];

const MOTIF_TEMPLATES = [
  { label: 'Player 1 & Player 2', a: 'PLAYER 1', b: 'PLAYER 2', icon: '🎮' },
  { label: 'Long Distance Coordinates', a: 'HERE WITH YOU', b: 'ALWAYS WITH YOU', icon: '✈️' },
  { label: 'Coffee & Tea Ritual', a: 'COFFEE ENTHUSIAST', b: 'TEA DEVOTEE', icon: '☕' },
  { label: 'Our City Haven', a: 'HOME IN MY HEART', b: 'SAFE IN YOUR ARMS', icon: '🏡' },
];

export default function ShirtsStudioPage() {
  const { partnerA, partnerB, cityA, cityB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [colorA, setColorA] = useState(SHIRT_COLORS[0]);
  const [colorB, setColorB] = useState(SHIRT_COLORS[1]);
  const [textA, setTextA] = useState(`${partnerA.toUpperCase()} ♡ ${cityA || 'HOME'}`);
  const [textB, setTextB] = useState(`${partnerB.toUpperCase()} ♡ ${cityB || 'AWAY'}`);
  const [stickersA, setStickersA] = useState<string[]>(['🫰', '💖']);
  const [stickersB, setStickersB] = useState<string[]>(['✈️', '💖']);
  const [viewSide, setViewSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [confettiActive, setConfettiActive] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-shirts` : 'local-shirts',
    activityType: 'shirts',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { viewSide },
  });
  const isLivePair = runtime.transportName !== 'mock';
  const shirtSnapshot = runtime.snapshot as {
    colorA?: string; colorB?: string; textA?: string; textB?: string;
    stickersA?: string[]; stickersB?: string[]; view?: 'front' | 'back';
    revision?: number; approvedRevisionA?: number | null; approvedRevisionB?: number | null; completed?: boolean;
  };

  useEffect(() => {
    if (shirtSnapshot.colorA) setColorA(SHIRT_COLORS.find((color) => color.hex === shirtSnapshot.colorA) || colorA);
    if (shirtSnapshot.colorB) setColorB(SHIRT_COLORS.find((color) => color.hex === shirtSnapshot.colorB) || colorB);
    if (shirtSnapshot.textA) setTextA(shirtSnapshot.textA);
    if (shirtSnapshot.textB) setTextB(shirtSnapshot.textB);
    if (shirtSnapshot.stickersA) setStickersA(shirtSnapshot.stickersA);
    if (shirtSnapshot.stickersB) setStickersB(shirtSnapshot.stickersB);
    if (shirtSnapshot.view) setViewSide(shirtSnapshot.view.toUpperCase() as 'FRONT' | 'BACK');
  }, [runtime.snapshot]);

  const updateDesign = (updates: Record<string, unknown>) => {
    void runtime.sendEvent('shirts_design_update', { updates });
  };

  const applyMotif = (motif: typeof MOTIF_TEMPLATES[0]) => {
    if (isLivePair) return;
    sounds.playPop();
    setTextA(motif.a);
    setTextB(motif.b);
    updateDesign({ textA: motif.a, textB: motif.b });
  };

  const addStickerToShirt = (shirt: 'A' | 'B', s: string) => {
    sounds.playTick();
    if (shirt === 'A' && stickersA.length < 5) {
      const next = [...stickersA, s]; setStickersA(next); updateDesign({ stickersA: next });
    }
    if (shirt === 'B' && stickersB.length < 5) {
      const next = [...stickersB, s]; setStickersB(next); updateDesign({ stickersB: next });
    }
  };

  const removeSticker = (shirt: 'A' | 'B', idx: number) => {
    sounds.playPop();
    if (shirt === 'A') { const next = stickersA.filter((_, i) => i !== idx); setStickersA(next); updateDesign({ stickersA: next }); }
    if (shirt === 'B') { const next = stickersB.filter((_, i) => i !== idx); setStickersB(next); updateDesign({ stickersB: next }); }
  };

  const buildShirtsCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 4500;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Artwork rendering is unavailable in this browser.');
    ctx.scale(3.75, 3.75);
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, 1200, 800);

    ctx.fillStyle = '#17181C';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEARLY US · MATCHING COUPLE SHIRTS', 600, 60);

    renderShirtSilhouette(ctx, 320, 420, colorA.hex, colorA.textHex, textA, stickersA, partnerA);
    renderShirtSilhouette(ctx, 880, 420, colorB.hex, colorB.textHex, textB, stickersB, partnerB);

    ctx.fillStyle = '#8B8E98';
    ctx.font = '13px monospace';
    ctx.fillText(`DESIGNED BY ${partnerA.toUpperCase()} & ${partnerB.toUpperCase()} · [${viewSide} VIEW]`, 600, 750);
    return canvas;
  };

  const canvasBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the shirt artwork.')), 'image/png'),
    );

  const handleExportPNG = async () => {
    sounds.playCelebration();
    setConfettiActive(true);
    const canvas = buildShirtsCanvas();
    const blob = await canvasBlob(canvas);
    const link = document.createElement('a');
    link.download = `dearly-us-matching-shirts-${Date.now()}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  const renderShirtSilhouette = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    fillHex: string,
    textHex: string,
    customTitle: string,
    stickers: string[],
    ownerName: string
  ) => {
    ctx.save();
    ctx.translate(cx - 200, cy - 260);

    ctx.fillStyle = fillHex;
    ctx.strokeStyle = '#17181C';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(130, 40);
    ctx.lineTo(80, 90);
    ctx.lineTo(30, 140);
    ctx.lineTo(80, 180);
    ctx.lineTo(110, 150);
    ctx.lineTo(110, 480);
    ctx.lineTo(290, 480);
    ctx.lineTo(290, 150);
    ctx.lineTo(320, 180);
    ctx.lineTo(370, 140);
    ctx.lineTo(320, 90);
    ctx.lineTo(270, 40);
    ctx.quadraticCurveTo(200, 90, 130, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Collar
    ctx.beginPath();
    ctx.arc(200, 40, 40, 0, Math.PI);
    ctx.stroke();

    // Text
    ctx.fillStyle = textHex;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(customTitle.toUpperCase(), 200, 220);

    // Owner tag
    ctx.font = '11px sans-serif';
    ctx.fillText(`FOR: ${ownerName.toUpperCase()}`, 200, 245);

    // Stickers
    ctx.font = '28px sans-serif';
    stickers.forEach((stk, idx) => {
      const sx = 160 + (idx % 3) * 40;
      const sy = 300 + Math.floor(idx / 3) * 45;
      ctx.fillText(stk, sx, sy);
    });

    ctx.restore();
  };

  const handleSaveToKeepsakes = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      const artwork = await canvasBlob(buildShirtsCanvas());
      await saveKeepsake({
        kind: 'activity',
        title: `Matching Couple Shirts · ${textA} / ${textB}`,
        file: artwork,
        activityPath: '/shirts',
        caption: `Custom DIY shirt designs created in paired mini studio.`,
        metadata: {
          activityType: 'shirts',
          colorA: colorA.name,
          colorB: colorB.name,
          textA,
          textB,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save shirts keepsake:', err);
    }
  };

  return (
    <ActivityShell
      activityTitle="Matching Shirts Studio"
      activitySubtitle="Paired Mini Studio · Side-by-Side Canvas, Shared Motifs & DIY Artwork"
      currentStage={keepsakeSaved ? 'remember' : 'play'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Couple Shirts · ${colorA.name} & ${colorB.name}`,
        subtitle: `${textA.slice(0, 15)} / ${textB.slice(0, 15)}`,
        badge: '👕 DESIGNS READY',
      }}
      guidancePhase={keepsakeSaved ? 'completed' : 'ready'}
      guidancePrivacyNote="Both partners design complementary or matching shirts in a synchronized creative studio."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '16px 0 40px' }}>
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
            Matching <span className="grad">Shirts Studio</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '54ch', margin: '0 auto' }}>
            Design customized his &amp; hers matching shirts side-by-side with shared motifs, colorways, and downloadable DIY artwork.
          </p>
        </div>

        {/* Motifs Ribbon */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          {MOTIF_TEMPLATES.map((m, i) => (
            <button
              key={i}
              onClick={() => applyMotif(m)}
              disabled={isLivePair}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                background: '#FFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Front / Back View Switcher & Action Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
            padding: '10px 18px',
            background: 'var(--paper-raised)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setViewSide('FRONT'); void runtime.sendEvent('shirts_view_switch', { view: 'front' }); }}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                border: viewSide === 'FRONT' ? '2px solid #17181C' : '1px solid var(--line)',
                background: viewSide === 'FRONT' ? '#17181C' : '#FFF',
                color: viewSide === 'FRONT' ? '#FFF' : 'var(--ink)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Front View
            </button>
            <button
              onClick={() => { setViewSide('BACK'); void runtime.sendEvent('shirts_view_switch', { view: 'back' }); }}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                border: viewSide === 'BACK' ? '2px solid #17181C' : '1px solid var(--line)',
                background: viewSide === 'BACK' ? '#17181C' : '#FFF',
                color: viewSide === 'BACK' ? '#FFF' : 'var(--ink)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back View
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => void runtime.sendEvent('shirts_approve', {
                revision: shirtSnapshot.revision || 0,
                isA: runtime.isHost,
              })}
              className="btn btn-outline"
              style={{ padding: '7px 16px', fontSize: '12.5px' }}
            >
              {shirtSnapshot.completed ? '✓ Both Approved' : 'Approve My Design'}
            </button>
            <button
              onClick={handleExportPNG}
              disabled={isLivePair && !shirtSnapshot.completed}
              className="btn btn-outline"
              style={{ padding: '7px 16px', fontSize: '12.5px' }}
            >
              📥 Export Dual PNG
            </button>
            <button
              onClick={handleSaveToKeepsakes}
              disabled={keepsakeSaved || keepsakeSaving}
              className="btn btn-primary"
              style={{ padding: '7px 18px', fontSize: '12.5px' }}
            >
              {keepsakeSaved ? '✓ Saved to Keepsakes!' : keepsakeSaving ? 'Archiving...' : '💾 Save to Keepsakes'}
            </button>
          </div>
        </div>

        {/* SIDE-BY-SIDE SHIRTS STUDIO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {/* SHIRT A */}
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1.5px solid #FFD6E8',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--pink)' }}>
                🌸 {partnerA}&apos;s Shirt
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                {colorA.name}
              </span>
            </div>

            {/* Color Palette */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {SHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setColorA(c); updateDesign({ colorA: c.hex }); }}
                  disabled={isLivePair && !runtime.isHost}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: colorA.id === c.id ? '2px solid #17181C' : '1px solid #CCC',
                    boxShadow: colorA.id === c.id ? '0 0 0 2px var(--pink)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            {/* Custom Slogan Input */}
            <input
              type="text"
              value={textA}
              onChange={(e) => { setTextA(e.target.value); updateDesign({ textA: e.target.value }); }}
              disabled={isLivePair && !runtime.isHost}
              placeholder="Slogan on shirt..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '12.5px',
                marginBottom: '14px',
              }}
            />

            {/* Shirt Canvas Preview */}
            <div
              style={{
                height: '320px',
                background: colorA.hex,
                color: colorA.textHex,
                borderRadius: '16px',
                border: '2px solid #17181C',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                position: 'relative',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ width: '60px', height: '24px', borderBottom: '2px solid rgba(0,0,0,0.3)', borderRadius: '0 0 50% 50%', position: 'absolute', top: '10px' }} />
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.6, marginBottom: '6px' }}>
                [{viewSide} VIEW]
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, textAlign: 'center', letterSpacing: '0.05em' }}>
                {textA.toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {stickersA.map((stk, idx) => (
                  <span
                    key={idx}
                    onClick={() => (!isLivePair || runtime.isHost) && removeSticker('A', idx)}
                    aria-disabled={isLivePair && !runtime.isHost}
                    title="Click to remove"
                    style={{ fontSize: '24px', cursor: 'pointer' }}
                  >
                    {stk}
                  </span>
                ))}
              </div>
            </div>

            {/* Sticker Adder */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
              {SHIRT_EMOJIS.slice(0, 6).map((stk) => (
                <button
                  key={stk}
                  onClick={() => addStickerToShirt('A', stk)}
                  disabled={isLivePair && !runtime.isHost}
                  style={{ background: '#FFF', border: '1px solid var(--line)', borderRadius: '6px', padding: '4px 8px', fontSize: '14px', cursor: 'pointer' }}
                >
                  {stk}
                </button>
              ))}
            </div>
          </div>

          {/* SHIRT B */}
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1.5px solid #D6E8FF',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--blue)' }}>
                💙 {partnerB}&apos;s Shirt
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                {colorB.name}
              </span>
            </div>

            {/* Color Palette */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {SHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setColorB(c); updateDesign({ colorB: c.hex }); }}
                  disabled={isLivePair && runtime.isHost}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: colorB.id === c.id ? '2px solid #17181C' : '1px solid #CCC',
                    boxShadow: colorB.id === c.id ? '0 0 0 2px var(--blue)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            {/* Custom Slogan Input */}
            <input
              type="text"
              value={textB}
              onChange={(e) => { setTextB(e.target.value); updateDesign({ textB: e.target.value }); }}
              disabled={isLivePair && runtime.isHost}
              placeholder="Slogan on shirt..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '12.5px',
                marginBottom: '14px',
              }}
            />

            {/* Shirt Canvas Preview */}
            <div
              style={{
                height: '320px',
                background: colorB.hex,
                color: colorB.textHex,
                borderRadius: '16px',
                border: '2px solid #17181C',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                position: 'relative',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ width: '60px', height: '24px', borderBottom: '2px solid rgba(0,0,0,0.3)', borderRadius: '0 0 50% 50%', position: 'absolute', top: '10px' }} />
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.6, marginBottom: '6px' }}>
                [{viewSide} VIEW]
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, textAlign: 'center', letterSpacing: '0.05em' }}>
                {textB.toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {stickersB.map((stk, idx) => (
                  <span
                    key={idx}
                    onClick={() => (!isLivePair || !runtime.isHost) && removeSticker('B', idx)}
                    title="Click to remove"
                    style={{ fontSize: '24px', cursor: 'pointer' }}
                  >
                    {stk}
                  </span>
                ))}
              </div>
            </div>

            {/* Sticker Adder */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
              {SHIRT_EMOJIS.slice(0, 6).map((stk) => (
                <button
                  key={stk}
                  onClick={() => addStickerToShirt('B', stk)}
                  disabled={isLivePair && runtime.isHost}
                  style={{ background: '#FFF', border: '1px solid var(--line)', borderRadius: '6px', padding: '4px 8px', fontSize: '14px', cursor: 'pointer' }}
                >
                  {stk}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ActivityShell>
  );
}

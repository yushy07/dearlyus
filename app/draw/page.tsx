'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF7BA3');
  const [brushSize, setBrushSize] = useState(4);
  const [prompt] = useState('Draw: Our Dream Sunset Date 🌅');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
          <Link className="btn btn-ghost" href="/activity">
            Activities ▷
          </Link>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '780px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="eyebrow">Draw Together · Live Dual Canvas</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            Same prompt, <span className="grad">two canvases</span>.
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

          {/* HTML5 Canvas */}
          <div style={{ border: '2px solid var(--line)', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={440}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              ✏️ Drawing with {color === '#FF7BA3' ? 'Mia (Pink)' : 'Alex (Blue)'}
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

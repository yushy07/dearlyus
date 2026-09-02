import React, { useState } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import { CoupleNameBar } from '@/components/shared';

interface VisionItem {
  id: string;
  category: string;
  title: string;
  emoji: string;
}

const VISION_ELEMENTS: VisionItem[] = [
  { id: '1', category: 'Home', title: 'Cozy Loft with Big Windows', emoji: '🏡' },
  { id: '2', category: 'Pets', title: 'Fluffy Golden Retriever', emoji: '🐕' },
  { id: '3', category: 'Travel', title: 'Cherry Blossom Trip in Japan', emoji: '🌸' },
  { id: '4', category: 'Milestone', title: 'Sunset Beach Wedding', emoji: '💍' },
  { id: '5', category: 'Ritual', title: 'Sunday Morning Coffee & Vinyls', emoji: '☕' },
  { id: '6', category: 'Career', title: 'Both Working in Same City', emoji: '💼' },
  { id: '7', category: 'Travel', title: 'Euro-rail Summer Roadtrip', emoji: '🚆' },
  { id: '8', category: 'Home', title: 'Big Plant Balcony with Fairy Lights', emoji: '🌿' },
];

export default function FuturePage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [boardItems, setBoardItems] = useState<VisionItem[]>([
    VISION_ELEMENTS[0],
    VISION_ELEMENTS[1],
    VISION_ELEMENTS[2],
  ]);
  const [customGoal, setCustomGoal] = useState('');
  const [saved, setSaved] = useState(false);

  const addItem = (item: VisionItem) => {
    if (!boardItems.find((b) => b.id === item.id)) {
      setBoardItems([...boardItems, item]);
    }
  };

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    const newItem: VisionItem = {
      id: Date.now().toString(),
      category: 'Custom',
      title: customGoal,
      emoji: '✨',
    };
    setBoardItems([...boardItems, newItem]);
    setCustomGoal('');
  };

  const removeItem = (id: string) => {
    setBoardItems(boardItems.filter((b) => b.id !== id));
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

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '860px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <CoupleNameBar />
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '10px' }}>
            Design your future <span className="grad">together</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Pick and pin your dreams — homes, travel, pets, milestones — into a shared scrapbook vision board.
          </p>
        </div>

        {/* Vision Board Container */}
        <div
          style={{
            background: '#FFFFFF',
            border: '2px solid var(--line)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '32px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{partnerA} &amp; {partnerB}&apos;s Life Vision</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
              {boardItems.length} Dreams Pinned
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
              minHeight: '220px',
              background: 'var(--paper)',
              borderRadius: '14px',
              padding: '20px',
              border: '1px dashed var(--line)',
            }}
          >
            {boardItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'var(--shadow-soft)',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    border: 'none',
                    background: 'none',
                    fontSize: '12px',
                    color: 'var(--ink-soft)',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.emoji}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {item.category}
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0 0' }}>{item.title}</h4>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-grad" onClick={() => setSaved(true)}>
              {saved ? '✓ Saved to Shared Album!' : 'Save Vision Board 💾'}
            </button>
          </div>
        </div>

        {/* Add Ideas Shelf */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '14px' }}>Ideas to pin to your board:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            {VISION_ELEMENTS.map((el) => (
              <button
                key={el.id}
                onClick={() => addItem(el)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>{el.emoji}</span>
                <span>{el.title}</span>
                <span style={{ color: 'var(--pink)', fontWeight: 800 }}>+</span>
              </button>
            ))}
          </div>

          <form onSubmit={addCustom} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Type your own custom milestone (e.g. Move in together next July)..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontFamily: 'inherit',
              }}
            />
            <button type="submit" className="btn btn-primary">
              Add Goal +
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

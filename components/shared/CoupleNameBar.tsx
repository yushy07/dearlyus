'use client';

import React, { useState } from 'react';
import { useCoupleProfile } from '@/lib/couple';
import { sounds } from '@/lib/sound';

export function CoupleNameBar() {
  const { partnerA, partnerB, cityA, cityB, updateProfile } = useCoupleProfile();
  const [editing, setEditing] = useState(false);
  const [nameA, setNameA] = useState(partnerA);
  const [nameB, setNameB] = useState(partnerB);

  const handleOpen = () => {
    sounds.playPop();
    setNameA(partnerA);
    setNameB(partnerB);
    setEditing(true);
  };

  const handleSave = () => {
    sounds.playCelebration();
    updateProfile({ partnerA: nameA, partnerB: nameB });
    setEditing(false);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
      <button
        onClick={handleOpen}
        className="btn"
        style={{
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'var(--paper-raised)',
          border: '1px solid var(--line)',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--ink)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
        title="Click to customize names for both players"
      >
        <span style={{ color: 'var(--pink)' }}>🌸 {partnerA}</span>
        <span style={{ color: 'var(--ink-soft)' }}>&amp;</span>
        <span style={{ color: 'var(--blue)' }}>💙 {partnerB}</span>
        <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '2px' }}>✏️ Edit</span>
      </button>

      {editing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px 24px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              textAlign: 'left',
              animation: 'gl-rise 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '17px' }}>Customize Couple Names</div>
              <button
                onClick={() => setEditing(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '18px', lineHeight: 1.4 }}>
              Enter your real names so Cupidot, the quizzes, court trials, and photostrips are 100% personalized to you two!
            </p>

            <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--pink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Player 1 Name:
                </label>
                <input
                  type="text"
                  value={nameA}
                  onChange={(e) => setNameA(e.target.value)}
                  placeholder="e.g. Sarah"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Player 2 Name:
                </label>
                <input
                  type="text"
                  value={nameB}
                  onChange={(e) => setNameB(e.target.value)}
                  placeholder="e.g. David"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} className="btn btn-grad" style={{ flex: 1, justifyContent: 'center' }}>
                Save Names ✨
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-ghost" style={{ padding: '0 16px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

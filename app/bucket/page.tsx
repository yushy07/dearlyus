'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar, Confetti } from '@/components/shared';
import { sounds } from '@/lib/sound';

interface BucketDate {
  id: number;
  title: string;
  category: 'Virtual' | 'Reunion' | 'Adventure' | 'Food';
  icon: string;
  completed: boolean;
  completedDate?: string;
}

export default function BucketListPage() {
  const [dates, setDates] = useState<BucketDate[]>([
    { id: 1, title: 'Take a 4-cut 인생네컷 photostrip on Angie', category: 'Virtual', icon: '📸', completed: true, completedDate: 'Aug 14, 2026' },
    { id: 2, title: 'Cook the exact same recipe in two kitchens', category: 'Food', icon: '🍝', completed: true, completedDate: 'Aug 20, 2026' },
    { id: 3, title: 'Sleep on FaceTime the entire night until sunrise', category: 'Virtual', icon: '😴', completed: true, completedDate: 'Aug 28, 2026' },
    { id: 4, title: 'Airport sprint hug at the arrival terminal gate', category: 'Reunion', icon: '✈️', completed: false },
    { id: 5, title: 'Walk 25,000 steps together exploring Tokyo/Seoul', category: 'Adventure', icon: '⛩️', completed: false },
    { id: 6, title: 'Watch a sunset in person holding hands', category: 'Reunion', icon: '🌅', completed: false },
    { id: 7, title: 'Build our 3-year future home vision board', category: 'Virtual', icon: '🏡', completed: false },
    { id: 8, title: 'Wear our matching twin-pack couple shirts', category: 'Reunion', icon: '👕', completed: false },
    { id: 9, title: 'Eat street food at 2am in a foreign city', category: 'Food', icon: '🍢', completed: false },
    { id: 10, title: 'Seal a 5-year time capsule letter to open later', category: 'Virtual', icon: '💌', completed: false },
    { id: 11, title: 'Rent a cozy mountain cabin with a private hot tub', category: 'Adventure', icon: '🏔️', completed: false },
    { id: 12, title: 'Grocery shop together holding hands on a Tuesday', category: 'Reunion', icon: '🛒', completed: false },
  ]);

  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Virtual' | 'Reunion' | 'Adventure' | 'Food'>('All');
  const [confettiActive, setConfettiActive] = useState(false);

  const toggleDate = (id: number) => {
    const updated = dates.map((d) => {
      if (d.id === id) {
        const nextState = !d.completed;
        if (nextState) {
          sounds.playCelebration();
          setConfettiActive(true);
          setTimeout(() => setConfettiActive(false), 2500);
        }
        return {
          ...d,
          completed: nextState,
          completedDate: nextState ? new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
        };
      }
      return d;
    });
    setDates(updated);
  };

  const filtered = selectedFilter === 'All' ? dates : dates.filter((d) => d.category === selectedFilter);
  const completedCount = dates.filter((d) => d.completed).length;
  const progressPercent = Math.round((completedCount / dates.length) * 100);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>🎯 100 Dates Bucket List &amp; Scratch-Off Map · <b>Milestones for LDR &amp; Beyond</b></>} />
      <Confetti active={confettiActive} />

      <Navbar
        rightAction={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              background: 'var(--paper-raised)',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
            }}
          >
            Completed: <b>{completedCount} / {dates.length}</b> ({progressPercent}%)
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Our Shared Journey</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, margin: '8px 0' }}>
            100 Dates <span className="grad">Scratch-Off Checklist</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '52ch', margin: '0 auto' }}>
            From late-night video dates across the ocean to the first grocery run together after closing the distance.
          </p>
        </div>

        {/* Progress Bar Card */}
        <div className="booth-box" style={{ padding: '24px 28px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '15px' }}>Couple Bucket List Progress</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--pink)', fontSize: '16px' }}>
              {progressPercent}% Complete
            </span>
          </div>
          <div style={{ width: '100%', height: '12px', background: 'var(--paper)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--pink), var(--blue))',
                borderRadius: '6px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
          {['All', 'Virtual', 'Reunion', 'Adventure', 'Food'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat as any)}
              className={`btn ${selectedFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              {cat === 'Virtual' ? '💻 Virtual Dates' : cat === 'Reunion' ? '✈️ Reunion Milestones' : cat === 'Adventure' ? '🌲 Outdoor Adventures' : cat === 'Food' ? '🍜 Cooking & Food' : '✨ All Dates'}
            </button>
          ))}
        </div>

        {/* Dates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((d) => (
            <div
              key={d.id}
              onClick={() => toggleDate(d.id)}
              style={{
                background: d.completed ? '#FFF5F8' : '#FFFFFF',
                border: d.completed ? '2px solid var(--pink)' : '1px solid var(--line)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '32px', flexShrink: 0 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="badge" style={{ fontSize: '10px', background: 'var(--paper)', color: 'var(--ink-soft)' }}>
                    {d.category}
                  </span>
                  {d.completed && (
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', fontWeight: 800 }}>
                      ✓ {d.completedDate}
                    </span>
                  )}
                </div>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    margin: '6px 0 0',
                    lineHeight: 1.35,
                    textDecoration: d.completed ? 'line-through' : 'none',
                    color: d.completed ? 'var(--pink)' : 'var(--ink)',
                  }}
                >
                  {d.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { generateBucketDate, GeneratedBucketIdea } from '@/lib/cupidot';

export interface BucketDateItem {
  id: string;
  title: string;
  category: 'At Home' | 'Online' | 'Outside' | 'Creative' | 'Food' | 'Travel' | 'Reunion' | 'Low Energy';
  icon: string;
  status: 'wishlist' | 'planned' | 'done';
  isFavourited?: boolean;
  isRevealed?: boolean;
  note?: string;
  completedDate?: string;
}

const INITIAL_100_DATES: BucketDateItem[] = [
  { id: '1', title: 'Take a vintage 4-cut 인생네컷 photostrip on Dearly Us', category: 'Online', icon: '📸', status: 'done', isRevealed: true, completedDate: 'Aug 14, 2026', note: 'We put on our matching hats!' },
  { id: '2', title: 'Cook the exact same carbonara recipe in two kitchens', category: 'Food', icon: '🍝', status: 'done', isRevealed: true, completedDate: 'Aug 20, 2026', note: 'Both smelled like garlic heaven.' },
  { id: '3', title: 'Sleep on FaceTime the entire night until the sun comes up', category: 'Online', icon: '😴', status: 'done', isRevealed: true, completedDate: 'Aug 28, 2026' },
  { id: '4', title: 'Airport sprint hug at the arrival terminal gate', category: 'Reunion', icon: '✈️', status: 'planned', isRevealed: true },
  { id: '5', title: 'Explore a foreign night market and eat street skewers at 1am', category: 'Travel', icon: '🍢', status: 'wishlist', isRevealed: false },
  { id: '6', title: 'Watch a golden hour sunset holding hands in person', category: 'Outside', icon: '🌅', status: 'planned', isRevealed: true },
  { id: '7', title: 'Build our 3-year future apartment vision board', category: 'Creative', icon: '🏡', status: 'done', isRevealed: true, completedDate: 'Sep 02, 2026' },
  { id: '8', title: 'Wear our matching DIY twin couple shirts outside', category: 'Reunion', icon: '👕', status: 'wishlist', isRevealed: false },
  { id: '9', title: 'Rent a quiet forest cabin with a hot tub and starry night', category: 'Travel', icon: '🏔️', status: 'wishlist', isRevealed: false },
  { id: '10', title: 'Seal a 5-year wax-sealed time capsule letter to open later', category: 'Creative', icon: '💌', status: 'planned', isRevealed: true },
  { id: '11', title: 'Walk 20,000 steps together exploring hidden alleyways', category: 'Outside', icon: '👟', status: 'wishlist', isRevealed: false },
  { id: '12', title: 'Grocery shop together on a sleepy Tuesday afternoon', category: 'Reunion', icon: '🛒', status: 'planned', isRevealed: true },
  { id: '13', title: 'Silent co-reading date with tea and gentle jazz music', category: 'Low Energy', icon: '📖', status: 'wishlist', isRevealed: true },
  { id: '14', title: 'Bake cookies from scratch on camera and taste test together', category: 'At Home', icon: '🍪', status: 'wishlist', isRevealed: false },
  { id: '15', title: 'Send surprise care packages that can only be opened on call', category: 'Online', icon: '📦', status: 'done', isRevealed: true, completedDate: 'Sep 05, 2026' },
  { id: '16', title: 'Spend an entire rainy afternoon doing absolutely nothing in bed', category: 'Low Energy', icon: '🌧️', status: 'wishlist', isRevealed: false },
];

export default function BucketListPage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [dates, setDates] = useState<BucketDateItem[]>(INITIAL_100_DATES);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [currentStage, setCurrentStage] = useState<'ready' | 'play' | 'remember'>('play');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<BucketDateItem['category']>('At Home');
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [cupidotIdea, setCupidotIdea] = useState<GeneratedBucketIdea | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { saveKeepsake, isSaving } = useKeepsakeWriter();
  const runtime = useActivityRuntime({
    activityType: 'bucket',
    transportMode: 'auto',
  });

  const completedCount = dates.filter((d) => d.status === 'done').length;
  const plannedCount = dates.filter((d) => d.status === 'planned').length;

  const toggleStatus = (id: string) => {
    sounds.playCelebration();
    setDates((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'done' ? 'wishlist' : 'done';
          return {
            ...d,
            status: nextStatus,
            completedDate: nextStatus === 'done' ? new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
          };
        }
        return d;
      }),
    );
    runtime.dispatch({
      type: 'bucket_status_change',
      payload: { id, isCompleted: true },
    });
  };

  const togglePlanned = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    setDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: d.status === 'planned' ? 'wishlist' : 'planned' } : d)),
    );
  };

  const toggleFavourite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    setDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isFavourited: !d.isFavourited } : d)),
    );
  };

  const revealScratch = (id: string) => {
    sounds.playPop();
    setDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isRevealed: true } : d)),
    );
    runtime.dispatch({
      type: 'bucket_scratch_reveal',
      payload: { id },
    });
  };

  const handleAskCupidot = () => {
    sounds.playPop();
    const idea = generateBucketDate(dates.map((d) => d.title));
    setCupidotIdea(idea);
    setIdeaModalOpen(true);
  };

  const handleAddCupidotIdea = () => {
    if (!cupidotIdea) return;
    sounds.playCelebration();
    const newItem: BucketDateItem = {
      id: Date.now().toString(),
      title: cupidotIdea.title,
      category: cupidotIdea.category as any,
      icon: cupidotIdea.icon,
      status: 'wishlist',
      isRevealed: true,
    };
    setDates([newItem, ...dates]);
    setIdeaModalOpen(false);
  };

  const handleAddCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    sounds.playPop();
    const newItem: BucketDateItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      icon: '✨',
      status: 'wishlist',
      isRevealed: true,
    };
    setDates([newItem, ...dates]);
    setNewTitle('');
  };

  const handleSaveCertificate = async () => {
    sounds.playCelebration();
    const success = await saveKeepsake({
      kind: 'activity',
      title: `100 Dates Bucket Passport · ${completedCount} Dates Fulfilled`,
      subtitle: `${partnerA} & ${partnerB} · ${plannedCount} upcoming planned dates`,
      metadata: {
        activityType: 'bucket',
        completedCount,
        totalDates: dates.length,
        partnerA,
        partnerB,
        completedList: dates.filter((d) => d.status === 'done').map((d) => ({ title: d.title, date: d.completedDate, note: d.note })),
      },
    });
    if (success) {
      setSaveSuccess(true);
      setCurrentStage('remember');
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  const filtered = selectedFilter === 'All' ? dates : dates.filter((d) => d.category === selectedFilter);

  return (
    <ActivityShell
      activityTitle="100 Dates Bucket List"
      activitySubtitle={`Dream, shortlist, and scratch off dates for ${partnerA} & ${partnerB}`}
      currentStage={currentStage}
      partnerPresence={runtime.partnerPresence}
      roomCode={runtime.roomId}
      isHost={runtime.isHost}
      stageIndicator="Discover → Scratch & Plan → Fulfill → Passport Keepsake"
      guidancePhase="browsing"
      guidancePrivacyNote="Your bucket list and completed dates are synced privately between you two."
      keepsakeSummary={{
        kind: 'activity',
        title: '100 Dates Bucket Passport',
        subtitle: `${completedCount} of ${dates.length} dreams fulfilled`,
        badge: 'Bucket List',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Progress & Milestone Header Card */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '24px',
            padding: '28px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <span className="badge hot" style={{ fontSize: '11.5px' }}>
              Couple Memories Tracker
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 4px' }}>
              {completedCount} of {dates.length} Adventures Fulfilled
            </h2>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-soft)' }}>
              {plannedCount} dates currently shortlisted for our next date night or reunion.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAskCupidot}
              className="btn btn-ghost"
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>✨</span>
              Cupidot Date Generator
            </button>
            <button
              onClick={handleSaveCertificate}
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved to Our Space! 💖' : 'Save Passport to Our Space'}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['All', 'Online', 'Food', 'Outside', 'Creative', 'Travel', 'Reunion', 'Low Energy'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`btn ${selectedFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: '12.5px', whiteSpace: 'nowrap', borderRadius: '20px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Date Ticket Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {filtered.map((item) => {
            const isDone = item.status === 'done';
            const isPlanned = item.status === 'planned';
            const isRevealed = item.isRevealed ?? true;

            return (
              <div
                key={item.id}
                style={{
                  background: isDone ? 'rgba(72,187,120,0.06)' : 'var(--paper-raised)',
                  border: isDone ? '1px solid #48BB78' : isPlanned ? '2px solid var(--pink)' : '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Scratch foil overlay if hidden */}
                {!isRevealed && (
                  <div
                    onClick={() => revealScratch(item.id)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #AA771C 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 2,
                      color: '#4A3B05',
                      fontWeight: 800,
                      padding: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>✨</div>
                    <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Scratch to Reveal
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                      Click to unlock date challenge
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '26px' }}>{item.icon}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => toggleFavourite(item.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                      title="Favorite date"
                    >
                      {item.isFavourited ? '⭐' : '☆'}
                    </button>
                    <button
                      onClick={(e) => togglePlanned(item.id, e)}
                      className="badge"
                      style={{
                        background: isPlanned ? '#FFF0F5' : 'var(--paper)',
                        color: isPlanned ? 'var(--pink)' : 'var(--ink-soft)',
                        border: '1px solid var(--line)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                      title="Toggle Planned for upcoming date"
                    >
                      {isPlanned ? '📌 Planned' : '+ Plan'}
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                    {item.category}
                  </span>
                  <h4
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      margin: '4px 0 0',
                      textDecoration: isDone ? 'line-through' : 'none',
                      color: isDone ? 'var(--ink-soft)' : 'var(--ink)',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </h4>
                  {item.note && (
                    <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--ink-soft)', margin: '6px 0 0' }}>
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                  {item.completedDate ? (
                    <span style={{ fontSize: '11px', color: '#276749', fontWeight: 600 }}>
                      ✓ Fulfilled {item.completedDate}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      Not completed yet
                    </span>
                  )}

                  <button
                    onClick={() => toggleStatus(item.id)}
                    className="btn btn-ghost"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      color: isDone ? '#276749' : 'var(--ink)',
                      borderColor: isDone ? '#48BB78' : 'var(--line)',
                    }}
                  >
                    {isDone ? 'Completed ✓' : 'Mark Done'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Date Form */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px' }}>
            + Propose a Custom Date for Our Deck
          </h4>
          <form onSubmit={handleAddCustomDate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g. Try making homemade matcha boba together..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13.5px',
              }}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            >
              <option value="At Home">At Home</option>
              <option value="Online">Online</option>
              <option value="Outside">Outside</option>
              <option value="Creative">Creative</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Reunion">Reunion</option>
              <option value="Low Energy">Low Energy</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Add to Deck
            </button>
          </form>
        </div>

        {/* Cupidot Idea Modal */}
        {ideaModalOpen && cupidotIdea && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 999,
              padding: '20px',
            }}
          >
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: 'var(--shadow-lg)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>{cupidotIdea.icon}</div>
              <span className="badge hot" style={{ fontSize: '11px', marginBottom: '8px' }}>
                Cupidot Spark Idea
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0' }}>
                {cupidotIdea.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '20px' }}>
                Category: <b>{cupidotIdea.category}</b>
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setIdeaModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ padding: '10px 20px' }}
                >
                  Pass
                </button>
                <button
                  onClick={handleAddCupidotIdea}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  Add to Our 100 Dates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}

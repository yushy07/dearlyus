'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import { CoupleNameBar, ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { loadActivityRecords, upsertActivityRecord } from '@/lib/activity-records';

export type BoardStage = 'someday' | 'exploring' | 'planning' | 'done';

interface VisionItem {
  id: string;
  category: string;
  title: string;
  emoji: string;
  stage: BoardStage;
  proposedBy?: string;
  isPrivate?: boolean;
}

const STAGE_COLUMNS: { id: BoardStage; label: string; icon: string; desc: string }[] = [
  { id: 'someday', label: 'Someday Dreams', icon: '💭', desc: 'Wishes, quiet fantasies & long-term hopes' },
  { id: 'exploring', label: 'Exploring Options', icon: '🗺️', desc: 'Researching cities, bookings & floorplans' },
  { id: 'planning', label: 'In Action / Planning', icon: '📌', desc: 'Dates locked, flight alerts & active preparations' },
  { id: 'done', label: 'Realized & Cherished', icon: '✨', desc: 'Milestones we accomplished together' },
];

const PRESET_ELEMENTS: Omit<VisionItem, 'stage'>[] = [
  { id: 'p1', category: 'Home', title: 'Cozy Sunlit Loft with Floor Plants', emoji: '🏡' },
  { id: 'p2', category: 'Companion', title: 'Fluffy Golden Retriever Pup', emoji: '🐕' },
  { id: 'p3', category: 'Adventure', title: 'Kyoto Cherry Blossom Spring Roadtrip', emoji: '🌸' },
  { id: 'p4', category: 'Milestone', title: 'Intimate Sunset Beach Vows', emoji: '💍' },
  { id: 'p5', category: 'Daily Ritual', title: 'Sunday French Press & Slow Vinyls', emoji: '☕' },
  { id: 'p6', category: 'Distance', title: 'Official One-Way Flight & Permanent Reunion', emoji: '✈️' },
  { id: 'p7', category: 'Home', title: 'Balcony Fairy Lights & Herb Garden', emoji: '🌿' },
  { id: 'p8', category: 'Adventure', title: 'Scandinavian Aurora Train Journey', emoji: '🚆' },
];

export default function FuturePage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { space } = useCoupleSpace();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [items, setItems] = useState<VisionItem[]>([
    { ...PRESET_ELEMENTS[0], stage: 'planning', proposedBy: partnerA },
    { ...PRESET_ELEMENTS[1], stage: 'someday', proposedBy: partnerB },
    { ...PRESET_ELEMENTS[2], stage: 'exploring', proposedBy: partnerA },
    { ...PRESET_ELEMENTS[5], stage: 'done', proposedBy: 'Both' },
  ]);

  const [activePartnerFilter, setActivePartnerFilter] = useState<'all' | 'A' | 'B'>('all');
  const [customGoal, setCustomGoal] = useState('');
  const [customCategory, setCustomCategory] = useState('Dream');
  const [customEmoji, setCustomEmoji] = useState('✨');
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-future` : 'local-future',
    activityType: 'future',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { totalItems: items.length },
  });

  useEffect(() => {
    if (space?.id) {
      void loadActivityRecords<{ items?: VisionItem[] }>(space.id, 'future_plan')
        .then((records) => {
          const shared = records.find((record) => record.key === 'main-board');
          if (shared?.payload.items?.length) setItems(shared.payload.items);
        })
        .catch((error) => console.error('Failed to restore shared future board:', error));
      return;
    }
    try {
      const savedRaw = localStorage.getItem('dearly_future_vision_board');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {}
  }, [space?.id]);

  const persistItems = (newItems: VisionItem[]) => {
    setItems(newItems);
    if (space?.id) {
      void upsertActivityRecord({
        coupleId: space.id,
        kind: 'future_plan',
        key: 'main-board',
        title: 'Our Future Board',
        payload: { items: newItems },
      }).catch((error) => console.error('Failed to sync shared future board:', error));
      return;
    }
    try {
      localStorage.setItem('dearly_future_vision_board', JSON.stringify(newItems));
    } catch {}
  };

  const handleMoveStage = (id: string, newStage: BoardStage) => {
    sounds.playPop();
    const updated = items.map((it) => (it.id === id ? { ...it, stage: newStage } : it));
    persistItems(updated);
    void runtime.sendEvent('future_dream_move', { id, column: newStage });
  };

  const handleAddPreset = (el: Omit<VisionItem, 'stage'>) => {
    if (items.some((it) => it.title === el.title)) return;
    sounds.playTick();
    const newItem: VisionItem = {
      ...el,
      id: `vis-${Date.now()}`,
      stage: 'someday',
      proposedBy: activePartnerFilter === 'B' ? partnerB : partnerA,
    };
    const updated = [...items, newItem];
    persistItems(updated);
    void runtime.sendEvent('future_dream_add', { dream: newItem });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    sounds.playCelebration();
    const newItem: VisionItem = {
      id: `vis-${Date.now()}`,
      category: customCategory,
      title: customGoal.trim(),
      emoji: customEmoji,
      stage: 'someday',
      proposedBy: activePartnerFilter === 'B' ? partnerB : partnerA,
    };
    const updated = [...items, newItem];
    persistItems(updated);
    void runtime.sendEvent('future_dream_add', { dream: newItem });
    setCustomGoal('');
  };

  const handleRemove = (id: string) => {
    sounds.playPop();
    const updated = items.filter((it) => it.id !== id);
    persistItems(updated);
    void runtime.sendEvent('future_dream_archive', { id });
  };

  const handleSaveBoardKeepsake = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      const doneCount = items.filter((i) => i.stage === 'done').length;
      await saveKeepsake({
        kind: 'activity',
        title: `Couple Someday Board · ${items.length} Milestones`,
        activityPath: '/future',
        caption: `Shared future blueprint with ${items.length} goals mapped across 4 progression stages (${doneCount} celebrated as done!).`,
        metadata: {
          activityType: 'future',
          totalGoals: items.length,
          doneGoals: doneCount,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save future board keepsake:', err);
    }
  };

  const doneCount = items.filter((i) => i.stage === 'done').length;

  return (
    <ActivityShell
      activityTitle="Future Home & Someday Board"
      activitySubtitle="Shared Dream Blueprint · 4-Column Horizon Progression & Private Proposals"
      currentStage={keepsakeSaved ? 'remember' : items.length > 5 ? 'play' : 'ready'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Dream Board · ${items.length} Visions`,
        subtitle: `${doneCount} Realized · ${items.length - doneCount} on Horizon`,
        badge: '📌 BLUEPRINT READY',
      }}
      guidancePhase={keepsakeSaved ? 'completed' : 'ready'}
      guidancePrivacyNote="Goals and milestones pinned to your shared blueprint sync mutually across your couple space."
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px 0 40px' }}>
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
            Design your future <span className="grad">together</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '54ch', margin: '0 auto' }}>
            Map your shared milestones — from quiet Sunday morning rituals to dream city sanctuaries — across four living horizons.
          </p>
        </div>

        {/* View Controls & Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
            padding: '12px 18px',
            background: 'var(--paper-raised)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--ink-soft)' }}>
              FILTER PROPOSALS:
            </span>
            <button
              onClick={() => setActivePartnerFilter('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                border: activePartnerFilter === 'all' ? '2px solid #17181C' : '1px solid var(--line)',
                background: activePartnerFilter === 'all' ? '#17181C' : '#FFF',
                color: activePartnerFilter === 'all' ? '#FFF' : 'var(--ink)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Us ({items.length})
            </button>
            <button
              onClick={() => setActivePartnerFilter('A')}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                border: activePartnerFilter === 'A' ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: activePartnerFilter === 'A' ? '#FFF5F8' : '#FFF',
                color: activePartnerFilter === 'A' ? 'var(--pink)' : 'var(--ink)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🌸 {partnerA}
            </button>
            <button
              onClick={() => setActivePartnerFilter('B')}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                border: activePartnerFilter === 'B' ? '2px solid var(--blue)' : '1px solid var(--line)',
                background: activePartnerFilter === 'B' ? '#F0F7FF' : '#FFF',
                color: activePartnerFilter === 'B' ? 'var(--blue)' : 'var(--ink)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              💙 {partnerB}
            </button>
          </div>

          <button
            onClick={handleSaveBoardKeepsake}
            disabled={keepsakeSaved || keepsakeSaving}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            {keepsakeSaved ? '✓ Saved to Keepsakes!' : keepsakeSaving ? 'Archiving...' : '💾 Save Blueprint to Keepsakes'}
          </button>
        </div>

        {/* 4-COLUMN HORIZON BOARD */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {STAGE_COLUMNS.map((col) => {
            const colItems = items.filter((it) => {
              if (it.stage !== col.id) return false;
              if (activePartnerFilter === 'A') return it.proposedBy === partnerA;
              if (activePartnerFilter === 'B') return it.proposedBy === partnerB;
              return true;
            });

            return (
              <div
                key={col.id}
                style={{
                  background: 'var(--paper-raised)',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <div style={{ marginBottom: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)' }}>
                      {col.icon} {col.label}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--paper)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {colItems.length}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    {col.desc}
                  </div>
                </div>

                {/* Items in Column */}
                <div style={{ display: 'grid', gap: '10px', flex: 1, minHeight: '120px' }}>
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                        padding: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        position: 'relative',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          border: 'none',
                          background: 'none',
                          fontSize: '11px',
                          color: 'var(--ink-soft)',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>

                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{item.emoji}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', fontWeight: 800 }}>
                        {item.category.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, margin: '2px 0 8px', lineHeight: 1.35 }}>
                        {item.title}
                      </div>

                      {/* Stage Mover Pill Selector */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {STAGE_COLUMNS.map((sc) => {
                          if (sc.id === item.stage) return null;
                          return (
                            <button
                              key={sc.id}
                              onClick={() => handleMoveStage(item.id, sc.id)}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--line)',
                                background: '#FFF',
                                cursor: 'pointer',
                                color: 'var(--ink-soft)',
                              }}
                            >
                              → {sc.icon}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {colItems.length === 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ink-soft)',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        border: '1px dashed var(--line)',
                        borderRadius: '8px',
                        padding: '16px',
                      }}
                    >
                      Drop dreams here...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ideas Inspiration Shelf & Custom Goal Form */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '24px 28px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>
            Inspiring Ideas to Pin to Someday:
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {PRESET_ELEMENTS.map((el) => {
              const alreadyAdded = items.some((it) => it.title === el.title);
              return (
                <button
                  key={el.id}
                  disabled={alreadyAdded}
                  onClick={() => handleAddPreset(el)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: alreadyAdded ? '#F3F4F6' : 'var(--paper)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: alreadyAdded ? 'default' : 'pointer',
                    opacity: alreadyAdded ? 0.5 : 1,
                  }}
                >
                  <span>{el.emoji}</span>
                  <span>{el.title}</span>
                  <span style={{ color: 'var(--pink)', fontWeight: 800 }}>{alreadyAdded ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder="✨"
              style={{
                width: '50px',
                padding: '10px',
                textAlign: 'center',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '16px',
              }}
            />
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Category (e.g. Travel, Home)"
              style={{
                width: '150px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '13px',
              }}
            />
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Inscribe a custom couple milestone..."
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '13.5px',
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Add to Someday +
            </button>
          </form>
        </div>
      </div>
    </ActivityShell>
  );
}

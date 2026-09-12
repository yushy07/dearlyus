'use client';

import React, { useState, useId } from 'react';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { recordRitualEntry } from '@/lib/account';
import { sounds } from '@/lib/sound';

export type RitualKey =
  | 'sunday-checkin'
  | 'daily-gratitude'
  | 'bedtime-question'
  | 'monthly-recap'
  | 'long-distance-countdown'
  | 'anniversary-capsule';

interface RitualDefinition {
  id: RitualKey;
  title: string;
  icon: string;
  cadence: string;
  description: string;
  prompt: string;
  placeholder: string;
}

const RITUAL_DEFINITIONS: RitualDefinition[] = [
  {
    id: 'sunday-checkin',
    title: 'Sunday Check-in',
    icon: '🕯️',
    cadence: 'Weekly quiet moment',
    description:
      'A gentle pause at the edge of the weekend to reflect, listen, and prepare for the days ahead.',
    prompt:
      'What was something peaceful about this past week, or one way you felt cared for by your person?',
    placeholder:
      'Share a gentle thought, something you loved, or how you want to support each other this coming week…',
  },
  {
    id: 'daily-gratitude',
    title: 'Daily Gratitude',
    icon: '🌸',
    cadence: 'Anytime you feel it',
    description:
      'One small, quiet thing you noticed and appreciated about your person today.',
    prompt:
      'What is one little thing your person did or said today that made you smile or feel held?',
    placeholder:
      'e.g. The morning voice note you sent, or how patient you were when work was overwhelming…',
  },
  {
    id: 'bedtime-question',
    title: 'Bedtime Question',
    icon: '🌙',
    cadence: 'Nightly drift-off',
    description:
      'One tender, low-pressure question before your day comes to a quiet close.',
    prompt:
      'If tonight could freeze for one extra hour, what would you want us to do together right now?',
    placeholder: 'Whisper your answer here…',
  },
  {
    id: 'monthly-recap',
    title: 'Monthly Memory Recap',
    icon: '📦',
    cadence: 'Monthly bookmark',
    description:
      'A warm snapshot bookmarking your shared memories, laughs, and adventures over the past month.',
    prompt:
      'Looking back at this past month, what is your favorite unexpected moment or inside joke together?',
    placeholder:
      'Reflect on this month’s milestones, quiet victories, and favorite memories…',
  },
  {
    id: 'long-distance-countdown',
    title: 'Next Moment Countdown',
    icon: '♡',
    cadence: 'Looking forward',
    description:
      'Keep a gentle marker for the next moment you will share, online or in person.',
    prompt:
      'What moment are you looking forward to together?',
    placeholder:
      'e.g. Friday movie call or our next hug…',
  },
  {
    id: 'anniversary-capsule',
    title: 'Anniversary Capsule',
    icon: '🥂',
    cadence: 'Annual milestone',
    description:
      'Seal a time-capsule letter to be read on your next anniversary. Sealed until the clock strikes your special date.',
    prompt:
      'What is your private promise or message to your future selves for your next anniversary?',
    placeholder:
      'Dear Us one year from now, my favorite thing about loving you today is…',
  },
];

export function SharedRituals() {
  const { space, keepsakes } = useCoupleSpace();
  const [activeTab, setActiveTab] = useState<RitualKey>('sunday-checkin');
  const [entryText, setEntryText] = useState('');
  const [targetDate, setTargetDate] = useState('2026-10-15');
  const [countdownLabel, setCountdownLabel] = useState('Our Next Moment');
  const [anniversaryDate, setAnniversaryDate] = useState('2026-12-25');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'info';
    text: string;
  } | null>(null);
  const [localEntries, setLocalEntries] = useState<
    Array<{ id: string; ritual: RitualKey; content: string; date: string }>
  >([]);

  const activeDef =
    RITUAL_DEFINITIONS.find((r) => r.id === activeTab) || RITUAL_DEFINITIONS[0];
  const tabListId = useId();

  // Days remaining calculation for countdown
  const getDaysRemaining = (dateString: string) => {
    try {
      const target = new Date(dateString).getTime();
      const diff = target - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return isNaN(days) ? null : days;
    } catch {
      return null;
    }
  };

  const daysToReunion = getDaysRemaining(targetDate);
  const daysToAnniversary = getDaysRemaining(anniversaryDate);

  const handleSaveEntry = async () => {
    if (!entryText.trim() && activeTab !== 'long-distance-countdown') return;
    setSaving(true);
    setNotice(null);

    const payload: Record<string, unknown> = {
      ritual: activeTab,
      prompt: activeDef.prompt,
      content: entryText.trim(),
      timestamp: new Date().toISOString(),
    };

    if (activeTab === 'long-distance-countdown') {
      payload.targetDate = targetDate;
      payload.label = countdownLabel;
    } else if (activeTab === 'anniversary-capsule') {
      payload.anniversaryDate = anniversaryDate;
    }

    try {
      if (space?.id) {
        await recordRitualEntry(space.id, activeTab, payload);
      }
      try {
        sounds.playSparkleReaction('💖');
      } catch {
        sounds.playChime();
      }
      setLocalEntries((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          ritual: activeTab,
          content:
            entryText.trim() || `${countdownLabel} set for ${targetDate}`,
          date: new Date().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);
      setEntryText('');
      setNotice({
        kind: 'success',
        text:
          activeTab === 'anniversary-capsule'
            ? 'Capsule sealed. It will stay preserved in your couple space! ♡'
            : 'Your quiet ritual entry was saved. No rush, no streaks—just saved for whenever you want to revisit it.',
      });
    } catch {
      // Offline / graceful fallback
      sounds.playPop();
      setLocalEntries((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          ritual: activeTab,
          content:
            entryText.trim() || `${countdownLabel} set for ${targetDate}`,
          date: new Date().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
        },
        ...prev,
      ]);
      setEntryText('');
      setNotice({
        kind: 'info',
        text: 'Saved locally for this session. It will sync whenever your couple connection updates.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby={`${tabListId}-heading`}
      style={{
        background: 'var(--paper-raised, #ffffff)',
        borderRadius: '24px',
        padding: '28px',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-soft)',
        position: 'relative',
      }}
    >
      {/* Header with Guilt-Free Disclaimer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 800,
              color: 'var(--pink)',
              marginBottom: '4px',
            }}
          >
            Rhythm &amp; Rituals · Guilt-Free
          </div>
          <h2
            id={`${tabListId}-heading`}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '24px',
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            Shared Rituals
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '13.5px',
              color: 'var(--ink-soft)',
              maxWidth: '640px',
              lineHeight: 1.5,
            }}
          >
            Pick up whenever you both feel like it. No streak counters, no
            reminders meant to shame you, and no penalty for busy weeks. Just
            warm, optional rituals to keep you close.
          </p>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '999px',
            fontSize: '12px',
            color: 'var(--ink-soft)',
            fontWeight: 600,
          }}
        >
          <span>🕊️ Zero streaks</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>100% Optional</span>
        </div>
      </div>

      {/* Ritual Tabs */}
      <div
        role="tablist"
        aria-label="Ritual categories"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '20px',
          scrollbarWidth: 'thin',
        }}
      >
        {RITUAL_DEFINITIONS.map((r) => {
          const isActive = r.id === activeTab;
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tabListId}-panel-${r.id}`}
              id={`${tabListId}-tab-${r.id}`}
              onClick={() => {
                setActiveTab(r.id);
                setNotice(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '16px',
                border: isActive
                  ? '1px solid var(--pink)'
                  : '1px solid var(--line)',
                background: isActive ? 'var(--pink-tint)' : 'var(--paper)',
                color: isActive ? 'var(--pink)' : 'var(--ink)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '15px' }}>{r.icon}</span>
              <span>{r.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Ritual Panel */}
      <div
        role="tabpanel"
        id={`${tabListId}-panel-${activeDef.id}`}
        aria-labelledby={`${tabListId}-tab-${activeDef.id}`}
        style={{
          background: 'var(--paper)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{activeDef.icon}</span>
            <div>
              <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>
                {activeDef.title}
              </strong>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                {activeDef.cadence}
              </div>
            </div>
          </div>
          {activeTab === 'monthly-recap' && keepsakes.length > 0 && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--pink)',
                background: 'var(--pink-tint)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontWeight: 700,
              }}
            >
              {keepsakes.length} keepsakes saved
            </div>
          )}
        </div>

        <p
          style={{
            fontSize: '13.5px',
            color: 'var(--ink-soft)',
            margin: '0 0 16px',
            lineHeight: 1.5,
          }}
        >
          {activeDef.description}
        </p>

        {/* Prompt Card */}
        <div
          style={{
            padding: '16px',
            background: 'var(--paper-raised, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--line)',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--pink)',
              marginBottom: '4px',
            }}
          >
            Reflection prompt
          </div>
          <div
            style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}
          >
            &ldquo;{activeDef.prompt}&rdquo;
          </div>
        </div>

        {/* Long-Distance Countdown Controls */}
        {activeTab === 'long-distance-countdown' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '6px',
                }}
              >
                Milestone name
              </label>
              <input
                type="text"
                value={countdownLabel}
                onChange={(e) => setCountdownLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  fontSize: '13.5px',
                  background: 'var(--paper-raised, #ffffff)',
                }}
                placeholder="e.g. Sunday video dinner"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '6px',
                }}
              >
                Date and time to look forward to
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  fontSize: '13.5px',
                  background: 'var(--paper-raised, #ffffff)',
                }}
              />
            </div>
            {daysToReunion !== null && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  background:
                    'linear-gradient(135deg, rgba(255, 78, 120, 0.1), rgba(67, 126, 235, 0.08))',
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 78, 120, 0.25)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--pink)',
                    fontWeight: 700,
                  }}
                >
                  COUNTDOWN TO {countdownLabel.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 900,
                    color: 'var(--pink)',
                    margin: '4px 0',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  {daysToReunion > 0
                    ? `${daysToReunion} Days`
                    : daysToReunion === 0
                      ? 'Today is the day! 🎉'
                      : `${Math.abs(daysToReunion)} days since reunion ♡`}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  {daysToReunion > 0
                    ? 'Every day brings you both one sunrise closer.'
                    : 'Cherish every second together.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Anniversary Capsule Controls */}
        {activeTab === 'anniversary-capsule' && (
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: '4px',
                  }}
                >
                  Your anniversary date
                </label>
                <input
                  type="date"
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                    background: 'var(--paper-raised, #ffffff)',
                  }}
                />
              </div>
              {daysToAnniversary !== null && (
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-soft)',
                    marginTop: '16px',
                  }}
                >
                  {daysToAnniversary > 0
                    ? `🍾 Next anniversary in ${daysToAnniversary} days`
                    : '🥂 Happy Anniversary celebration!'}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--ink-soft)',
                background: 'var(--pink-tint)',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              🔒 Messages written into this capsule stay sealed with gentle
              privacy until you celebrate.
            </div>
          </div>
        )}

        {/* Response Textarea */}
        <div style={{ marginBottom: '16px' }}>
          <textarea
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            placeholder={activeDef.placeholder}
            rows={4}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--line)',
              background: 'var(--paper-raised, #ffffff)',
              fontSize: '14px',
              color: 'var(--ink)',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Actions & Notice */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
            Saved privately to your couple space.
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveEntry}
            disabled={
              saving ||
              (!entryText.trim() && activeTab !== 'long-distance-countdown')
            }
            style={{ minWidth: '140px' }}
          >
            {saving
              ? 'Saving…'
              : activeTab === 'anniversary-capsule'
                ? 'Seal Capsule ✉️'
                : 'Save Reflection ♡'}
          </button>
        </div>

        {notice && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              background:
                notice.kind === 'success' ? 'var(--pink-tint)' : 'var(--paper)',
              color: notice.kind === 'success' ? 'var(--pink)' : 'var(--ink)',
              border: '1px solid var(--line)',
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: 1.4,
            }}
            role="status"
          >
            {notice.text}
          </div>
        )}

        {/* Recent Entries */}
        {localEntries.filter((e) => e.ritual === activeTab).length > 0 && (
          <div
            style={{
              marginTop: '22px',
              borderTop: '1px solid var(--line)',
              paddingTop: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-soft)',
                marginBottom: '8px',
              }}
            >
              Past Reflections
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {localEntries
                .filter((e) => e.ritual === activeTab)
                .slice(0, 3)
                .map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: 'var(--paper-raised, #ffffff)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      fontSize: '13px',
                      color: 'var(--ink)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span>&ldquo;{entry.content}&rdquo;</span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--ink-soft)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.date}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

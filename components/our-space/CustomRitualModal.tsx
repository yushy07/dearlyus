'use client';

import React, { useState, useEffect } from 'react';
import { CoupleRitual, TogethernessMode } from '@/types/cupidot';
import { sounds } from '@/lib/sound';

export interface CustomRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerAName?: string;
  partnerBName?: string;
  timezoneA?: string;
  timezoneB?: string;
  initialRitual?: CoupleRitual | null;
  onSaveRitual: (
    ritual: Omit<CoupleRitual, 'id' | 'createdAt'> & { id?: string },
  ) => void;
}

export function CustomRitualModal({
  isOpen,
  onClose,
  partnerAName = 'You',
  partnerBName = 'Your person',
  timezoneA,
  timezoneB,
  initialRitual,
  onSaveRitual,
}: CustomRitualModalProps) {
  const [title, setTitle] = useState(
    initialRitual?.title || 'Sunday Morning Coffee Check-in ☕',
  );
  const [purpose, setPurpose] = useState(
    initialRitual?.purpose ||
      'A gentle recurring pause to listen, share, and support each other.',
  );
  const [cadence, setCadence] = useState<CoupleRitual['cadence']>(
    initialRitual?.cadence || 'weekly',
  );
  const [timeOfDay, setTimeOfDay] = useState(
    initialRitual?.timeOfDay || '10:00',
  );
  const [remindersA, setRemindersA] = useState(
    initialRitual?.remindersEnabledA ?? true,
  );
  const [remindersB, setRemindersB] = useState(
    initialRitual?.remindersEnabledB ?? true,
  );
  const [suggestedMode, setSuggestedMode] = useState<TogethernessMode>(
    initialRitual?.suggestedMode || 'quick_spark',
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(initialRitual?.title || 'Sunday Morning Coffee Check-in ☕');
      setPurpose(
        initialRitual?.purpose ||
          'A gentle recurring pause to listen, share, and support each other.',
      );
      setCadence(initialRitual?.cadence || 'weekly');
      setTimeOfDay(initialRitual?.timeOfDay || '10:00');
      setRemindersA(initialRitual?.remindersEnabledA ?? true);
      setRemindersB(initialRitual?.remindersEnabledB ?? true);
      setSuggestedMode(initialRitual?.suggestedMode || 'quick_spark');
    }
  }, [isOpen, initialRitual]);

  // Keyboard accessibility (M13): Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate adjusted time in Partner B's timezone if distinct
  const partnerBAdjustedTime = (() => {
    if (!timezoneB || timezoneA === timezoneB) return null;
    try {
      const [hours, mins] = timeOfDay.split(':').map(Number);
      if (isNaN(hours) || isNaN(mins)) return null;
      // Anchor to today's date in local/A timezone
      const date = new Date();
      date.setHours(hours, mins, 0, 0);
      const formatter = new Intl.DateTimeFormat([], {
        timeZone: timezoneB,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return formatter.format(date);
    } catch {
      return null;
    }
  })();

  const handleSave = () => {
    sounds.playCelebration();
    onSaveRitual({
      id: initialRitual?.id,
      title: title.trim() || 'Our Shared Ritual ♡',
      purpose: purpose.trim() || 'A quiet, gentle moment for the two of us.',
      cadence,
      timeOfDay,
      timezoneA: timezoneA || Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneB,
      remindersEnabledA: remindersA,
      remindersEnabledB: remindersB,
      suggestedMode,
      snoozedUntil: initialRitual?.snoozedUntil || null,
      lastCompletedAt: initialRitual?.lastCompletedAt || null,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-ritual-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(28, 25, 36, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--paper-raised)',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--line)',
          padding: '28px 24px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--pink)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Couple Tradition
            </span>
            <h2
              id="custom-ritual-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                margin: '2px 0 0',
                color: 'var(--ink)',
              }}
            >
              Create a Gentle Shared Ritual
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink-soft)',
            margin: '0 0 18px',
            lineHeight: 1.5,
          }}
        >
          Rituals in Dearly Us are created by you two. There are no streaks, no
          guilt if life gets busy, and you can snooze or reschedule anytime.
        </p>

        {/* Ritual Form */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Ritual Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Coffee & Morning Words"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                fontSize: '14px',
              }}
              maxLength={70}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Purpose or Intention
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why this moment matters to you two…"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                fontSize: '13.5px',
              }}
              maxLength={120}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Rhythm & Cadence
              </label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                }}
              >
                <option value="weekly">Weekly moment 🕯️</option>
                <option value="daily">Daily check-in 🌸</option>
                <option value="monthly">Monthly recap 📦</option>
                <option value="flexible">Flexible window 🍃</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Time of Day
              </label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Timezone awareness info */}
          <div
            style={{
              background: 'var(--paper)',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              fontSize: '12px',
              color: 'var(--ink-soft)',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '3px',
              }}
            >
              Timezone aware: {timeOfDay} for {partnerAName} (
              {timezoneA || 'Local'})
            </div>
            {timezoneB && (
              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                {partnerBAdjustedTime
                  ? `Adjusted to ~${partnerBAdjustedTime} for ${partnerBName} (${timezoneB})`
                  : `Partner timezone: ${timezoneB} (${partnerBName})`}
              </div>
            )}
          </div>

          {/* Independent Reminder Controls (R07, M08) */}
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Personal Reminders (Non-guilt, quiet-hour aware)
            </label>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={remindersA}
                  onChange={(e) => setRemindersA(e.target.checked)}
                />
                <span>Send gentle reminder to {partnerAName} (You)</span>
              </label>

              {/* Partner B reminder is autonomous: read-only on Partner A's screen */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '12.5px',
                  color: 'var(--ink-soft)',
                  background: 'rgba(0, 0, 0, 0.02)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px dashed var(--line)',
                }}
              >
                <input
                  type="checkbox"
                  checked={remindersB}
                  disabled
                  readOnly
                  style={{ marginTop: '2px', cursor: 'not-allowed' }}
                />
                <div>
                  <span>
                    Gentle reminders for {partnerBName}:{' '}
                    <strong>{remindersB ? 'Enabled' : 'Paused'}</strong>
                  </span>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--ink-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {partnerBName} chooses their own reminder preference on
                    their device.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            style={{ fontSize: '13px' }}
          >
            Save Couple Ritual ♡
          </button>
        </div>
      </div>
    </div>
  );
}

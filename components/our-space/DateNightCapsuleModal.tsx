'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/sound';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

export interface DateNightCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerA?: string;
  partnerB?: string;
  defaultActivities?: string[];
  defaultMood?: string;
  onSaved?: () => void;
}

const MOOD_OPTIONS = [
  { key: 'cozy', label: 'Cozy ☕', color: '#B45309' },
  { key: 'romantic', label: 'Romantic 🌹', color: '#BE123C' },
  { key: 'playful', label: 'Playful ✨', color: '#D97706' },
  { key: 'deep', label: 'Deep 🌊', color: '#1D4ED8' },
  { key: 'spontaneous', label: 'Spontaneous ⚡', color: '#7C3AED' },
];

export function DateNightCapsuleModal({
  isOpen,
  onClose,
  partnerA = 'You',
  partnerB = 'Your person',
  defaultActivities = ['Quiz Lore', 'Draw Together'],
  defaultMood = 'romantic',
  onSaved,
}: DateNightCapsuleModalProps) {
  const { saveCapsule, saving, error: hookError } = useKeepsakeWriter();

  const [title, setTitle] = useState(
    `Date Night · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
  );
  const [selectedMood, setSelectedMood] = useState(defaultMood);
  const [activities, setActivities] = useState<string[]>(defaultActivities);
  const [newActivityInput, setNewActivityInput] = useState('');
  const [favoriteMoment, setFavoriteMoment] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [cupidotSummary, setCupidotSummary] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(
      `Date Night · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    );
    setSelectedMood(defaultMood);
    setActivities(defaultActivities);
    setNewActivityInput('');
    setFavoriteMoment('');
    setPrivateNote('');
    setCupidotSummary('');
    setSaveError(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, defaultMood, defaultActivities]);

  if (!isOpen) return null;

  const handleAddActivity = () => {
    if (!newActivityInput.trim()) return;
    setActivities((prev) => [...prev, newActivityInput.trim()]);
    setNewActivityInput('');
  };

  const handleRemoveActivity = (idx: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInsertTemplateReflection = () => {
    sounds.playChime();
    const activityText =
      activities.length > 0
        ? `spending time with ${activities.join(', ')}`
        : 'sharing a quiet evening together';
    setCupidotSummary(
      `Starter reflection template: An evening painted in ${selectedMood} warmth between ${partnerA} and ${partnerB}, ${activityText}. A peaceful milestone preserved for your cedar shelf.`,
    );
  };

  const handleSave = async () => {
    sounds.playCelebration();
    setSaveError(null);
    try {
      await saveCapsule({
        title,
        mood: selectedMood,
        activities,
        favoriteMoment:
          favoriteMoment || 'A golden night together across the miles.',
        privateNote,
        cupidotSummary: cupidotSummary || undefined,
        partnerA,
        partnerB,
        sealedAt: new Date().toISOString(),
      });
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to seal date night capsule:', err);
      setSaveError(
        err?.message || 'Failed to seal capsule to shelf. Please try again.',
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capsule-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1150,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(225, 29, 72, 0.25)',
          border: '1px solid rgba(244, 114, 182, 0.3)',
          padding: '32px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <div>
              <h2
                id="capsule-modal-title"
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: 0,
                  color: '#111827',
                }}
              >
                Seal Date Night Capsule
              </h2>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                Capture tonight’s memories before closing this session
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#4B5563',
            }}
          >
            ✕
          </button>
        </div>

        {/* Capsule Title */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Capsule Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Mood Selection (powers Memory Weather) */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Session Atmosphere (Explicit Mood)
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMood(m.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border:
                    selectedMood === m.key
                      ? `2px solid ${m.color}`
                      : '1px solid #E5E7EB',
                  background:
                    selectedMood === m.key ? `${m.color}15` : '#F9FAFB',
                  color: selectedMood === m.key ? m.color : '#4B5563',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activities Explored */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Activities Explored Tonight
          </label>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '8px',
            }}
          >
            {activities.map((act, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#FFF1F2',
                  color: '#BE123C',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {act}
                <button
                  type="button"
                  onClick={() => handleRemoveActivity(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#BE123C',
                    cursor: 'pointer',
                    padding: '0 2px',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Add activity (e.g. Vinyl Radio, Photobooth)..."
              value={newActivityInput}
              onChange={(e) => setNewActivityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            />
            <button
              type="button"
              onClick={handleAddActivity}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '12.5px' }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Favorite Moment */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Our Favorite Moment / Highlight
          </label>
          <textarea
            rows={2}
            value={favoriteMoment}
            onChange={(e) => setFavoriteMoment(e.target.value)}
            placeholder="What made you two laugh the hardest or smile warmest tonight?"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              fontSize: '13.5px',
              boxSizing: 'border-box',
              resize: 'none',
            }}
          />
        </div>

        {/* Private Note */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Private Note for Our Future Selves
          </label>
          <textarea
            rows={2}
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
            placeholder="A private thought, inside joke, or whispered 'I love you'..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              fontSize: '13.5px',
              boxSizing: 'border-box',
              resize: 'none',
            }}
          />
        </div>

        {/* Cupidot AI Reflection */}
        <div
          style={{
            marginBottom: '24px',
            background: '#FFFDF5',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #FEF08A',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span
              style={{ fontSize: '12.5px', fontWeight: 700, color: '#854D0E' }}
            >
              📝 Optional Starter Reflection
            </span>
            <button
              type="button"
              onClick={handleInsertTemplateReflection}
              style={{
                background: 'transparent',
                border: '1px dashed #D97706',
                color: '#B45309',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Insert Starter Template
            </button>
          </div>
          {cupidotSummary ? (
            <p
              style={{
                fontSize: '13px',
                color: '#713F12',
                lineHeight: 1.5,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              &ldquo;{cupidotSummary}&rdquo;
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: '#A16207', margin: 0 }}>
              Insert a gentle starter template for your keepsake reflection
              without sending any personal data.
            </p>
          )}
        </div>

        {/* Error Banner with Retry */}
        {(saveError || hookError) && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: '12px',
              color: '#B91C1C',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <span>⚠️ {saveError || hookError}</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#B91C1C',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid #F3F4F6',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              fontSize: '13.5px',
              cursor: 'pointer',
              padding: '8px 12px',
            }}
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{
              padding: '10px 28px',
              fontSize: '14px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #BE123C, #E11D48)',
            }}
          >
            {saving ? 'Sealing...' : '✨ Seal Capsule to Shelf'}
          </button>
        </div>
      </div>
    </div>
  );
}

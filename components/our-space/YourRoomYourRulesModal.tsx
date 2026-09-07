'use client';

import React, { useState } from 'react';
import { GuidanceMode } from '@/types/cupidot';
import { AiConsentToggle } from '@/components/shared/AiConsentToggle';
import { sounds } from '@/lib/sound';

export interface YourRoomYourRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  guidanceMode: GuidanceMode;
  onGuidanceChange: (mode: GuidanceMode) => void;
  reducedMotion: boolean;
  onReducedMotionChange: (val: boolean) => void;
  ambientAudio: boolean;
  onAmbientAudioChange: (val: boolean) => void;
}

export function YourRoomYourRulesModal({
  isOpen,
  onClose,
  guidanceMode,
  onGuidanceChange,
  reducedMotion,
  onReducedMotionChange,
  ambientAudio,
  onAmbientAudioChange,
}: YourRoomYourRulesModalProps) {
  const [askBeforeSave, setAskBeforeSave] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
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
          background: '#FFFFFF',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--line)',
          padding: '28px 24px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
              Consent & Boundaries
            </span>
            <h2 id="rules-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', margin: '2px 0 0', color: 'var(--ink)' }}>
              Your Room, Your Rules
            </h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 12px', fontSize: '13px' }}>
            ✕ Close
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Everything in Dearly Us operates under strict consent. Cupidot never scores your relationship, inspects sealed answers, or shares private telemetry.
        </p>

        {/* Section 1: Cupidot Guidance Level */}
        <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '18px', border: '1px solid var(--line)', marginBottom: '14px' }}>
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Cupidot Guidance Level</strong>
          <span style={{ fontSize: '12px', color: 'var(--ink-soft)', display: 'block', marginBottom: '12px' }}>
            Choose how vocal Cupidot is during your date nights and activities.
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['quiet', 'gentle', 'host'] as GuidanceMode[]).map((mode) => {
              const active = guidanceMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onGuidanceChange(mode);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: active ? '1.5px solid var(--pink)' : '1px solid var(--line)',
                    background: active ? 'rgba(255, 78, 120, 0.1)' : '#FFFFFF',
                    color: active ? 'var(--pink)' : 'var(--ink)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '8px' }}>
            {guidanceMode === 'quiet' && '• Only essential synchronization, error recovery, and privacy status.'}
            {guidanceMode === 'gentle' && '• One warm introduction, important milestones, and completion response (Default).'}
            {guidanceMode === 'host' && '• Full commentary, transitions, instructions, and date suggestions.'}
          </div>
        </div>

        {/* Section 2: AI Assistance */}
        <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '18px', border: '1px solid var(--line)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>AI Personalized Follow-ups</strong>
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)', display: 'block', marginTop: '3px' }}>
                Adaptive prompts use only mutually revealed text. Camera feeds and drafts are never sent.
              </span>
            </div>
            <AiConsentToggle />
          </div>
        </div>

        {/* Section 3: Motion & Audio */}
        <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '18px', border: '1px solid var(--line)', marginBottom: '14px' }}>
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '10px' }}>Sensory & Motion Preferences</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => {
                  sounds.playPop();
                  onReducedMotionChange(e.target.checked);
                }}
              />
              <span>Reduced motion (removes floating, shaking, and fast transitions)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ambientAudio}
                onChange={(e) => {
                  sounds.playPop();
                  onAmbientAudioChange(e.target.checked);
                }}
              />
              <span>Ambient audio loops during date night activities</span>
            </label>
          </div>
        </div>

        {/* Section 4: Keepsake & Notification Policies */}
        <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '18px', border: '1px solid var(--line)', marginBottom: '20px' }}>
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '10px' }}>Keepsakes & Notifications</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={askBeforeSave}
                onChange={(e) => setAskBeforeSave(e.target.checked)}
              />
              <span>Always ask before saving a keepsake (no silent auto-saving)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
              />
              <span>Respect quiet hours for ritual reminders ({quietStart} to {quietEnd})</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={onClose} style={{ fontSize: '13px' }}>
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}

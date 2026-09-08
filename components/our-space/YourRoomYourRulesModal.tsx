'use client';

import React, { useState } from 'react';
import {
  GuidanceMode,
  RomanceLevel,
  ROMANCE_LEVEL_DEFINITIONS,
} from '@/types/cupidot';
import { AiConsentToggle } from '@/components/shared/AiConsentToggle';
import { sounds } from '@/lib/sound';
import {
  getQuietHoursEnabled,
  setQuietHoursEnabled,
  getQuietHoursWindow,
  setQuietHoursWindow,
} from '@/lib/voice';

export interface YourRoomYourRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  guidanceMode: GuidanceMode;
  onGuidanceChange: (mode: GuidanceMode) => void;
  romanceLevel?: RomanceLevel;
  onRomanceLevelChange?: (level: RomanceLevel) => void;
  onSoftenRomance?: () => void;
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
  romanceLevel = 'romantic',
  onRomanceLevelChange,
  onSoftenRomance,
  reducedMotion,
  onReducedMotionChange,
  ambientAudio,
  onAmbientAudioChange,
}: YourRoomYourRulesModalProps) {
  const [softenNotice, setSoftenNotice] = useState<string | null>(null);
  const [pendingOptInLevel, setPendingOptInLevel] =
    useState<RomanceLevel | null>(null);

  const [quietHoursActive, setQuietHoursActive] = useState(() =>
    getQuietHoursEnabled(),
  );
  const [quietStart, setQuietStart] = useState(() => getQuietHoursWindow().start);
  const [quietEnd, setQuietEnd] = useState(() => getQuietHoursWindow().end);

  // Surprise Us Allow-List (M08, R06)
  const [allowCameraSurprise, setAllowCameraSurprise] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('dearly_allow_camera_surprise') !== 'false';
    } catch {
      return true;
    }
  });
  const [allowDeepSurprise, setAllowDeepSurprise] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('dearly_allow_deep_surprise') !== 'false';
    } catch {
      return true;
    }
  });
  const [allowGamesSurprise, setAllowGamesSurprise] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('dearly_allow_games_surprise') !== 'false';
    } catch {
      return true;
    }
  });
  const [allowCreativeSurprise, setAllowCreativeSurprise] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('dearly_allow_creative_surprise') !== 'false';
    } catch {
      return true;
    }
  });

  // Keepsake Resurfacing (M08, M15)
  const [resurfacingEnabled, setResurfacingEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('dearly_resurfacing_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  // Keyboard accessibility (M13): Escape key dismiss
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleToggleSurprisePref = (key: string, currentVal: boolean, setter: (v: boolean) => void) => {
    sounds.playPop();
    const next = !currentVal;
    setter(next);
    try {
      localStorage.setItem(key, next ? 'true' : 'false');
    } catch {}
  };

  const handleToggleResurfacing = () => {
    sounds.playPop();
    const next = !resurfacingEnabled;
    setResurfacingEnabled(next);
    try {
      localStorage.setItem('dearly_resurfacing_enabled', next ? 'true' : 'false');
    } catch {}
  };

  const handleQuietStartChange = (val: string) => {
    setQuietStart(val);
    setQuietHoursWindow(val, quietEnd);
  };

  const handleQuietEndChange = (val: string) => {
    setQuietEnd(val);
    setQuietHoursWindow(quietStart, val);
  };

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
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
              Consent & Boundaries
            </span>
            <h2
              id="rules-modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                margin: '2px 0 0',
                color: 'var(--ink)',
              }}
            >
              Your Room, Your Rules
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            ✕ Close
          </button>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink-soft)',
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}
        >
          Everything in Dearly Us operates under strict consent. Cupidot never
          scores your relationship, inspects sealed answers, or shares private
          telemetry.
        </p>

        {/* Section 1: Cupidot Guidance Level */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            marginBottom: '14px',
          }}
        >
          <strong
            style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}
          >
            Cupidot Guidance Level
          </strong>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--ink-soft)',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Choose how vocal Cupidot is during your date nights and activities.
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
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
                    border: active
                      ? '1.5px solid var(--pink)'
                      : '1px solid var(--line)',
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
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--ink-soft)',
              marginTop: '8px',
            }}
          >
            {guidanceMode === 'quiet' &&
              '• Only essential synchronization, error recovery, and privacy status.'}
            {guidanceMode === 'gentle' &&
              '• One warm introduction, important milestones, and completion response (Default).'}
            {guidanceMode === 'host' &&
              '• Full commentary, transitions, instructions, and date suggestions.'}
          </div>
        </div>

        {/* Section 2: Romance Spectrum */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <strong style={{ fontSize: '14px' }}>Romance Spectrum Level</strong>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onSoftenRomance?.();
                onRomanceLevelChange?.('warm');
                setSoftenNotice('Keeping things lighter.');
                window.setTimeout(() => setSoftenNotice(null), 3000);
              }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--pink)',
                background: 'rgba(255, 78, 120, 0.08)',
                border: '1px solid rgba(255, 78, 120, 0.25)',
                borderRadius: '8px',
                padding: '3px 8px',
                cursor: 'pointer',
              }}
              title="Instantly soften intensity without notifying your partner who changed it"
            >
              🛡️ Soften Intensity
            </button>
          </div>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--ink-soft)',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Shared intensity matches the lower chosen level. Either partner can
            lower it privately at any time.
          </span>

          {softenNotice && (
            <div
              role="status"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--pink)',
                background: '#FFF0F5',
                padding: '6px 12px',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              ✓ {softenNotice}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {(
              [
                'quiet',
                'warm',
                'romantic',
                'cheeky',
                'flirty',
                'spicy',
              ] as RomanceLevel[]
            ).map((level) => {
              const active = romanceLevel === level;
              const def = ROMANCE_LEVEL_DEFINITIONS[level];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    if (def.requiresMutualOptIn && romanceLevel !== level) {
                      setPendingOptInLevel(level);
                    } else {
                      setPendingOptInLevel(null);
                      onRomanceLevelChange?.(level);
                    }
                  }}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '12px',
                    border: active
                      ? '1.5px solid var(--pink)'
                      : '1px solid var(--line)',
                    background: active ? 'rgba(255, 78, 120, 0.1)' : '#FFFFFF',
                    color: active ? 'var(--pink)' : 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>{def.name}</span>
                  {def.requiresMutualOptIn && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        color: 'var(--pink)',
                        fontWeight: 600,
                      }}
                    >
                      {level === 'spicy' ? '18+ Session' : 'Mutual 18+'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {pendingOptInLevel && (
            <div
              role="alert"
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '12px',
                background: '#FFF0F5',
                border: '1.5px solid var(--pink)',
                fontSize: '12px',
                color: 'var(--ink)',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--pink)',
                  marginBottom: '4px',
                }}
              >
                ⚠️ 18+ Mutual Opt-In Required
              </div>
              <div style={{ lineHeight: 1.4 }}>
                {pendingOptInLevel === 'spicy'
                  ? 'Spicy mode is adult-only (18+) and active only for this specific date-night session. Either partner can lower or exit at any time with zero awkwardness.'
                  : 'Flirty mode requires mutual 18+ adult consent from both partners.'}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => {
                    sounds.playCelebration();
                    onRomanceLevelChange?.(pendingOptInLevel);
                    setPendingOptInLevel(null);
                  }}
                >
                  Confirm 18+ Opt-In
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setPendingOptInLevel(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--ink-soft)',
              marginTop: '8px',
            }}
          >
            {romanceLevel === 'quiet' &&
              '• Level 0: Pure operational clarity, recovery, and zero flirtation.'}
            {romanceLevel === 'warm' &&
              '• Level 1: Kind, cozy, and gently encouraging without flirtation.'}
            {romanceLevel === 'romantic' &&
              '• Level 2: Sincere affection, date atmosphere, and soft sparks (Default).'}
            {romanceLevel === 'cheeky' &&
              '• Level 3: Playful challenges, winks, and bold situational humor.'}
            {romanceLevel === 'flirty' &&
              '• Level 4: Suggestive tension and double meanings. Requires mutual opt-in.'}
            {romanceLevel === 'spicy' &&
              '• Level 5: Adult-only, deliberate, and session-scoped. Easy one-tap exit.'}
          </div>
        </div>

        {/* Section 3: AI Assistance */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>
                AI Personalized Follow-ups
              </strong>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--ink-soft)',
                  display: 'block',
                  marginTop: '3px',
                }}
              >
                Adaptive prompts use only mutually revealed text. Camera feeds
                and drafts are never sent.
              </span>
            </div>
            <AiConsentToggle />
          </div>
        </div>

        {/* Section 3: Motion & Audio */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            marginBottom: '14px',
          }}
        >
          <strong
            style={{ fontSize: '14px', display: 'block', marginBottom: '10px' }}
          >
            Sensory & Motion Preferences
          </strong>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
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
                checked={reducedMotion}
                onChange={(e) => {
                  sounds.playPop();
                  onReducedMotionChange(e.target.checked);
                }}
              />
              <span>
                Reduced motion (removes floating, shaking, and fast transitions)
              </span>
            </label>
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

        {/* Section 4: Surprise Us Activity Allow-List (M08, R06) */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            marginBottom: '14px',
          }}
        >
          <strong
            style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}
          >
            &ldquo;Surprise Us&rdquo; Activity Filters
          </strong>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--ink-soft)',
              display: 'block',
              marginBottom: '10px',
            }}
          >
            Tailor what activities the recommendation engine can suggest. You can filter out camera or deep modes anytime.
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={allowCameraSurprise}
                onChange={() =>
                  handleToggleSurprisePref(
                    'dearly_allow_camera_surprise',
                    allowCameraSurprise,
                    setAllowCameraSurprise,
                  )
                }
              />
              <span>📸 Camera & Photobooth</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={allowDeepSurprise}
                onChange={() =>
                  handleToggleSurprisePref(
                    'dearly_allow_deep_surprise',
                    allowDeepSurprise,
                    setAllowDeepSurprise,
                  )
                }
              />
              <span>💬 Deep Connection</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={allowGamesSurprise}
                onChange={() =>
                  handleToggleSurprisePref(
                    'dearly_allow_games_surprise',
                    allowGamesSurprise,
                    setAllowGamesSurprise,
                  )
                }
              />
              <span>⚡ Playful & Games</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={allowCreativeSurprise}
                onChange={() =>
                  handleToggleSurprisePref(
                    'dearly_allow_creative_surprise',
                    allowCreativeSurprise,
                    setAllowCreativeSurprise,
                  )
                }
              />
              <span>🎨 Scrapbook Wall</span>
            </label>
          </div>
        </div>

        {/* Section 5: Keepsake Consent Guarantee & Resurfacing (M08, M15) */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            marginBottom: '14px',
          }}
        >
          <strong
            style={{ fontSize: '14px', display: 'block', marginBottom: '10px' }}
          >
            Keepsakes & Privacy
          </strong>
          
          {/* Architectural Guarantee Notice */}
          <div
            style={{
              background: 'rgba(255, 78, 120, 0.06)',
              border: '1px solid rgba(255, 78, 120, 0.25)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '15px' }}>🔒</span>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>
                Mutual Keepsake Consent Guaranteed
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px', lineHeight: 1.4 }}>
                Keepsakes are never auto-saved without mutual approval from both of you. This is an architectural guarantee built into Dearly Us.
              </div>
            </div>
          </div>

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
              checked={resurfacingEnabled}
              onChange={handleToggleResurfacing}
            />
            <span>
              Allow gentle resurfacing of mutually approved keepsakes on our home shelf
            </span>
          </label>
        </div>

        {/* Section 6: Quiet Hours Window */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            marginBottom: '20px',
          }}
        >
          <strong
            style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}
          >
            Quiet Hours for Ritual Reminders
          </strong>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: quietHoursActive ? '10px' : '0',
            }}
          >
            <input
              type="checkbox"
              checked={quietHoursActive}
              onChange={(e) => {
                setQuietHoursActive(e.target.checked);
                setQuietHoursEnabled(e.target.checked);
              }}
            />
            <span>
              Silence Cupidot chirps and ritual notifications during quiet hours
            </span>
          </label>

          {quietHoursActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px',
                fontSize: '12px',
                color: 'var(--ink-soft)',
              }}
            >
              <span>From:</span>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => handleQuietStartChange(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontSize: '12px',
                }}
              />
              <span>To:</span>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => handleQuietEndChange(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontSize: '12px',
                }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ fontSize: '13px' }}
          >
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}

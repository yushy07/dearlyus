'use client';

import React from 'react';
import { GuidanceMode } from '@/types/cupidot';

export type ActivityLifecyclePhase =
  | 'invitation'
  | 'ready'
  | 'private'
  | 'locked'
  | 'revealed'
  | 'paused'
  | 'completed'
  | 'recovering'
  | 'expired';

export interface CupidotActivityGuidanceProps {
  activityName: string;
  phase: ActivityLifecyclePhase;
  guidanceMode?: GuidanceMode;
  partnerName?: string;
  onNextAction?: () => void;
  nextActionLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
  privacyNote?: string;
  className?: string;
  style?: React.CSSProperties;
}

const PHASE_GUIDANCE: Record<
  ActivityLifecyclePhase,
  { icon: string; title: string; hint: string; tone: string; bg: string }
> = {
  invitation: {
    icon: '💌',
    title: 'Invitation Waiting',
    hint: 'Take your time getting settled. Both partners must join freely before anything begins.',
    tone: '#BE123C',
    bg: 'rgba(255, 241, 245, 0.95)',
  },
  ready: {
    icon: '✨',
    title: 'Ready Check',
    hint: 'Both hearts are stepping up to the starting line. No rush, no pressure.',
    tone: '#D97706',
    bg: 'rgba(254, 243, 199, 0.95)',
  },
  private: {
    icon: '🔒',
    title: 'Private Drafting Phase',
    hint: 'Your responses, canvas strokes, and drafts are sealed. Invisible to your partner until mutual reveal.',
    tone: '#6B7280',
    bg: 'rgba(243, 244, 246, 0.95)',
  },
  locked: {
    icon: '🛡️',
    title: 'Response Sealed',
    hint: 'Your answer is locked tight. Awaiting your person without leaking clues or character counts.',
    tone: '#2563EB',
    bg: 'rgba(239, 246, 255, 0.95)',
  },
  revealed: {
    icon: '🎉',
    title: 'Revealed Together',
    hint: 'Unsealed together once both answers are ready. Enjoy this shared reaction!',
    tone: '#059669',
    bg: 'rgba(236, 253, 245, 0.95)',
  },
  paused: {
    icon: '☕',
    title: 'Session Paused Gently',
    hint: 'Step away for tea, water, or a breath. Pick back up whenever you both return.',
    tone: '#92400E',
    bg: 'rgba(254, 243, 199, 0.95)',
  },
  completed: {
    icon: '💖',
    title: 'Activity Complete',
    hint: 'Irreplaceable moment celebrated together! Would you like to seal this into a keepsake?',
    tone: '#9D174D',
    bg: 'rgba(253, 242, 248, 0.95)',
  },
  recovering: {
    icon: '🛡️',
    title: 'Preserving Your Place',
    hint: 'Syncing with the room session. Restoring confirmed state.',
    tone: '#4F46E5',
    bg: 'rgba(238, 242, 255, 0.95)',
  },
  expired: {
    icon: '🚪',
    title: 'Room Session Closed',
    hint: 'This room session has ended. Completed keepsakes remain in Our Space.',
    tone: '#4B5563',
    bg: 'rgba(249, 250, 251, 0.95)',
  },
};

export function CupidotActivityGuidance({
  activityName,
  phase,
  guidanceMode = 'gentle',
  partnerName = 'Your person',
  onNextAction,
  nextActionLabel,
  onSkip,
  skipLabel = 'Skip',
  privacyNote,
  className = '',
  style,
}: CupidotActivityGuidanceProps) {
  // If guidance is quiet, only show critical privacy/security, recovery, or expired cues
  if (
    guidanceMode === 'quiet' &&
    phase !== 'private' &&
    phase !== 'locked' &&
    phase !== 'recovering' &&
    phase !== 'expired'
  ) {
    return null;
  }

  const info = PHASE_GUIDANCE[phase] || PHASE_GUIDANCE.ready;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`cupidot-activity-guidance ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 16px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 143, 178, 0.25)',
        background: info.bg,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        marginBottom: '16px',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>{info.icon}</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '13px', color: info.tone }}>
              Cupidot · {activityName}
            </strong>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '1px 6px',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: info.tone,
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {info.title}
            </span>
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--ink-soft)',
              margin: '2px 0 0',
              lineHeight: 1.35,
            }}
          >
            {privacyNote || info.hint.replace('your person', partnerName)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onSkip && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onSkip}
            style={{
              fontSize: '11.5px',
              padding: '5px 10px',
              color: 'var(--ink-soft)',
            }}
            title="Skip without penalty"
          >
            {skipLabel}
          </button>
        )}
        {onNextAction && nextActionLabel && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNextAction}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            {nextActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

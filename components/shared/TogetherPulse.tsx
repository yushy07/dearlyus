'use client';

import React from 'react';

export type PulseState =
  | 'waiting'
  | 'invited'
  | 'connected'
  | 'online'
  | 'choosing'
  | 'writing'
  | 'drawing'
  | 'locked_in'
  | 'ready_to_reveal'
  | 'reconnecting'
  | 'resumed'
  | 'keepsake_saved';

export interface TogetherPulseProps {
  state: PulseState;
  partnerName?: string;
  customLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface StateConfig {
  label: string;
  color: string;
  bgTint: string;
  icon: string;
  ariaLabel: string;
  pulseClass?: string;
}

const STATE_CONFIGS: Record<PulseState, (name: string) => StateConfig> = {
  waiting: () => ({
    label: 'Waiting for your person',
    color: '#8A8498',
    bgTint: 'rgba(138, 132, 152, 0.12)',
    icon: '⏳',
    ariaLabel: 'Waiting for partner to join the room',
  }),
  invited: () => ({
    label: 'Invitation waiting to be opened',
    color: '#FF4E78',
    bgTint: 'rgba(255, 78, 120, 0.12)',
    icon: '💌',
    ariaLabel: 'Invitation sent, waiting for acceptance',
  }),
  connected: () => ({
    label: 'Both hearts connected',
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.12)',
    icon: '♡',
    ariaLabel: 'Both partners are connected to the space',
  }),
  online: (name) => ({
    label: `${name} is in the lobby`,
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.14)',
    icon: '●',
    ariaLabel: `${name} is currently online`,
  }),
  choosing: (name) => ({
    label: `${name} is choosing…`,
    color: '#437EEB',
    bgTint: 'rgba(67, 126, 235, 0.14)',
    icon: '💭',
    ariaLabel: `${name} is currently selecting an option`,
  }),
  writing: (name) => ({
    label: `${name} is writing privately…`,
    color: '#8B5CF6',
    bgTint: 'rgba(139, 92, 246, 0.14)',
    icon: '✍️',
    ariaLabel: `${name} is writing a sealed response`,
  }),
  drawing: (name) => ({
    label: `${name} is drawing…`,
    color: '#EC4899',
    bgTint: 'rgba(236, 72, 153, 0.14)',
    icon: '✎',
    ariaLabel: `${name} is drawing on the canvas`,
  }),
  locked_in: (name) => ({
    label: `${name} locked in ♡`,
    color: '#F59E0B',
    bgTint: 'rgba(245, 158, 11, 0.14)',
    icon: '🔒',
    ariaLabel: `${name} has locked in their private answer`,
  }),
  ready_to_reveal: () => ({
    label: 'Both locked in · Ready to reveal!',
    color: '#FF4E78',
    bgTint: 'rgba(255, 78, 120, 0.18)',
    icon: '✨',
    ariaLabel: 'Both answers are locked and ready for synchronized reveal',
  }),
  reconnecting: () => ({
    label: 'Reconnecting room…',
    color: '#F59E0B',
    bgTint: 'rgba(245, 158, 11, 0.14)',
    icon: '🔄',
    ariaLabel: 'Connection dropped, attempting to restore session',
  }),
  resumed: () => ({
    label: 'Session resumed',
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.12)',
    icon: '✦',
    ariaLabel: 'Date night session has resumed',
  }),
  keepsake_saved: () => ({
    label: 'Keepsake saved to shelf 📸',
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.16)',
    icon: '✓',
    ariaLabel: 'Memory successfully saved to couple keepsake shelf',
  }),
};

export function TogetherPulse({
  state,
  partnerName = 'Partner',
  customLabel,
  className = '',
  style = {},
}: TogetherPulseProps) {
  const configFactory = STATE_CONFIGS[state] || STATE_CONFIGS.waiting;
  const config = configFactory(partnerName);
  const textLabel = customLabel || config.label;

  const isLive = [
    'connected',
    'online',
    'choosing',
    'writing',
    'drawing',
    'locked_in',
    'ready_to_reveal',
  ].includes(state);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={config.ariaLabel}
      className={`together-pulse-root ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 13px',
        borderRadius: '999px',
        background: config.bgTint,
        border: `1px solid ${config.color}33`,
        color: config.color,
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.01em',
        userSelect: 'none',
        transition: 'all 0.25s ease',
        ...style,
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '12px',
          height: '12px',
        }}
      >
        {isLive && (
          <span
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: config.color,
              opacity: 0.5,
              animation:
                'together-pulse-ring 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite',
            }}
          />
        )}
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: config.color,
            boxShadow: isLive ? `0 0 8px ${config.color}` : 'none',
            display: 'block',
          }}
        />
      </span>

      <span style={{ display: 'inline-block', lineHeight: 1 }}>
        {textLabel}
      </span>
    </div>
  );
}

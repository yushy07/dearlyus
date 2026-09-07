'use client';

import React from 'react';
import Link from 'next/link';

export type RecoveryState =
  | 'partner_disconnected'
  | 'self_reconnecting'
  | 'out_of_order'
  | 'room_expired';

export interface RecoveryBannerProps {
  state: RecoveryState;
  partnerName?: string;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const RECOVERY_CONFIG: Record<
  RecoveryState,
  { icon: string; title: string; desc: string; tone: string; border: string; bg: string }
> = {
  partner_disconnected: {
    icon: '🛡️',
    title: 'Holding your place while they reconnect.',
    desc: 'Take a breath. Your sealed progress, choices, and canvas strokes are preserved safe and sound.',
    tone: '#BE123C',
    border: 'rgba(244, 114, 182, 0.4)',
    bg: 'linear-gradient(135deg, rgba(255, 241, 245, 0.95), rgba(255, 228, 236, 0.85))',
  },
  self_reconnecting: {
    icon: '✨',
    title: 'Bringing your room back…',
    desc: 'Catching up with your shared space. Your drafts and history remain intact.',
    tone: '#1E40AF',
    border: 'rgba(147, 197, 253, 0.45)',
    bg: 'linear-gradient(135deg, rgba(239, 246, 255, 0.95), rgba(219, 234, 254, 0.85))',
  },
  out_of_order: {
    icon: '⏳',
    title: 'Catching up on one moment.',
    desc: 'Aligning the latest synchronized round. No answers or actions were lost.',
    tone: '#B45309',
    border: 'rgba(252, 211, 77, 0.45)',
    bg: 'linear-gradient(135deg, rgba(254, 243, 199, 0.95), rgba(253, 230, 138, 0.85))',
  },
  room_expired: {
    icon: '🚪',
    title: 'This room session is closed.',
    desc: 'Your memories and keepsakes are saved to Our Space. You two can head back or begin a fresh room anytime.',
    tone: '#374151',
    border: 'rgba(209, 213, 219, 0.5)',
    bg: 'linear-gradient(135deg, rgba(249, 250, 251, 0.95), rgba(243, 244, 246, 0.85))',
  },
};

export function RecoveryBanner({
  state,
  partnerName = 'Your person',
  onRetry,
  className = '',
  style,
}: RecoveryBannerProps) {
  const config = RECOVERY_CONFIG[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`recovery-banner ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '14px 20px',
        borderRadius: '20px',
        border: `1px solid ${config.border}`,
        background: config.bg,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>{config.icon}</span>
        <div>
          <strong style={{ fontSize: '14.5px', color: config.tone, display: 'block' }}>
            {config.title.replace('they', partnerName)}
          </strong>
          <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '2px', display: 'block' }}>
            {config.desc}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {onRetry && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onRetry}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Retry catch-up ↻
          </button>
        )}
        {state === 'room_expired' && (
          <Link className="btn btn-primary" href="/our-space" style={{ fontSize: '12px', padding: '6px 14px' }}>
            Back to Our Space →
          </Link>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { MemorySeed, CupidotMood } from '@/types/cupidot';
import { sounds } from '@/lib/sound';

export interface KeepsakeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed: MemorySeed | null;
  currentUserName?: string;
  partnerName?: string;
  onApprove: (
    seedId: string,
    updatedCaption?: string,
    updatedMood?: CupidotMood,
  ) => Promise<void> | void;
  onDecline: (seedId: string) => Promise<void> | void;
}

export function KeepsakeApprovalModal({
  isOpen,
  onClose,
  seed,
  currentUserName = 'You',
  partnerName = 'Your person',
  onApprove,
  onDecline,
}: KeepsakeApprovalModalProps) {
  const [caption, setCaption] = useState(seed?.draftCaption || '');
  const [mood, setMood] = useState<CupidotMood>(seed?.chosenMood || 'cozy');
  const [busy, setBusy] = useState(false);

  if (!isOpen || !seed) return null;

  const isProposedByMe =
    seed.proposedBy === currentUserName || seed.proposedBy === 'You';

  const handleApprove = async () => {
    setBusy(true);
    sounds.playCelebration();
    try {
      await onApprove(seed.seedId, caption, mood);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    sounds.playPop();
    try {
      await onDecline(seed.seedId);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keepsake-approval-title"
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
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
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
              Mutual Keepsake Proposal
            </span>
            <h2
              id="keepsake-approval-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                margin: '2px 0 0',
                color: 'var(--ink)',
              }}
            >
              Seal this memory together?
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={busy}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink-soft)',
            margin: '0 0 16px',
            lineHeight: 1.5,
          }}
        >
          Keepsakes belong to both of you. They are only saved to your shared
          shelf when both hearts approve.
        </p>

        {/* Memory Seed Preview Card */}
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: '20px',
            padding: '18px',
            border: '1px solid var(--line)',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span
              style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}
            >
              {seed.activityTitle}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
              {new Date(seed.occurredAt || Date.now()).toLocaleDateString()}
            </span>
          </div>

          {seed.previewUrl && (
            <div
              style={{
                width: '100%',
                height: '180px',
                borderRadius: '14px',
                backgroundImage: `url(${seed.previewUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                marginBottom: '12px',
                border: '1px solid var(--line)',
              }}
            />
          )}

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13.5px',
              color: 'var(--ink)',
              fontStyle: 'italic',
              border: '1px solid var(--line)',
            }}
          >
            “{seed.highlightText}”
          </div>
        </div>

        {/* Caption & Shared Mood Editor */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 700,
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Shared Caption
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a small note or memory snippet…"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              fontSize: '13.5px',
              marginBottom: '12px',
            }}
            maxLength={120}
          />

          <label
            style={{
              fontSize: '12px',
              fontWeight: 700,
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Shared Mood Token
          </label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value as CupidotMood)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              fontSize: '13px',
            }}
          >
            <option value="cozy">Cozy ☕</option>
            <option value="playful">Playful ✨</option>
            <option value="romantic">Romantic 🌹</option>
            <option value="dreamy">Dreamy 🌙</option>
            <option value="proud">Proud 🌸</option>
          </select>
        </div>

        {/* Ownership transparency notice */}
        <div
          style={{
            background: 'rgba(244, 114, 182, 0.08)',
            border: '1px solid rgba(244, 114, 182, 0.25)',
            borderRadius: '14px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#831843',
            marginBottom: '20px',
            lineHeight: 1.45,
          }}
        >
          ✦ <strong>Equal Ownership:</strong> Once approved, this keepsake is
          sealed into your Our Space shelf. Either partner can inspect,
          download, or remove it without awkwardness.
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleDecline}
            disabled={busy}
            style={{ fontSize: '12.5px' }}
          >
            Decline with love (No penalty)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApprove}
            disabled={busy}
            style={{ fontSize: '12.5px' }}
          >
            {isProposedByMe
              ? 'Save to Our Space Shelf ♡'
              : 'Approve & Seal Keepsake ♡'}
          </button>
        </div>
      </div>
    </div>
  );
}

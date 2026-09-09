'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Keepsake } from '@/lib/account';
import { sounds } from '@/lib/sound';

export interface KeepsakeDetailModalProps {
  keepsake: Keepsake | null;
  isOpen?: boolean;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onDeleted?: () => void;
}

const KIND_LABELS: Record<
  Keepsake['kind'],
  { label: string; icon: string; color: string }
> = {
  photostrip: { label: 'Photostrip', icon: '📸', color: '#BE123C' },
  passport: { label: 'Visa Stamp', icon: '💮', color: '#D97706' },
  receipt: { label: 'Thermal Receipt', icon: '🧾', color: '#059669' },
  letter: { label: 'Wax-Sealed Letter', icon: '💌', color: '#E11D48' },
  scrapbook: { label: 'Scrapbook Page', icon: '📖', color: '#7C3AED' },
  activity: { label: 'Date Activity', icon: '♡', color: '#DB2777' },
};

export function KeepsakeDetailModal({
  keepsake,
  isOpen = true,
  onClose,
  onDelete,
  onDeleted,
}: KeepsakeDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [resurfacingEnabled, setResurfacingEnabled] = useState(true);
  const [aiReuseAllowed, setAiReuseAllowed] = useState(true);
  const [captionText, setCaptionText] = useState(keepsake?.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setConfirmDelete(false);
    setIsDeleting(false);
    setIsArchived(false);
    setResurfacingEnabled(true);
    setAiReuseAllowed(true);
    setCaptionText(keepsake?.caption || '');
    setIsEditingCaption(false);
    setNotice(null);
  }, [keepsake]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !keepsake) return null;

  const config = KIND_LABELS[keepsake.kind] || {
    label: 'Keepsake',
    icon: '♡',
    color: '#BE123C',
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    sounds.playPop();
    try {
      if (onDelete) {
        await onDelete(keepsake.id);
      }
      onDeleted?.();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(keepsake.createdAt).toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keepsake-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(244, 114, 182, 0.25)',
          padding: '28px',
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: `${config.color}15`,
              color: config.color,
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close keepsake detail"
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
              fontSize: '16px',
              color: '#4B5563',
            }}
          >
            ✕
          </button>
        </div>

        {/* Media Preview if available */}
        {(keepsake.previewUrl || keepsake.publicUrl) && (
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '20px',
              background: '#F9FAFB',
              border: '1px solid #F3F4F6',
              maxHeight: '340px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={(keepsake.previewUrl || keepsake.publicUrl)!}
              alt={keepsake.title}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '340px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Title and Date */}
        <h2
          id="keepsake-detail-title"
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 6px',
          }}
        >
          {keepsake.title}
        </h2>
        <div
          style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}
        >
          {formattedDate}
        </div>

        {/* Caption */}
        {keepsake.caption && (
          <div
            style={{
              background: '#FFF5F8',
              borderLeft: '4px solid #E11D48',
              padding: '12px 16px',
              borderRadius: '0 12px 12px 0',
              color: '#4C0519',
              fontSize: '14px',
              lineHeight: 1.5,
              marginBottom: '20px',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{keepsake.caption}&rdquo;
          </div>
        )}

        {/* Activity Revisit link */}
        {keepsake.activityPath && (
          <div style={{ marginBottom: '20px' }}>
            <Link
              href={keepsake.activityPath}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#BE123C',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>
                Revisit {keepsake.activityPath.replace('/', '')} activity →
              </span>
            </Link>
          </div>
        )}

        {/* Metadata Details */}
        {keepsake.metadata && Object.keys(keepsake.metadata).length > 0 && (
          <div
            style={{
              background: '#F9FAFB',
              padding: '14px',
              borderRadius: '14px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Keepsake Details
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
              }}
            >
              {Object.entries(keepsake.metadata)
                .filter(([k]) => !['historySummary', 'isCapsule'].includes(k))
                .map(([key, val]) => (
                  <div key={key} style={{ fontSize: '12.5px' }}>
                    <span style={{ color: '#6B7280' }}>{key}: </span>
                    <strong style={{ color: '#1F2937' }}>{String(val)}</strong>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Memory Lifecycle & Privacy Controls (M15) */}
        <div
          style={{
            background: 'var(--paper)',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Memory Lifecycle &amp; Privacy (M15)
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {/* Archive / Hide Toggle */}
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
                checked={isArchived}
                onChange={(e) => {
                  sounds.playPop();
                  setIsArchived(e.target.checked);
                  setNotice(
                    e.target.checked
                      ? 'Archived: Hidden from living shelf without permanent deletion.'
                      : 'Unarchived: Restored to living shelf.',
                  );
                }}
              />
              <span>
                <strong>Hide from shared shelf</strong> (Preserve in private
                vault without room display)
              </span>
            </label>

            {/* Resurfacing Toggle */}
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
                checked={resurfacingEnabled}
                onChange={(e) => {
                  sounds.playPop();
                  setResurfacingEnabled(e.target.checked);
                  setNotice(
                    e.target.checked
                      ? 'Resurfacing enabled for anniversary and nostalgic moments.'
                      : 'Resurfacing disabled: Cupidot will not bring this up proactively.',
                  );
                }}
              />
              <span>
                <strong>Opt-in Resurfacing:</strong> Allow gentle anniversary
                and milestone reminders
              </span>
            </label>

            {/* AI Theme Reuse Toggle & Revocation */}
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
                checked={aiReuseAllowed}
                onChange={(e) => {
                  sounds.playPop();
                  setAiReuseAllowed(e.target.checked);
                  setNotice(
                    e.target.checked
                      ? 'AI theme reuse allowed.'
                      : 'AI theme reuse revoked: themes from this memory are private only.',
                  );
                }}
              />
              <span>
                <strong>AI Date Inspiration:</strong> Allow themes in adaptive
                suggestions (Tap to revoke anytime)
              </span>
            </label>
          </div>

          {notice && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: '10px',
                fontSize: '11.5px',
                color: 'var(--pink)',
                fontWeight: 600,
              }}
            >
              ✓ {notice}
            </div>
          )}
        </div>

        {/* Actions Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid #F3F4F6',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                sounds.playChime();
                const data = JSON.stringify(keepsake, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `keepsake-${keepsake.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
                setNotice('Keepsake record downloaded as JSON.');
              }}
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                fontSize: '12px',
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              📥 Export JSON
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 0',
                }}
              >
                🗑️ Discard from Shelf
              </button>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '12px', color: '#991B1B' }}>
                  Permanently remove?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    background: '#EF4444',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    background: 'transparent',
                    color: '#6B7280',
                    border: 'none',
                    padding: '4px 6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '999px',
              padding: '8px 20px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

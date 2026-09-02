'use client';

import React, { useState } from 'react';
import type { CoupleTicketProfile } from '@/types/passport';
import { sounds } from '@/lib/sound';

interface TicketEditorModalProps {
  isOpen: boolean;
  profile: CoupleTicketProfile;
  onClose: () => void;
  onSave: (updated: CoupleTicketProfile) => void;
}

export function TicketEditorModal({ isOpen, profile, onClose, onSave }: TicketEditorModalProps) {
  const [formData, setFormData] = useState<CoupleTicketProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playCelebration();
    onSave(formData);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--line)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          animation: 'gl-rise 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>✈️</span>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Edit Love Airlines Ticket</h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0 }}>Customize your boarding pass keepsakes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--ink-soft)',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                PARTNER 1 NAME
              </label>
              <input
                type="text"
                value={formData.partner1}
                onChange={(e) => setFormData({ ...formData, partner1: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                PARTNER 2 NAME
              </label>
              <input
                type="text"
                value={formData.partner2}
                onChange={(e) => setFormData({ ...formData, partner2: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '4px' }}>
              ORIGIN CITY (HOME 1)
            </label>
            <input
              type="text"
              value={formData.originCity}
              onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '4px' }}>
              DESTINATION CITY (HOME 2)
            </label>
            <input
              type="text"
              value={formData.destinationCity}
              onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                ANNIVERSARY / DATE
              </label>
              <input
                type="text"
                value={formData.anniversaryDate}
                onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                SEAT ASSIGNMENT
              </label>
              <input
                type="text"
                value={formData.seatNumber}
                onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-grad"
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: '12px',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Save Boarding Pass</span>
              <span>✓</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { CoupleTicketProfile } from '@/types/passport';
import { sounds } from '@/lib/sound';

interface BoardingPassCardProps {
  profile: CoupleTicketProfile;
  onEditClick: () => void;
}

export function BoardingPassCard({ profile, onEditClick }: BoardingPassCardProps) {
  return (
    <div className="passport-boarding-pass" style={{ padding: '24px 28px', color: 'var(--ink)' }}>
      {/* Header section with 3D gold wax seal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px dashed var(--line)',
          paddingBottom: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="gold-wax-seal-3d" title="Authentic Angie Love Seal">
            <span>💮</span>
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--pink)',
                fontWeight: 800,
                letterSpacing: '1px',
              }}
            >
              ANGIE LOVE AIRLINES · FIRST CLASS TICKET
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900 }}>
              Non-Stop Flight to Each Other’s Arms
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
          <div>
            <div style={{ fontSize: '9px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Passengers</div>
            <div style={{ fontSize: '13px', fontWeight: 800 }}>
              {profile.partner1} &amp; {profile.partner2}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Seat</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)' }}>{profile.seatNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Love Date</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue)' }}>{profile.anniversaryDate}</div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onEditClick();
            }}
            style={{
              background: 'rgba(255, 123, 163, 0.1)',
              border: '1px solid rgba(255, 123, 163, 0.4)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--pink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>✎</span>
            <span>Edit Ticket</span>
          </button>
        </div>
      </div>

      {/* Route Departure / Arrival Hub */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>ORIGIN CITY</div>
            <div style={{ fontSize: '15px', fontWeight: 900 }}>{profile.originCity}</div>
          </div>
          <div style={{ fontSize: '20px', color: 'var(--pink)', padding: '0 8px' }}>✈️ ➔ 💖</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>DESTINATION</div>
            <div style={{ fontSize: '15px', fontWeight: 900 }}>{profile.destinationCity}</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--paper)',
            border: '1px dashed var(--line)',
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>💮 STATUS:</span>
          <b style={{ color: '#059669' }}>LIFETIME BOARDING PASS VALID</b>
        </div>
      </div>
    </div>
  );
}

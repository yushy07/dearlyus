'use client';

import React from 'react';
import type { CoupleTicketProfile } from '@/types/passport';

interface PassportBookletCoverProps {
  profile: CoupleTicketProfile;
  roomCode: string;
  rankTier: string;
  unlockedCount: number;
  totalCount: number;
  progressPercent: number;
}

export function PassportBookletCover({
  profile,
  roomCode,
  rankTier,
  unlockedCount,
  totalCount,
  progressPercent,
}: PassportBookletCoverProps) {
  return (
    <div className="passport-blush-cover" style={{ padding: '36px 30px', color: '#FFFFFF' }}>
      {/* Gold Crest & Passport Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(253, 230, 138, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(253, 230, 138, 0.35) 0%, rgba(212, 175, 55, 0.1) 100%)',
              border: '2px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              boxShadow: '0 0 25px rgba(253, 230, 138, 0.4)',
            }}
          >
            🌸
          </div>
          <div>
            <div
              className="passport-gold-text"
              style={{
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '2.5px',
                fontWeight: 800,
              }}
            >
              대한민국 연인 여권 · REPUBLIC OF LOVE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.2px', marginTop: '2px' }}>
              {profile.partner1} &amp; {profile.partner2}
            </div>
          </div>
        </div>

        {/* Passport Serial & Rank Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.65)' }}>
            PASSPORT ID
          </div>
          <div
            style={{
              fontSize: '17px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#FDE68A',
              letterSpacing: '1.5px',
            }}
          >
            ANG-{roomCode}-2026
          </div>
          <div
            style={{
              fontSize: '11.5px',
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '3px 10px',
              borderRadius: '12px',
              color: '#FDE68A',
              fontWeight: 700,
              marginTop: '2px',
            }}
          >
            {rankTier}
          </div>
        </div>
      </div>

      {/* Passport Progress Bar */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>
            Souvenir Date Stamps Unlocked ({unlockedCount}/{totalCount} Completed)
          </span>
          <span style={{ color: '#FDE68A', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            {progressPercent}% Complete
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #FF7BA3, #FFA07A, #FDE68A)',
              borderRadius: '6px',
              boxShadow: '0 0 12px rgba(255, 123, 163, 0.6)',
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>

      {/* 3D Satin Ribbon Bookmark */}
      <div className="passport-satin-ribbon" title="Satin Bookmark Ribbon" aria-hidden="true" />
    </div>
  );
}

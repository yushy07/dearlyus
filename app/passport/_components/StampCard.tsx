'use client';

import React from 'react';
import Link from 'next/link';
import type { PassportStamp } from '@/types/passport';
import { sounds } from '@/lib/sound';

interface StampCardProps {
  stamp: PassportStamp;
  isUnlocked: boolean;
  isAnimating: boolean;
  userNote: string;
  onStampClick: (stamp: PassportStamp, isUnlocked: boolean) => void;
  onEditNoteClick: (stamp: PassportStamp) => void;
}

export function StampCard({
  stamp,
  isUnlocked,
  isAnimating,
  userNote,
  onStampClick,
  onEditNoteClick,
}: StampCardProps) {
  return (
    <div
      className={`passport-page-cream passport-stamp-badge ${isAnimating ? 'stamp-ink-effect' : ''}`}
      onClick={() => onStampClick(stamp, isUnlocked)}
      style={{
        padding: '28px 22px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '260px',
        background: stamp.pastelBg,
        border: isUnlocked ? `1.5px solid ${stamp.inkColor}33` : '1.5px dashed var(--line)',
      }}
    >
      {/* Cute Washi Tape Graphic */}
      <div className="passport-washi-tape" style={{ background: `${stamp.inkColor}25` }} />

      {/* Top Category Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            fontWeight: 700,
          }}
        >
          {stamp.category}
        </span>

        {isUnlocked ? (
          <span
            style={{
              fontSize: '10px',
              background: `${stamp.inkColor}15`,
              border: `1px solid ${stamp.inkColor}44`,
              color: stamp.inkColor,
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}
          >
            ✓ STAMPED ON DATE
          </span>
        ) : (
          <span
            style={{
              fontSize: '10px',
              background: 'rgba(0,0,0,0.04)',
              color: 'var(--ink-soft)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            🔒 TAP TO STAMP
          </span>
        )}
      </div>

      {/* Stamp Center Emblem */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: stamp.sealShape === 'circle' || stamp.sealShape === 'heart' ? '50%' : '16px',
            border: isUnlocked ? `3.5px dashed ${stamp.inkColor}` : '2px dashed #CBD5E1',
            background: isUnlocked ? '#FFFFFF' : 'rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transform: isUnlocked ? `rotate(${stamp.stampAngle}deg)` : 'none',
            boxShadow: isUnlocked ? `0 4px 16px ${stamp.inkColor}22` : 'none',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span style={{ fontSize: '26px', opacity: isUnlocked ? 1 : 0.4 }}>
            {stamp.icon}
          </span>
          {isUnlocked && (
            <span
              style={{
                fontSize: '7.5px',
                fontWeight: 900,
                color: stamp.inkColor,
                fontFamily: 'var(--font-mono)',
                marginTop: '-2px',
              }}
            >
              OFFICIAL
            </span>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: isUnlocked ? stamp.inkColor : 'var(--ink)',
              letterSpacing: '-0.2px',
            }}
          >
            {stamp.title}
          </div>
          <div
            style={{
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              color: isUnlocked ? stamp.inkColor : 'var(--ink-soft)',
              fontWeight: 700,
              opacity: 0.85,
              marginBottom: '4px',
            }}
          >
            {stamp.koreanTitle}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
            {stamp.description}
          </div>
        </div>
      </div>

      {/* Romantic Couple Memory Sticky Snippet */}
      {isUnlocked && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '10px',
            padding: '8px 10px',
            fontSize: '11.5px',
            color: 'var(--ink)',
            fontStyle: 'italic',
            lineHeight: 1.4,
            margin: '6px 0 10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '12px', fontStyle: 'normal' }}>💭</span>
          <span style={{ flex: 1 }}>{userNote}</span>
        </div>
      )}

      {/* Action Footer Button */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <Link
          href={stamp.route}
          onClick={(e) => {
            e.stopPropagation();
            sounds.playPop();
          }}
          style={{
            flex: 1,
            textDecoration: 'none',
            textAlign: 'center',
            padding: '8px 12px',
            borderRadius: '10px',
            background: isUnlocked ? 'var(--paper-raised)' : 'var(--ink)',
            color: isUnlocked ? 'var(--ink)' : '#FFFFFF',
            fontSize: '11px',
            fontWeight: 800,
            border: isUnlocked ? '1px solid var(--line)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>{isUnlocked ? 'Play Experience' : 'Unlock Stamp'}</span>
          <span>▷</span>
        </Link>

        {isUnlocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              sounds.playPop();
              onEditNoteClick(stamp);
            }}
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            title="Edit couple date note"
          >
            <span>✎ Note</span>
          </button>
        )}
      </div>
    </div>
  );
}

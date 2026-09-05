'use client';

import React from 'react';

export interface ConnectionRibbonProps {
  connected: boolean;
  partnerOnline: boolean;
  leftAvatar: React.ReactNode;
  rightAvatar: React.ReactNode;
  leftName: string;
  rightName: string;
  leftTime?: string;
  rightTime?: string;
  leftLocation?: string;
  rightLocation?: string;
  leftReady?: boolean;
  rightReady?: boolean;
}

export function ConnectionRibbon({
  connected,
  partnerOnline,
  leftAvatar,
  rightAvatar,
  leftName,
  rightName,
  leftTime,
  rightTime,
  leftLocation,
  rightLocation,
  leftReady = false,
  rightReady = false,
}: ConnectionRibbonProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 1fr) auto minmax(120px, 1fr)',
        alignItems: 'center',
        gap: '16px',
        padding: '24px 20px',
        background: 'var(--paper-raised)',
        border: '1px solid var(--line)',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-soft)',
        width: '100%',
        maxWidth: '840px',
        margin: '0 auto',
      }}
    >
      {/* Left Partner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, var(--pink), var(--blue))',
              border: `3px solid ${leftReady ? '#10B981' : 'var(--line)'}`,
              boxShadow: leftReady ? '0 0 14px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
            }}
          >
            {leftAvatar}
          </div>
          {leftReady && (
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: '#10B981',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 900,
                borderRadius: '999px',
                padding: '2px 7px',
                border: '2px solid #fff',
              }}
            >
              READY ♡
            </span>
          )}
        </div>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginTop: '4px' }}>{leftName}</strong>
        {leftLocation && <small style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{leftLocation}</small>}
        {leftTime && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--pink)', fontWeight: 700 }}>
            {leftTime}
          </div>
        )}
      </div>

      {/* Ribbon Connector */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '0 8px',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'clamp(70px, 12vw, 150px)',
          }}
        >
          {/* Animated Ribbon Strand */}
          <div
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '999px',
              background: partnerOnline
                ? 'linear-gradient(90deg, var(--pink), var(--blue), var(--pink))'
                : 'var(--line)',
              backgroundSize: '200% 100%',
              animation: partnerOnline ? 'ribbon-flow 3s linear infinite' : 'none',
              transition: 'background 0.4s ease',
            }}
          />

          {/* Heart Emblem */}
          <div
            style={{
              position: 'absolute',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: partnerOnline ? 'linear-gradient(135deg, var(--pink), #FF85A1)' : 'var(--paper)',
              border: `2px solid ${partnerOnline ? '#FFF' : 'var(--line)'}`,
              boxShadow: partnerOnline ? '0 0 10px rgba(255, 78, 120, 0.5)' : 'none',
              color: partnerOnline ? '#FFF' : 'var(--ink-soft)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '13px',
              fontWeight: 900,
              transition: 'all 0.3s ease',
            }}
          >
            ♡
          </div>
        </div>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 800,
            color: partnerOnline ? '#10B981' : 'var(--ink-soft)',
          }}
        >
          {partnerOnline ? 'Together In Room' : connected ? 'Partner Offline' : 'Waiting for Partner'}
        </span>
      </div>

      {/* Right Partner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, var(--blue), #5BA2F4)',
              border: `3px solid ${rightReady ? '#10B981' : 'var(--line)'}`,
              boxShadow: rightReady ? '0 0 14px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(0,0,0,0.06)',
              filter: partnerOnline ? 'none' : 'grayscale(0.5)',
              opacity: partnerOnline ? 1 : 0.7,
              transition: 'all 0.3s ease',
            }}
          >
            {rightAvatar}
          </div>
          {rightReady && (
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: '#10B981',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 900,
                borderRadius: '999px',
                padding: '2px 7px',
                border: '2px solid #fff',
              }}
            >
              READY ♡
            </span>
          )}
        </div>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginTop: '4px' }}>{rightName}</strong>
        {rightLocation && <small style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{rightLocation}</small>}
        {rightTime && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--blue)', fontWeight: 700 }}>
            {rightTime}
          </div>
        )}
      </div>
    </div>
  );
}

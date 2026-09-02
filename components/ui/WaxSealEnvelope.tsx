'use client';

import React, { useState } from 'react';
import { sounds } from '@/lib/sound';

interface WaxSealEnvelopeProps {
  sender?: string;
  recipient?: string;
  sealDate?: string;
  letterContent: React.ReactNode;
  className?: string;
  onOpen?: () => void;
}

export function WaxSealEnvelope({
  sender = 'Alex',
  recipient = 'Mia',
  sealDate = 'Sealed until 2030',
  letterContent,
  className = '',
  onOpen,
}: WaxSealEnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const handleBreakSeal = () => {
    if (isOpen || isOpening) return;
    setIsOpening(true);
    sounds.playWaxCrack();
    
    // Play tactile parchment unfolding sound as letter slides out
    setTimeout(() => {
      sounds.playParchmentUnfold();
    }, 320);

    setTimeout(() => {
      setIsOpen(true);
      onOpen?.();
    }, 850);
  };

  return (
    <div
      className={`perspective-container ${className}`}
      style={{
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        minHeight: isOpen ? 'auto' : '380px',
        position: 'relative',
      }}
    >
      {!isOpen ? (
        /* Sealed Envelope 3D Stage */
        <div
          onClick={handleBreakSeal}
          className={`card-3d ${isOpening ? 'envelope-opening' : ''}`}
          style={{
            background: '#F0E5D8',
            border: '2px solid #D6C3B0',
            borderRadius: '16px',
            padding: '40px 30px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12), inset 0 0 20px rgba(180,150,120,0.15)',
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0, rgba(0,0,0,0.01) 2px, transparent 0, transparent 4px)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {/* Diagonal Envelope Crease Lines */}
          <svg
            viewBox="0 0 500 300"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              stroke: '#D6C3B0',
              strokeWidth: '1.5',
            }}
          >
            <path d="M0 0 L250 160 L500 0" fill="none" opacity="0.6" />
            <path d="M0 300 L200 130" fill="none" opacity="0.4" />
            <path d="M500 300 L300 130" fill="none" opacity="0.4" />
          </svg>

          {/* Postal Address Stamp */}
          <div style={{ textAlign: 'center', zIndex: 2, marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '.14em', color: '#8C6E54', textTransform: 'uppercase' }}>
              TIME CAPSULE VAULT · PAR AVION
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#3A2E24', margin: '6px 0 2px' }}>
              To: {recipient}
            </h3>
            <span style={{ fontSize: '13px', color: '#8C6E54', fontStyle: 'italic' }}>From: {sender} · {sealDate}</span>
          </div>

          {/* 3D Wax Seal Stamp with Realistic Jagged Crack Physics */}
          <div
            style={{
              position: 'relative',
              width: '84px',
              height: '84px',
              zIndex: 10,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {/* Left Seal Half */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #E63946 0%, #9B111E 70%, #5E000B 100%)',
                boxShadow: '0 8px 24px rgba(155, 17, 30, 0.45), inset 0 2px 3px rgba(255,255,255,0.4)',
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFE5EC',
                fontSize: '32px',
                fontWeight: 900,
                clipPath: 'polygon(0 0, 52% 0, 48% 30%, 54% 60%, 47% 100%, 0 100%)',
                transform: isOpening ? 'translate(-30px, -10px) rotate(-22deg)' : 'none',
                opacity: isOpening ? 0 : 1,
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.65s ease',
              }}
            >
              ♡
            </div>

            {/* Right Seal Half */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #E63946 0%, #9B111E 70%, #5E000B 100%)',
                boxShadow: '0 8px 24px rgba(155, 17, 30, 0.45), inset 0 2px 3px rgba(255,255,255,0.4)',
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFE5EC',
                fontSize: '32px',
                fontWeight: 900,
                clipPath: 'polygon(52% 0, 100% 0, 100% 100%, 47% 100%, 54% 60%, 48% 30%)',
                transform: isOpening ? 'translate(30px, 10px) rotate(22deg)' : 'none',
                opacity: isOpening ? 0 : 1,
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.65s ease',
              }}
            >
              ♡
            </div>

            {/* Breaking Wax Particle Flecks */}
            {isOpening && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                {['✨', '💥', '✨'].map((p, i) => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      fontSize: '16px',
                      animation: 'ping 0.6s ease-out forwards',
                      transform: `translate(${(i - 1) * 28}px, ${(i % 2 === 0 ? -1 : 1) * 20}px)`,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          <span
            style={{
              marginTop: '20px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: '#8C6E54',
              fontWeight: 700,
              letterSpacing: '.06em',
              zIndex: 2,
            }}
          >
            {isOpening ? '🕯️ Wax seal cracking...' : '✨ Tap wax seal to break & open letter ▷'}
          </span>
        </div>
      ) : (
        /* Unfolded Letter Reading Stage */
        <div
          className="letter-rising"
          style={{
            background: '#FFFDF9',
            border: '1px solid #E6D9C8',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
            position: 'relative',
          }}
        >
          {/* Top Wax Seal Remnant Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFF0F3',
              color: '#C93B6B',
              padding: '4px 12px',
              borderRadius: '999px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 800,
              marginBottom: '20px',
            }}
          >
            ✓ SEAL BROKEN · SEALED IN THE VAULT
          </div>

          {letterContent}
        </div>
      )}
    </div>
  );
}

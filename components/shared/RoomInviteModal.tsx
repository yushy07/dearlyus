'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from '@/lib/qrcode';
import { sounds } from '@/lib/sound';

interface RoomInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  activityName: string;
  partnerAName?: string;
  activitySlug?: string;
}

export function RoomInviteModal({
  isOpen,
  onClose,
  roomCode,
  activityName,
  partnerAName = 'Partner A',
  activitySlug = 'photobooth',
}: RoomInviteModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://getangie.com';
  const joinUrl = `${origin}/${activitySlug}?room=${roomCode}`;

  const handleCopyLink = () => {
    sounds.playTick();
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyCode = () => {
    sounds.playTick();
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const shareText = `Hey love! 💕 Join me in our shared ${activityName} room on Angie:\nRoom Code: ${roomCode}\n${joinUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(12, 14, 18, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fade-in 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playPop();
          onClose();
        }
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 0 40px rgba(255,123,163,0.15)',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
          position: 'relative',
        }}
      >
        {/* Top Airline Boarding Pass Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FF7BA3, #FF9E64)',
            padding: '18px 20px 16px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>💌</span>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.95 }}>
                Love Airlines Boarding Pass
              </span>
            </div>
            <button
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                color: '#FFFFFF',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 2px' }}>
            Invite {partnerAName ? `${partnerAName}'s Partner` : 'Your Partner'}
          </h3>
          <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>
            Activity: <b>{activityName}</b>
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          {/* Big Scannable QR Code with Heart Center */}
          <div
            style={{
              padding: '14px',
              borderRadius: '20px',
              background: '#F8F9FC',
              border: '2px solid #F0F2F6',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              position: 'relative',
            }}
          >
            <QRCodeSVG text={joinUrl} size={190} fgColor="#17181C" bgColor="#F8F9FC" />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '20px',
              }}
            >
              💖
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink-soft)', fontWeight: 700 }}>
              Scan with phone camera to join instantly
            </span>

            {/* Room Code Pill with 1-Tap Copy */}
            <div
              onClick={handleCopyCode}
              title="Click to copy code"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                padding: '8px 18px',
                borderRadius: '30px',
                background: 'var(--pink-tint)',
                border: '1.5px solid var(--pink)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--pink)', fontWeight: 700 }}>ROOM CODE:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 900, color: 'var(--ink)', letterSpacing: '2px' }}>
                {roomCode}
              </span>
              <span style={{ fontSize: '12px' }}>{copiedCode ? '✓' : '📋'}</span>
            </div>
          </div>

          {/* Realtime Waiting Radar Pulse */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 10px #10B981',
                animation: 'pulse 1.5s infinite',
                display: 'inline-block',
              }}
            />
            <span>Waiting for partner to enter room...</span>
          </div>

          {/* Action Buttons: WhatsApp & Copy Link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '4px' }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playPop()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '11px 14px',
                borderRadius: '12px',
                background: '#25D366',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              }}
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>

            <button
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '11px 14px',
                borderRadius: '12px',
                background: copiedLink ? '#10B981' : 'var(--paper-raised)',
                color: copiedLink ? '#FFFFFF' : 'var(--ink)',
                border: '1.5px solid var(--line)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{copiedLink ? '✓' : '🔗'}</span>
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

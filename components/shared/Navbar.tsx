import React from 'react';
import Link from 'next/link';
import { AuthButton } from './AuthButton';

interface NavbarProps {
  roomCode?: string;
  rightAction?: React.ReactNode;
}

export function Navbar({ roomCode, rightAction }: NavbarProps) {
  return (
    <header className="bar">
      <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link className="brand" href="/" aria-label="Dearly Us Home">
            <span className="brand-emblem" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 128 128" fill="none">
                <rect width="128" height="128" rx="36" fill="#1C1924" />
                <path d="M64 77 C51 93 29 86 29 64 C29 45 48 38 64 58" stroke="#FF4E78" strokeWidth="12" strokeLinecap="round" />
                <path d="M64 58 C80 38 99 45 99 64 C99 86 77 93 64 77" stroke="#437EEB" strokeWidth="12" strokeLinecap="round" />
                <circle cx="64" cy="67" r="5" fill="#FFFFFF" />
              </svg>
            </span>
            <span className="brand-dearly">Dearly</span>
            <span className="brand-us">Us</span>
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>

          {/* Desktop Quick Nav */}
          <nav className="navbar-quick-links" style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13.5px', fontWeight: 600 }}>
            <Link href="/photobooth" style={{ color: 'var(--ink)' }}>
              📸 Photobooth
            </Link>
            <Link href="/timezone" style={{ color: 'var(--ink-soft)' }}>
              🌍 Timezone
            </Link>
            <Link href="/quiz" style={{ color: 'var(--ink-soft)' }}>
              ❓ Quizzes
            </Link>
            <Link href="/host" style={{ color: 'var(--ink-soft)' }}>
              🎙️ Date Host
            </Link>
            <Link href="/bucket" style={{ color: 'var(--ink-soft)' }}>
              🎯 100 Dates
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {roomCode && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: 'var(--paper-raised)',
                padding: '5px 12px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }}></span>
              ROOM: <b style={{ color: 'var(--pink)' }}>{roomCode}</b>
            </span>
          )}

          {rightAction ?? (
            <>
              <AuthButton />
              <Link className="btn btn-primary" href="/activity" style={{ fontSize: '13px', padding: '6px 14px' }}>
                All Activities ▷
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

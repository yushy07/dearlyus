import React from 'react';
import Link from 'next/link';

interface NavbarProps {
  roomCode?: string;
  rightAction?: React.ReactNode;
}

export function Navbar({ roomCode, rightAction }: NavbarProps) {
  return (
    <header className="bar">
      <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link className="brand" href="/">
            angie
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
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a7d4d', display: 'inline-block' }}></span>
              ROOM: <b>{roomCode}</b>
            </span>
          )}

          {rightAction ?? (
            <Link className="btn btn-primary" href="/activity" style={{ fontSize: '13px', padding: '6px 14px' }}>
              All Activities ▷
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

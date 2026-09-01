import React from 'react';
import Link from 'next/link';

interface NavbarProps {
  roomCode?: string;
  rightAction?: React.ReactNode;
}

export function Navbar({ roomCode, rightAction }: NavbarProps) {
  return (
    <header className="bar">
      <div className="wrap">
        <Link className="brand" href="/">
          angie
          <span className="dots">
            <i className="p"></i>
            <i className="b"></i>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <Link className="btn btn-ghost" href="/activity" style={{ fontSize: '13px', padding: '6px 12px' }}>
              Activities ▷
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthButton } from './AuthButton';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';

interface NavbarProps {
  roomCode?: string;
  activityName?: string;
  rightAction?: React.ReactNode;
  onLeaveRoom?: () => void;
}

export function Navbar({
  roomCode,
  activityName,
  rightAction,
  onLeaveRoom,
}: NavbarProps) {
  const router = useRouter();
  const { user } = useSupabaseSession();
  const { space, partner, partnerConnected } = useCoupleSpace();

  const handleDefaultLeave = () => {
    if (onLeaveRoom) {
      onLeaveRoom();
    } else {
      router.push('/our-space');
    }
  };

  const isInsideRoom = Boolean(roomCode);

  return (
    <header className="bar">
      <div
        className="wrap"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link className="brand" href="/" aria-label="Dearly Us Home">
            <span className="brand-emblem" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 128 128" fill="none">
                <rect width="128" height="128" rx="36" fill="#0F172A" />
                <path
                  d="M64 77 C51 93 29 86 29 64 C29 45 48 38 64 58"
                  stroke="#F472B6"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M64 58 C80 38 99 45 99 64 C99 86 77 93 64 77"
                  stroke="#60A5FA"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
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

          {/* Quick Nav for desktop (shown when not in room) */}
          {!isInsideRoom && (
            <nav
              className="navbar-quick-links"
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            >
              <Link href="/photobooth" style={{ color: 'var(--ink)' }}>
                📸 Photobooth
              </Link>
              <Link href="/timezone" style={{ color: 'var(--ink-soft)' }}>
                🌍 Timezone
              </Link>
              <Link href="/quiz" style={{ color: 'var(--ink-soft)' }}>
                ❓ Quizzes
              </Link>
              <Link href="/activity" style={{ color: 'var(--ink-soft)' }}>
                ✨ All Dates
              </Link>
            </nav>
          )}

          {/* In-room context display */}
          {isInsideRoom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                    display: 'inline-block',
                  }}
                />
                ROOM: <b style={{ color: 'var(--pink)' }}>{roomCode}</b>
              </span>
              {activityName && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--ink-soft)',
                  }}
                >
                  · {activityName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Nav Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {rightAction ? (
            rightAction
          ) : isInsideRoom ? (
            // 4. Inside Live Room State
            <>
              <Link
                className="btn btn-ghost"
                href={`/room/${roomCode}`}
                style={{ fontSize: '13px', padding: '6px 12px' }}
              >
                Lobby ▷
              </Link>
              <button
                className="btn btn-ghost"
                onClick={handleDefaultLeave}
                style={{
                  fontSize: '13px',
                  padding: '6px 12px',
                  color: '#a51d3c',
                }}
              >
                Leave room
              </button>
            </>
          ) : user && partnerConnected ? (
            // 3. Paired but Outside Room State
            <>
              <AuthButton />
              <Link
                className="btn btn-primary"
                href={
                  space?.activeRoomCode
                    ? `/room/${space.activeRoomCode}`
                    : '/our-space'
                }
                style={{ fontSize: '13px', padding: '6px 14px' }}
              >
                Start date night ▷
              </Link>
            </>
          ) : (
            // 1 & 2. Signed Out OR Signed in Unpaired State
            <>
              <AuthButton />
              <Link
                className="btn btn-grad"
                href="/activity"
                style={{ fontSize: '13px', padding: '6px 16px' }}
              >
                Browse activities ▷
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import { BrandLogo } from '@/components/shared/BrandLogo';
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
    <>
      <header className="bar" role="banner">
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Brand Emblem & Logo */}
            <Link className="brand" href="/" aria-label="Dearly Us Home">
              <BrandLogo tone="light" />
            </Link>

            {/* Desktop Navigation Links */}
            {!isInsideRoom && (
              <nav
                className="navbar-unified-links"
                aria-label="Main Navigation"
              >
                <Link href="/activity">Activities</Link>
                <Link href="/photobooth">Photobooth</Link>
                <Link href="/passport" className="nav-passport-pill">
                  <span>💮</span>
                  <span>Passport</span>
                </Link>
                <Link href="/our-space">Our Space</Link>
                <Link href="/blog">Blog</Link>
                <Link href="/#faq">FAQ</Link>
                <Link
                  href="/shop"
                  className="nav-shop-icon"
                  aria-label="Print shop"
                  title="Print shop"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 8h14l-1.2 12.1a1.5 1.5 0 0 1-1.5 1.4H7.7a1.5 1.5 0 0 1-1.5-1.4L5 8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
              </nav>
            )}

            {/* In-room context display */}
            {isInsideRoom && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#ffffff',
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
                  ROOM: <b style={{ color: '#F472B6' }}>{roomCode}</b>
                </span>
                {activityName && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    · {activityName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Nav Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            {rightAction ? (
              rightAction
            ) : isInsideRoom ? (
              // Inside Live Room State
              <>
                <Link
                  className="btn btn-ghost"
                  href={`/room/${roomCode}`}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '9999px',
                  }}
                >
                  Lobby ▷
                </Link>
                <button
                  className="btn btn-ghost"
                  onClick={handleDefaultLeave}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    color: '#fca5a5',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '9999px',
                  }}
                >
                  Leave room
                </button>
              </>
            ) : user && partnerConnected ? (
              // Paired Outside Room State
              <>
                <AuthButton />
                <Link
                  className="btn btn-primary"
                  href={
                    space?.activeRoomCode
                      ? `/room/${space.activeRoomCode}`
                      : '/our-space'
                  }
                  style={{
                    fontSize: '12.5px',
                    padding: '7px 16px',
                    borderRadius: '9999px',
                  }}
                >
                  Start date night ▷
                </Link>
              </>
            ) : (
              // Default Signed Out / Unpaired State
              <>
                <AuthButton />
                <Link
                  className="btn btn-grad"
                  href="/activity"
                  style={{
                    fontSize: '12px',
                    padding: '7px 16px',
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  Browse activities ▷
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sounds } from '@/lib/sound';
import { useActiveRoom } from '@/contexts/ActiveRoomContext';

interface RoomCodeJoinerProps {
  roomCode: string[];
  setRoomCode: (code: string[]) => void;
}

export function RoomCodeJoiner({ roomCode, setRoomCode }: RoomCodeJoinerProps) {
  const router = useRouter();
  const { room, createRoom, joinRoom, loading } = useActiveRoom();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const code = roomCode.join('');
  const handleCodeChange = (value: string) =>
    setRoomCode(
      value
        .replace(/[^a-z0-9]/gi, '')
        .toUpperCase()
        .slice(0, 16)
        .split(''),
    );

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openNewRoom = async () => {
    sounds.playPop();
    setError('');
    try {
      const created = await createRoom();
      setRoomCode(created.code.split(''));
      router.push(`/room/${encodeURIComponent(created.code)}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Sign in to open a shared room.',
      );
    }
  };

  const joinExistingRoom = async () => {
    if (code.length < 8) {
      setError('Enter the complete 8–16 character room code.');
      return;
    }
    sounds.playPop();
    setError('');
    try {
      const joined = await joinRoom(code);
      router.push(`/room/${encodeURIComponent(joined.code)}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That room could not be joined.',
      );
    }
  };

  return (
    <div className="home-room" style={{ padding: '64px 0 54px' }}>
      {/* Closer Headline & Interactive Code Joiner */}
      <section className="section closer" style={{ padding: 0, margin: 0 }}>
        <div className="wrap">
          <div className="closer-grid">
            <div>
              <h2>
                Your person.
                <br />
                <span className="grad">Your little world.</span>
              </h2>
            </div>
            <div className="closer-aside">
              <p>
                Thirty-five realtime activities and intimate dates you
                experience in one shared room, at the exact same second. Open a
                private room and send the code — your partner will be there in
                one tap.
              </p>
              <div className="cta-row">
                <Link className="btn btn-grad" href="/activity">
                  Browse all activities <span className="arr">▷</span>
                </Link>
                <Link className="btn btn-ghost" href="/photobooth">
                  Open Photobooth Studio
                </Link>
              </div>
              <div className="joincode">
                <label htmlFor="home-room-code">have a code?</label>
                <input
                  id="home-room-code"
                  type="text"
                  value={code}
                  onChange={(event) => handleCodeChange(event.target.value)}
                  placeholder="ENTER ROOM CODE"
                  autoComplete="off"
                  aria-describedby={error ? 'home-room-error' : undefined}
                  style={{
                    width: '190px',
                    height: '42px',
                    padding: '0 12px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--paper-raised)',
                    color: 'var(--ink)',
                    letterSpacing: '0.08em',
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={joinExistingRoom}
                  disabled={loading || code.length < 8}
                >
                  {loading ? 'Connecting…' : 'Join'}
                </button>
                <button
                  onClick={copyCode}
                  disabled={!code}
                  style={{
                    border: '1px solid var(--line)',
                    background: 'var(--paper-raised)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    marginLeft: '8px',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={openNewRoom}
                  disabled={loading}
                  style={{
                    border: '1px solid var(--line)',
                    background: 'var(--paper-raised)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    marginLeft: '4px',
                  }}
                  title="Open a new private room in Supabase"
                >
                  {room ? 'Open another' : 'New room'}
                </button>
              </div>
              {error && (
                <p
                  id="home-room-error"
                  role="alert"
                  style={{
                    marginTop: 8,
                    color: 'var(--burgundy)',
                    fontSize: 13,
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band (Social Proof) */}
      <section
        className="section stats"
        id="stats"
        style={{ padding: '48px 0 0', margin: 0 }}
      >
        <div className="wrap">
          <div className="statgrid">
            <div className="stat">
              <div className="n">24</div>
              <div className="l">activities built for two</div>
            </div>
            <div className="stat">
              <div className="n">2</div>
              <div className="l">screens in one private room</div>
            </div>
            <div className="stat">
              <div className="n">1</div>
              <div className="l">shared space that follows you</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

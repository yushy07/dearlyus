'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';

interface RoomCodeJoinerProps {
  roomCode: string[];
  setRoomCode: (code: string[]) => void;
}

export function RoomCodeJoiner({ roomCode, setRoomCode }: RoomCodeJoinerProps) {
  const [copied, setCopied] = useState(false);
  const [datesCount, setDatesCount] = useState(14820);
  const [sessionsCount, setSessionsCount] = useState(38940);
  const [stripsCount, setStripsCount] = useState(52180);

  // Stats count up on view
  useEffect(() => {
    let start: number | null = null;
    const duration = 1600;
    const targetDates = 24890;
    const targetSessions = 18450;
    const targetStrips = 52180;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setDatesCount(Math.floor(targetDates * ease));
      setSessionsCount(Math.floor(targetSessions * ease));
      setStripsCount(Math.floor(targetStrips * ease));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, []);

  const handleCellChange = (index: number, val: string) => {
    if (!val) return;
    const next = [...roomCode];
    next[index] = val.slice(-1).toUpperCase();
    setRoomCode(next);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode.join(''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewCode = () => {
    sounds.playPop();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const fresh = Array.from(
      { length: 5 },
      () => chars[Math.floor(Math.random() * chars.length)],
    );
    setRoomCode(fresh);
  };

  return (
    <div style={{ background: '#FAF0D4', padding: '64px 0 54px' }}>
      {/* Closer Headline & Interactive Code Joiner */}
      <section className="section closer" style={{ padding: 0, margin: 0 }}>
        <div className="wrap">
          <div className="closer-grid">
            <div>
              <h2>
                One sanctuary of games &amp; moments for{' '}
                <span className="grad">two hearts apart</span>.
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
                have a code? &nbsp;
                <div className="cells">
                  {roomCode.map((char, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleCellChange(idx, e.target.value)}
                      style={{
                        width: '36px',
                        height: '42px',
                        textAlign: 'center',
                        border: '1.5px solid var(--line)',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '17px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--paper-raised)',
                        color: 'var(--ink)',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={copyCode}
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
                  onClick={generateNewCode}
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
                  title="Generate Fresh Private Room"
                >
                  🎲 New
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band (Social Proof) */}
      <section className="section stats" id="stats" style={{ padding: '48px 0 0', margin: 0 }}>
        <div className="wrap">
          <div className="statgrid">
            <div className="stat">
              <div className="n">{datesCount.toLocaleString()}+</div>
              <div className="l">active dates</div>
            </div>
            <div className="stat">
              <div className="n">{sessionsCount.toLocaleString()}+</div>
              <div className="l">photobooth sessions</div>
            </div>
            <div className="stat">
              <div className="n">{stripsCount.toLocaleString()}+</div>
              <div className="l">photostrips printed</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SceneBackdrop } from './SceneBackdrop';

interface InteractivePlaygroundProps {
  partnerA: string;
  partnerB: string;
  cityA?: string;
  cityB?: string;
  roomCode: string[];
}

export function InteractivePlayground({
  partnerA,
  partnerB,
  cityA = 'Calgary',
  cityB = 'Jakarta',
  roomCode,
}: InteractivePlaygroundProps) {
  // Photobooth machine simulator state
  const [litFrames, setLitFrames] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [shotStep, setShotStep] = useState<number>(0);
  const [countNum, setCountNum] = useState<string>('');
  const [flashing, setFlashing] = useState<boolean>(false);

  // Photobooth develop cycle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const runCycle = () => {
      setLitFrames([false, false, false, false]);
      setShotStep(0);

      const shootFrame = (frameIdx: number) => {
        if (frameIdx >= 4) {
          setShotStep(4);
          timer = setTimeout(runCycle, 9000);
          return;
        }

        // 3..2..1 countdown
        setCountNum('3');
        setTimeout(() => setCountNum('2'), 500);
        setTimeout(() => setCountNum('1'), 1000);
        setTimeout(() => {
          setCountNum('');
          setFlashing(true);
          setTimeout(() => setFlashing(false), 280);

          setLitFrames((prev) => {
            const next = [...prev];
            next[frameIdx] = true;
            return next;
          });
          setShotStep(frameIdx + 1);

          timer = setTimeout(() => shootFrame(frameIdx + 1), 600);
        }, 1500);
      };

      timer = setTimeout(() => shootFrame(0), 1800);
    };

    runCycle();
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="hero home-landscape"
      id="top"
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '32px',
        paddingBottom: '64px',
      }}
    >
      <SceneBackdrop scene="landscape" />

      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero-copy">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            <span className="eyebrow" style={{ margin: 0 }}>
              LIVE CO-PRESENCE STAGE · {cityA.toUpperCase()} ⟷{' '}
              {cityB.toUpperCase()}
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--pink)',
                background: 'var(--pink-tint)',
                border: '1px solid rgba(244, 114, 182, 0.3)',
                padding: '4px 12px',
                borderRadius: '9999px',
              }}
            >
              ✈ Countdown till next time we meet +
            </div>
          </div>

          <h2>
            A little closer.
            <br />
            <em>Even from here.</em>
          </h2>

          <p className="lede">
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>
              Synchronized across any distance.
            </span>{' '}
            Spin the interactive 3D globe to check flight paths and live
            distance, or snap authentic Korean Life4Cuts photostrips together
            across the miles.
          </p>

          <div className="cta-row">
            <Link className="btn btn-grad btn-3d" href="/activity">
              Pick an activity <span className="arr">▷</span>
            </Link>
            <Link className="btn btn-ghost btn-3d" href="/photobooth">
              Open the photobooth
            </Link>
          </div>

          <div
            className="home-browser-note"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              padding: '8px 18px',
              borderRadius: '30px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--ink)',
              }}
            >
              Instant Web App · No downloads or installs needed
            </span>
          </div>

          <p className="assure">
            <span>● {partnerA || 'You'}</span> &nbsp;♡&nbsp;{' '}
            <span>● {partnerB || 'Love'}</span>
          </p>
        </div>

        {/* Hero 3D Globe Projection & Photobooth Machine */}
        <div className="stage">
          <div className="globe">
            <svg className="gl-map" viewBox="0 0 600 600" aria-hidden="true">
              <defs>
                <radialGradient id="gl-sphere" cx="34%" cy="27%" r="78%">
                  <stop offset="0%" stopColor="#9FD2F5" />
                  <stop offset="34%" stopColor="#79B7EA" />
                  <stop offset="68%" stopColor="#5495D6" />
                  <stop offset="100%" stopColor="#3A6FAE" />
                </radialGradient>
                <linearGradient
                  id="gl-landfill"
                  x1=".15"
                  y1="0"
                  x2=".9"
                  y2=".9"
                >
                  <stop offset="0%" stopColor="#6FD189" />
                  <stop offset="45%" stopColor="#41B76B" />
                  <stop offset="78%" stopColor="#2A9A57" />
                  <stop offset="100%" stopColor="#1C7A47" />
                </linearGradient>
                <linearGradient id="gl-arc-a" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor="#F472B6" stopOpacity=".15" />
                  <stop offset="100%" stopColor="#F472B6" stopOpacity=".95" />
                </linearGradient>
                <linearGradient id="gl-arc-b" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity=".15" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity=".95" />
                </linearGradient>
                <clipPath id="gl-clip">
                  <circle cx="300" cy="300" r="252" />
                </clipPath>
              </defs>

              {/* Lit sphere background */}
              <circle
                cx="300"
                cy="300"
                r="252"
                fill="#7FC0FF"
                opacity=".40"
                className="gl-halo"
              />
              <circle cx="300" cy="300" r="252" fill="url(#gl-sphere)" />

              {/* Globe continent paths & graticules */}
              <g clipPath="url(#gl-clip)">
                <path
                  className="gl-land"
                  d="M 120 180 Q 180 140 240 180 T 360 220 T 460 160 Q 520 220 480 340 T 360 440 T 200 420 Q 110 320 120 180 Z"
                />
                <path
                  className="gl-glow"
                  d="M 140 200 Q 200 160 260 200 T 380 240 T 440 180 Q 490 230 460 330 T 340 420 T 220 400 Z"
                />
                <ellipse
                  cx="300"
                  cy="300"
                  rx="210"
                  ry="250"
                  className="gl-grat"
                />
                <ellipse
                  cx="300"
                  cy="300"
                  rx="140"
                  ry="250"
                  className="gl-grat"
                />
                <ellipse
                  cx="300"
                  cy="300"
                  rx="70"
                  ry="250"
                  className="gl-grat"
                />
                <line x1="300" y1="48" x2="300" y2="552" className="gl-grat" />
                <line x1="48" y1="300" x2="552" y2="300" className="gl-grat" />
                <line x1="80" y1="200" x2="520" y2="200" className="gl-grat" />
                <line x1="80" y1="400" x2="520" y2="400" className="gl-grat" />

                {/* Connecting Arcs */}
                <path
                  d="M 478 214 C 418 188 360 220 320 286"
                  className="gl-arc pink"
                />
                <path
                  d="M 126 392 C 188 420 244 386 282 312"
                  className="gl-arc blue"
                />
              </g>
            </svg>

            {/* Partner A Node */}
            <figure className="gnode a">
              <span className="gpin" aria-hidden="true"></span>
              <span className="gring" aria-hidden="true"></span>
              <img
                className="gface"
                src="/photos/face-calgary.webp"
                width="92"
                height="92"
                alt={`One half of the couple in ${cityA}`}
              />
              <figcaption className="gcard">
                <b>{cityA}</b>
                <span>{partnerA}</span>
              </figcaption>
            </figure>

            {/* Partner B Node */}
            <figure className="gnode b">
              <span className="gpin" aria-hidden="true"></span>
              <span className="gring" aria-hidden="true"></span>
              <img
                className="gface"
                src="/photos/face-jakarta.webp"
                width="92"
                height="92"
                alt={`Other half of the couple in ${cityB}`}
              />
              <figcaption className="gcard">
                <b>{cityB}</b>
                <span>{partnerB}</span>
              </figcaption>
            </figure>

            {/* The Photobooth Machine */}
            <div className="booth">
              <div className="booth-head" aria-hidden="true">
                <span className="bh-light l"></span>
                <span className="bh-lens"></span>
                <span className="bh-light r"></span>
                <span className="bh-slot"></span>
              </div>

              <div className="prints">
                {/* Active Animated Strip */}
                <div className="strip" id="strip">
                  <div className="shotcount">
                    shot {shotStep} / 4 {shotStep === 4 ? '✓' : ''}
                  </div>
                  <div className="count">
                    <span className="num">{countNum}</span>
                  </div>
                  {flashing && (
                    <div className="flash" style={{ opacity: 0.9 }}></div>
                  )}

                  <div className={`frame ${litFrames[0] ? 'lit' : ''}`}>
                    <span className="num">01</span>
                    <img
                      className="shot"
                      src="/photos/frame1.webp"
                      width="503"
                      height="377"
                      alt="Photobooth shot 1"
                    />
                  </div>
                  <div className={`frame ${litFrames[1] ? 'lit' : ''}`}>
                    <span className="num">02</span>
                    <img
                      className="shot"
                      src="/photos/frame2.webp"
                      width="503"
                      height="377"
                      alt="Photobooth shot 2"
                    />
                  </div>
                  <div className={`frame ${litFrames[2] ? 'lit' : ''}`}>
                    <span className="num">03</span>
                    <img
                      className="shot"
                      src="/photos/frame3.webp"
                      width="503"
                      height="377"
                      alt="Photobooth shot 3"
                    />
                  </div>
                  <div className={`frame ${litFrames[3] ? 'lit' : ''}`}>
                    <span className="num">04</span>
                    <img
                      className="shot"
                      src="/photos/frame4.webp"
                      width="503"
                      height="377"
                      alt="Photobooth shot 4"
                    />
                  </div>
                  <div className="serial">
                    dearly us · <b>{roomCode.join('') || 'YOUR ROOM'}</b>
                  </div>
                </div>

                {/* Secondary Decorative Strip */}
                <div className="strip" id="strip2" aria-hidden="true">
                  <div className="frame lit">
                    <span className="num">01</span>
                    <img
                      className="shot"
                      src="/photos/b1.webp"
                      width="503"
                      height="377"
                      alt=""
                    />
                  </div>
                  <div className="frame lit">
                    <span className="num">02</span>
                    <img
                      className="shot"
                      src="/photos/b2.webp"
                      width="503"
                      height="377"
                      alt=""
                    />
                  </div>
                  <div className="frame lit">
                    <span className="num">03</span>
                    <img
                      className="shot"
                      src="/photos/b3.webp"
                      width="503"
                      height="377"
                      alt=""
                    />
                  </div>
                  <div className="frame lit">
                    <span className="num">04</span>
                    <img
                      className="shot"
                      src="/photos/b4.webp"
                      width="503"
                      height="377"
                      alt=""
                    />
                  </div>
                  <div className="serial">
                    dearly us · <b>7K2QF</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

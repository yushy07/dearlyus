'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SceneBackdrop } from './SceneBackdrop';
import { HeroEarthGlobe } from './HeroEarthGlobe';

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
              LIVE CO-PRESENCE STAGE · {cityA.toUpperCase()} ♡{' '}
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
              Under the same sky · together right now
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
            Turn the shared Earth to find both your places under one sky, or
            make an authentic Korean Life4Cuts photostrip together from wherever
            you are.
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
            <HeroEarthGlobe cityA={cityA} cityB={cityB} />

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

            {/* The instant camera and its developing four-cut print */}
            <div className="booth">
              <div
                className={`booth-head ${flashing ? 'is-flashing' : ''}`}
                aria-hidden="true"
              >
                <span className="bh-brand">dearly us.</span>
                <span className="bh-viewfinder"></span>
                <span className="bh-flash"></span>
                <span className="bh-shutter"></span>
                <span className="bh-lens">
                  <i></i>
                </span>
                <span className="bh-film-count">
                  {String(Math.min(shotStep + 1, 4)).padStart(2, '0')}
                </span>
                <span className="bh-body-band"></span>
                <span className="bh-slot">
                  <i></i>
                </span>
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
                    <span>a little closer.</span>
                    <b>dearly us · {roomCode.join('') || 'YOUR ROOM'}</b>
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

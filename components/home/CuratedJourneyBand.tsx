'use client';

import React from 'react';
import Link from 'next/link';

export function CuratedJourneyBand() {
  return (
    <section
      className="section august-band"
      id="curated-journey"
      style={{
        background: '#EEBFD1',
        padding: '64px 0',
        margin: 0,
      }}
    >
      <div className="wrap">
        <Link className="august-card" href="/date">
          <span className="august-art">
            <img
              src="/august/gate.webp"
              alt="Watercolor painting of a couple walking into a romantic garden"
              width="1440"
              height="930"
            />
            <span className="august-stamp">✦ Curated Sanctuary Experience</span>
          </span>
          <span className="august-body">
            <span className="august-eyebrow">Couples Night Sanctuary</span>
            <h2>
              The <em>Complete Date Journey</em> — an entire evening, beautifully planned.
            </h2>
            <p>
              Seven intimate moments to experience synchronously in one room, across any distance. From cozy warmup banters to deep connection cards and matching keepsakes.
            </p>

            <ul className="august-run" style={{ marginTop: '20px' }}>
              <li>
                <b>01</b> Warmup Photobooth
              </li>
              <li>
                <b>02</b> Harmony Match
              </li>
              <li>
                <b>03</b> Riddle Mystery
              </li>
              <li>
                <b>04</b> Lore Quiz Duel
              </li>
              <li>
                <b>05</b> Playful Debate
              </li>
              <li>
                <b>06</b> Midnight Honest Cards
              </li>
              <li>
                <b>07</b> Twin Keepsake Studio
              </li>
            </ul>
            <span className="august-cta">
              <span className="btn">
                Begin Tonight’s Journey <span className="arr">▷</span>
              </span>
              <span className="when">
                two screens · instant connection · zero sign-up
              </span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui';
import { KeepsakeArtwork } from './KeepsakeArtwork';

export function HomeActivitiesGrid() {
  return (
    <section
      className="section"
      id="activities"
      style={{
        padding: '72px 0 84px',
        margin: 0,
      }}
    >
      <div className="wrap">
        <ScrollReveal animation="fade-up">
          <div className="section-head">
            <div className="kicker">Activities to do together, apart</div>
            <h2 className="label-h">
              Pick tonight&apos;s <span className="grad">activity</span>.
            </h2>
            <p style={{ marginTop: '18px' }}>
              <Link className="btn btn-grad" href="/activity">
                Browse all activities <span className="arr">▷</span>
              </Link>
            </p>
          </div>
        </ScrollReveal>

        {/* New spotlight cards */}
        <ScrollReveal animation="fade-up" delay={0.1}>
          <div className="spot perspective-container">
            <span className="spot-label">
              New · the ones we can&apos;t stop playing
            </span>

            <Link className="act card-3d home-letter-card" href="/letter">
              <KeepsakeArtwork kind="letter" />
              <div className="ic layer-z2">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="4"
                    y="8"
                    width="26"
                    height="18"
                    rx="2.5"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <path
                    d="M4.8 9.6L17 18.4 29.2 9.6"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="26"
                    cy="24"
                    r="6"
                    fill="#fff"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                  />
                  <path
                    d="M26 21v3l2 1.4"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="layer-z1">
                Letters to the Future{' '}
                <span className="badge new layer-z3">New</span>
              </h3>
              <p>
                Write to the two of you years from now. Pick a date up to twelve
                years out — we hold the letter sealed until that morning, then
                send it to you, to them, or to both.
              </p>
              <span className="go layer-z2">
                Write a letter <span className="arr">▷</span>
              </span>
            </Link>

            <Link className="act card-3d home-feature-art" href="/scrapbook">
              <KeepsakeArtwork kind="scrapbook" />
              <div className="ic layer-z2">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="5"
                    y="5"
                    width="24"
                    height="24"
                    rx="2.5"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                  />
                  <path d="M10 5v24" stroke="#5FA0FF" strokeWidth="2" />
                  <rect
                    x="14"
                    y="10"
                    width="11"
                    height="8"
                    rx="1"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <path
                    d="M14 23h11"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="layer-z1">
                Digital Scrapbook{' '}
                <span className="badge new layer-z3">New</span>
              </h3>
              <p>
                The one thing here you come back to. Tape your real photostrips
                onto paper pages, draw on them, write captions in your own hand
                — both of you on the same page at once.
              </p>
              <span className="go layer-z2">
                Open the book <span className="arr">▷</span>
              </span>
            </Link>

            <Link className="act card-3d home-gift-card" href="/birthday">
              <KeepsakeArtwork kind="gift" />
              <div className="ic layer-z2">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="5"
                    y="14"
                    width="24"
                    height="15"
                    rx="2"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 19h24M17 14v15"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                  />
                  <path
                    d="M17 13.5s-5-2.6-5-5.6a2.6 2.6 0 014.3-1.8A2.6 2.6 0 0122 7.9c0 3-5 5.6-5 5.6z"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="layer-z1">
                Birthday Gift Page{' '}
                <span className="badge new layer-z3">New</span>
              </h3>
              <p>
                Build them a birthday page — a letter that types itself out,
                your photos, a live count of days together — then hand it over
                as a heart-shaped QR code they can scan.
              </p>
              <span className="go layer-z2">
                Make their page <span className="arr">▷</span>
              </span>
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={0.15}>
          <div className="grid-label">All games &amp; activities</div>
          <div className="acts">
            {/* Featured Wide Photobooth Tile */}
            <Link className="act feature" href="/photobooth">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="4"
                    y="9"
                    width="26"
                    height="19"
                    rx="3"
                    stroke="#17181C"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 9l2-4h6l2 4"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="17"
                    cy="18"
                    r="5"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <circle cx="26" cy="13" r="1.6" fill="#5FA0FF" />
                </svg>
              </div>
              <div className="copy">
                <h3>
                  Online Photobooth{' '}
                  <span className="badge on">Always free</span>
                </h3>
                <p>
                  The realtime 인생네컷 booth for two — a shared countdown fires
                  the shot on both screens at once, so every frame holds both of
                  you.
                </p>
              </div>
              <span className="arr-go">Open the booth ▷</span>
            </Link>

            <Link className="act" href="/quiz">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M10 7a3.5 3.5 0 013.6 3.6c0 2.6-3.6 3.4-3.6 6"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="22" r="1.5" fill="#FF7BA3" />
                  <path
                    d="M24 28s-6-3.6-6-8.2a3 3 0 015.2-2.1 3 3 0 015.2 2.1C28.4 24.4 24 28 24 28z"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Know Me Quiz <span className="badge hot">★ Most played</span>
              </h3>
              <p>
                Lock in privately, reveal together, score your compatibility —
                17 packs from cute to spicy.
              </p>
            </Link>

            <Link className="act" href="/host">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>🎙️</span>
              </div>
              <h3>
                Date Host <span className="badge new">New</span>
              </h3>
              <p>
                An observant host reacts to your answers and crafts dynamic
                follow-up dilemmas in real time.
              </p>
            </Link>

            <Link className="act" href="/match">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M13 25S4 19.4 4 13.6A4.2 4.2 0 0111.6 11"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 25s9-5.6 9-11.4A4.2 4.2 0 0022.4 11"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17h3l2-3 3 6 2-3h3"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Love Match <span className="badge new">New</span>
              </h3>
              <p>
                Take the same personality test at the same instant — 16 types,
                Big Five, the stars — and get your match score.
              </p>
            </Link>

            <Link className="act" href="/dare">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="4"
                    y="10"
                    width="17"
                    height="17"
                    rx="3"
                    stroke="#17181C"
                    strokeWidth="2"
                  />
                  <circle cx="9.5" cy="15.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="15.5" cy="15.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="9.5" cy="21.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="15.5" cy="21.5" r="1.6" fill="#5FA0FF" />
                  <path
                    d="M25 15s-5-3.2-5-6.4a2.6 2.6 0 014.5-1.8A2.6 2.6 0 0129 8.6C29 11.8 25 15 25 15z"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 19l2 3.2-3.2 1 2 3.2"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>
                Truth or Dare <span className="badge new">New</span>
              </h3>
              <p>
                Seal a stake, battle through 20 tiny minigames — the loser of
                every round picks truth or dare.
              </p>
            </Link>

            <Link className="act" href="/future">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <circle
                    cx="17"
                    cy="19"
                    r="6"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 25h26"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 7v3M7 11l2 2M27 11l-2 2"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 29h16"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>
                Our Future <span className="badge new">New</span>
              </h3>
              <p>
                Design your future together — home, travel, money, tiny humans —
                then turn it into a scrapbook vision board + plan.
              </p>
            </Link>

            <Link className="act" href="/arcade">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="4"
                    y="7"
                    width="26"
                    height="17"
                    rx="3"
                    stroke="#17181C"
                    strokeWidth="2"
                  />
                  <circle
                    cx="11"
                    cy="15"
                    r="3"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <path
                    d="M11 12v-4"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="22" cy="14" r="1.6" fill="#5FA0FF" />
                  <circle cx="26" cy="17" r="1.6" fill="#5FA0FF" />
                  <path
                    d="M11 28h12"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Arcade</h3>
              <p>
                Your face on cartoon legs in ten tiny games — flappy, tetris
                duel, whack-a-partner.
              </p>
            </Link>

            <Link className="act" href="/debate">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="3"
                    y="5"
                    width="17"
                    height="13"
                    rx="3"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 18l-2 4 5-2"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="17"
                    height="13"
                    rx="3"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                  />
                  <path
                    d="M25 27l2 4-5-2"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Couples Debate</h3>
              <p>
                Argue it out on camera — an AI judge scores every round and
                crowns a winner.
              </p>
            </Link>

            <Link className="act" href="/draw">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="26"
                    height="26"
                    rx="3"
                    stroke="#17181C"
                    strokeWidth="2"
                  />
                  <path
                    d="M22 8l4 4-12 12-4 1 1-4z"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 27c3-5 6 1 9-3"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Draw Together</h3>
              <p>
                Same prompt, two canvases — watch each other&apos;s strokes
                appear live.
              </p>
            </Link>

            <Link className="act" href="/court">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M17 5v22"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 12h22"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 12l-3 7h6z"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M28 12l-3 7h6z"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 29h10"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Couples Court</h3>
              <p>
                Plead your case, snap photo evidence — the AI judge delivers a
                verdict.
              </p>
            </Link>

            <Link className="act" href="/hunt">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <circle
                    cx="15"
                    cy="15"
                    r="9"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <path
                    d="M21.5 21.5l7 7"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15 11v8M11 15h8"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Snap Hunt</h3>
              <p>
                Race your homes to match a loose clue — cleverest find takes the
                round.
              </p>
            </Link>

            <Link className="act" href="/riddle">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M13 5a6 6 0 016.2 6.2c0 4.4-6.2 5.8-6.2 10.2"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="13" cy="27" r="2" fill="#FF7BA3" />
                  <path
                    d="M24 16l2 4.2 4.6.6-3.4 3.2.9 4.6L24 26.4l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6z"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Riddle Night</h3>
              <p>
                The legendary riddles — talk them out, lock in privately, reveal
                together.
              </p>
            </Link>

            <Link className="act" href="/iq">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                  />
                  <rect
                    x="19"
                    y="4"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                  />
                  <rect
                    x="4"
                    y="19"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 24.5h7M24.5 21v7"
                    stroke="#FF7BA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>IQ Duel</h3>
              <p>
                The same puzzles on both screens, against the clock — nothing
                reveals till the end.
              </p>
            </Link>

            <Link className="act" href="/lab">
              <span className="seamline"></span>
              <div className="ic">
                <svg viewBox="0 0 34 34" fill="none">
                  <path
                    d="M14 5h6M15 5v8l7 12a2.5 2.5 0 01-2.2 3.8H11.2A2.5 2.5 0 019 25l7-12V5"
                    stroke="#17181C"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 21h10"
                    stroke="#5FA0FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="15" cy="24.5" r="1.4" fill="#FF7BA3" />
                  <circle cx="19" cy="25.5" r="1.1" fill="#FF7BA3" />
                </svg>
              </div>
              <h3>
                The Lab <span className="badge new">New</span>
              </h3>
              <p>
                A study date with a scoreboard — real math &amp; science, versus
                or co-op.
              </p>
            </Link>

            <Link className="act" href="/cards">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>💌</span>
              </div>
              <h3>
                Honest Cards <span className="badge new">New</span>
              </h3>
              <p>
                A deck of honest questions — you both answer privately, it opens
                at once.
              </p>
            </Link>

            <Link className="act" href="/timezone">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>🌍</span>
              </div>
              <h3>
                Timezone Hub <span className="badge hot">★ Essential</span>
              </h3>
              <p>
                Visual 24h sun/moon horizon, golden overlap hours, and a
                millisecond airport reunion countdown.
              </p>
            </Link>

            <Link className="act" href="/bucket">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>🎯</span>
              </div>
              <h3>
                100 Dates Bucket List <span className="badge new">New</span>
              </h3>
              <p>
                Scratch off milestone cards from late-night video call dates to
                airport hugs and grocery runs.
              </p>
            </Link>

            <Link className="act" href="/scrapbook">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>📖</span>
              </div>
              <h3>
                Digital Scrapbook <span className="badge new">New</span>
              </h3>
              <p>
                Tape down photostrips, boarding passes, washi tape, and sticky
                notes on a shared memory corkboard.
              </p>
            </Link>

            <Link className="act" href="/letter">
              <span className="seamline"></span>
              <div className="ic">
                <span style={{ fontSize: '26px' }}>💌</span>
              </div>
              <h3>
                Time Capsule Letters <span className="badge new">New</span>
              </h3>
              <p>
                Write letters to future you, sealed in a vault until your chosen
                reunion anniversary.
              </p>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

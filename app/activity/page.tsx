'use client';

import React from 'react';
import Link from 'next/link';

export default function ActivityPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '60px' }}>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          padding: '0 16px 40px',
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Sticky Mobile Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 4px 12px',
            background: 'var(--paper)',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '24px',
              letterSpacing: '-.03em',
            }}
          >
            angie
            <span style={{ display: 'inline-flex', gap: '4px' }}>
              <i style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--pink)', display: 'block' }}></i>
              <i style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--blue)', display: 'block' }}></i>
            </span>
          </Link>
          <Link
            href="/profile"
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: '2px solid var(--line)',
              background: 'var(--paper-raised)',
              color: 'var(--ink-soft)',
            }}
            aria-label="Your profile"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </header>

        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 4px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(26px, 7vw, 34px)',
              letterSpacing: '-.03em',
              lineHeight: 1.1,
            }}
          >
            Pick an <span style={{ color: 'var(--pink)' }}>activity</span> to do{' '}
            <span style={{ color: 'var(--blue)' }}>together</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
            Realtime games &amp; dates for two screens in two places — played in one shared room, at the same second.
          </p>
        </div>

        {/* Featured Photobooth Banner */}
        <Link
          href="/photobooth"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '22px',
            borderRadius: '14px',
            background: 'linear-gradient(120deg, var(--pink-tint), var(--blue-tint))',
            overflow: 'hidden',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', letterSpacing: '-.02em' }}>
            Photobooth
          </h2>
          <p style={{ color: 'var(--ink)', opacity: 0.75, fontSize: '14px', maxWidth: '30ch' }}>
            One shared countdown, both of you in every frame of the strip.
          </p>
          <span style={{ marginTop: '8px', fontWeight: 700, fontSize: '15px' }}>Open the booth ▷</span>

          {/* Miniature Photo Strip Illustration */}
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%) rotate(6deg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px 6px 14px',
              background: 'var(--paper-raised)',
              boxShadow: 'var(--shadow-soft)',
              borderRadius: '4px',
            }}
            aria-hidden="true"
          >
            <i style={{ display: 'block', width: '44px', height: '32px', background: 'linear-gradient(120deg, var(--pink), var(--blue))', opacity: 0.65, borderRadius: '2px' }}></i>
            <i style={{ display: 'block', width: '44px', height: '32px', background: 'linear-gradient(120deg, var(--pink), var(--blue))', opacity: 0.45, borderRadius: '2px' }}></i>
            <i style={{ display: 'block', width: '44px', height: '32px', background: 'linear-gradient(120deg, var(--pink), var(--blue))', opacity: 0.55, borderRadius: '2px' }}></i>
            <i style={{ display: 'block', width: '44px', height: '32px', background: 'linear-gradient(120deg, var(--pink), var(--blue))', opacity: 0.35, borderRadius: '2px' }}></i>
          </div>
        </Link>

        {/* Section: Games for two */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            padding: '0 4px',
          }}
        >
          Games for two
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            {
              href: '/quiz',
              title: 'Know Me Quiz',
              badge: '★',
              desc: 'guess each other, score at the end',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <path d="M10 7a3.5 3.5 0 013.6 3.6c0 2.6-3.6 3.4-3.6 6" stroke="#FF7BA3" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="10" cy="22" r="1.7" fill="#FF7BA3" />
                  <path d="M24 28s-6-3.6-6-8.2a3 3 0 015.2-2.1 3 3 0 015.2 2.1C28.4 24.4 24 28 24 28z" stroke="#5FA0FF" strokeWidth="2.4" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              href: '/dare',
              title: 'Truth or Dare',
              badge: 'New',
              desc: 'lose the minigame, pick your fate',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <rect x="4" y="10" width="17" height="17" rx="3" stroke="#17181C" strokeWidth="2.4" />
                  <circle cx="9.5" cy="15.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="15.5" cy="15.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="9.5" cy="21.5" r="1.6" fill="#5FA0FF" />
                  <circle cx="15.5" cy="21.5" r="1.6" fill="#5FA0FF" />
                  <path d="M25 15s-5-3.2-5-6.4a2.6 2.6 0 014.5-1.8A2.6 2.6 0 0129 8.6C29 11.8 25 15 25 15z" stroke="#FF7BA3" strokeWidth="2.4" strokeLinejoin="round" />
                  <path d="M24 19l2 3.2-3.2 1 2 3.2" stroke="#FF7BA3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              href: '/cards',
              title: 'Honest Cards',
              badge: 'New',
              desc: 'the questions you keep avoiding',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <rect x="4" y="8" width="14" height="20" rx="2.5" transform="rotate(-8 4 8)" stroke="#5FA0FF" strokeWidth="2.4" />
                  <rect x="13" y="6" width="15" height="21" rx="2.5" fill="#fff" stroke="#17181C" strokeWidth="2.4" />
                  <path d="M20.5 20s-4.5-2.7-4.5-5.6a2.2 2.2 0 013.8-1.5 2.2 2.2 0 013.8 1.5c0 2.9-3.1 5.6-3.1 5.6z" stroke="#FF7BA3" strokeWidth="2.4" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              href: '/iq',
              title: 'IQ Duel',
              badge: 'New',
              desc: 'same questions, head to head',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <rect x="4" y="4" width="11" height="11" rx="2" stroke="#FF7BA3" strokeWidth="2.4" />
                  <rect x="19" y="4" width="11" height="11" rx="2" stroke="#5FA0FF" strokeWidth="2.4" />
                  <rect x="4" y="19" width="11" height="11" rx="2" stroke="#5FA0FF" strokeWidth="2.4" />
                  <path d="M21 24.5h7M24.5 21v7" stroke="#FF7BA3" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              href: '/riddle',
              title: 'Riddle Night',
              badge: 'New',
              desc: 'famous riddles, talk it out',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <path d="M13 5a6 6 0 016.2 6.2c0 4.4-6.2 5.8-6.2 10.2" stroke="#FF7BA3" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="13" cy="27" r="2" fill="#FF7BA3" />
                  <path d="M24 16l2 4.2 4.6.6-3.4 3.2.9 4.6L24 26.4l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6z" stroke="#5FA0FF" strokeWidth="2.4" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              href: '/lab',
              title: 'The Lab',
              badge: 'New',
              desc: 'math & science, versus or co-op',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <path d="M14 5h6M15 5v8l7 12a2.5 2.5 0 01-2.2 3.8H11.2A2.5 2.5 0 019 25l7-12V5" stroke="#17181C" strokeWidth="2.4" strokeLinejoin="round" />
                  <path d="M12 21h10" stroke="#5FA0FF" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="15" cy="24.5" r="1.4" fill="#FF7BA3" />
                  <circle cx="19" cy="25.5" r="1.1" fill="#FF7BA3" />
                </svg>
              ),
            },
            {
              href: '/arcade',
              title: 'Arcade',
              desc: 'your face, ten tiny games',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <rect x="4" y="7" width="26" height="17" rx="3" stroke="#17181C" strokeWidth="2.4" />
                  <circle cx="11" cy="15" r="3" stroke="#FF7BA3" strokeWidth="2.4" />
                  <path d="M11 12v-4" stroke="#FF7BA3" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="22" cy="14" r="1.6" fill="#5FA0FF" />
                  <circle cx="26" cy="17" r="1.6" fill="#5FA0FF" />
                  <path d="M11 28h12" stroke="#17181C" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              href: '/debate',
              title: 'Debate',
              desc: 'argue it out, AI judges',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <rect x="3" y="5" width="17" height="13" rx="3" stroke="#FF7BA3" strokeWidth="2.4" />
                  <path d="M9 18l-2 4 5-2" stroke="#FF7BA3" strokeWidth="2.4" strokeLinejoin="round" />
                  <rect x="14" y="14" width="17" height="13" rx="3" stroke="#5FA0FF" strokeWidth="2.4" />
                  <path d="M25 27l2 4-5-2" stroke="#5FA0FF" strokeWidth="2.4" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              href: '/draw',
              title: 'Draw Together',
              desc: 'same prompt, two canvases',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <rect x="4" y="4" width="26" height="26" rx="3" stroke="#17181C" strokeWidth="2.4" />
                  <path d="M22 8l4 4-12 12-4 1 1-4z" stroke="#FF7BA3" strokeWidth="2.4" strokeLinejoin="round" />
                  <path d="M7 27c3-5 6 1 9-3" stroke="#5FA0FF" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              href: '/court',
              title: 'Couples Court',
              desc: 'plead your case, get a verdict',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <path d="M17 5v22" stroke="#17181C" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M6 12h22" stroke="#17181C" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M6 12l-3 7h6z" stroke="#FF7BA3" strokeWidth="2.4" strokeLinejoin="round" />
                  <path d="M28 12l-3 7h6z" stroke="#5FA0FF" strokeWidth="2.4" strokeLinejoin="round" />
                  <path d="M12 29h10" stroke="#17181C" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              href: '/hunt',
              title: 'Snap Hunt',
              desc: 'race to find it, snap it',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <circle cx="15" cy="15" r="9" stroke="#FF7BA3" strokeWidth="2.4" />
                  <path d="M21.5 21.5l7 7" stroke="#5FA0FF" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M15 11v8M11 15h8" stroke="#5FA0FF" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              href: '/match',
              title: 'Love Match',
              badge: 'New',
              desc: 'same personality test, one score',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <path d="M13 25S4 19.4 4 13.6A4.2 4.2 0 0111.6 11" stroke="#FF7BA3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 25s9-5.6 9-11.4A4.2 4.2 0 0022.4 11" stroke="#5FA0FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 17h3l2-3 3 6 2-3h3" stroke="#17181C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              href: '/future',
              title: 'Our Future',
              badge: 'New',
              desc: 'design it together — vision board',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <circle cx="17" cy="19" r="6" stroke="#FF7BA3" strokeWidth="2.4" />
                  <path d="M4 25h26" stroke="#17181C" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M17 7v3M7 11l2 2M27 11l-2 2" stroke="#5FA0FF" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M9 29h16" stroke="#5FA0FF" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              href: '/birthday',
              title: 'Birthday Gift',
              badge: 'New',
              desc: 'gift page sealed in heart QR',
              icon: (
                <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                  <rect x="6" y="14" width="22" height="14" rx="2" stroke="#17181C" strokeWidth="2.4" />
                  <rect x="4" y="9" width="26" height="5" rx="1.5" stroke="#17181C" strokeWidth="2.4" />
                  <path d="M17 9v19" stroke="#FF7BA3" strokeWidth="2.4" />
                  <path d="M17 9c-4.5 0-6.5-5-3-5 2 0 3 2.5 3 5zm0 0c4.5 0 6.5-5 3-5-2 0-3 2.5-3 5z" stroke="#FF7BA3" strokeWidth="2.4" strokeLinejoin="round" />
                </svg>
              ),
            },
          ].map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              className="act"
              style={{
                borderRadius: '14px',
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  background: 'var(--paper)',
                }}
              >
                {card.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                {card.title}{' '}
                {card.badge && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#fff',
                      background: 'linear-gradient(100deg, var(--pink), var(--blue))',
                    }}
                  >
                    {card.badge}
                  </span>
                )}
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-soft)' }}>{card.desc}</p>
            </Link>
          ))}
        </div>

        {/* Section: More */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            padding: '0 4px',
            marginTop: '10px',
          }}
        >
          More
        </span>

        <div style={{ display: 'grid', gap: '12px' }}>
          <Link
            href="/scrapbook"
            className="act"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: '16px',
              padding: '18px 20px',
              borderRadius: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: 'var(--paper)',
                flex: 'none',
              }}
            >
              <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                <rect x="5" y="5" width="24" height="24" rx="2" stroke="#17181C" strokeWidth="2.4" />
                <path d="M11 3v5" stroke="#FF7BA3" strokeWidth="2.4" strokeLinecap="round" />
                <rect x="10" y="11" width="7" height="11" rx="1" stroke="#5FA0FF" strokeWidth="2.4" />
                <path d="M20 14h5M20 19h4M20 24h6" stroke="#FF7BA3" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Digital Scrapbook{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: '#fff',
                    background: 'linear-gradient(100deg, var(--pink), var(--blue))',
                  }}
                >
                  New
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                your photobooth strips on paper — tape them down, write notes
              </p>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '18px', color: 'var(--ink-soft)' }}>▷</span>
          </Link>

          <Link
            href="/letter"
            className="act"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: '16px',
              padding: '18px 20px',
              borderRadius: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: 'var(--paper)',
                flex: 'none',
              }}
            >
              <svg viewBox="0 0 34 34" fill="none" style={{ width: '26px', height: '26px' }}>
                <rect x="4" y="8" width="26" height="18" rx="2" stroke="#17181C" strokeWidth="2.4" />
                <path d="M4 10l13 9 13-9" stroke="#5FA0FF" strokeWidth="2.4" strokeLinejoin="round" />
                <circle cx="27" cy="8" r="4.5" fill="#FFF" stroke="#FF7BA3" strokeWidth="2.2" />
                <path d="M27 6v2.2l1.5 1" stroke="#FF7BA3" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Letters to the Future{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: '#fff',
                    background: 'linear-gradient(100deg, var(--pink), var(--blue))',
                  }}
                >
                  New
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                write now, delivered years from now to both of you
              </p>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '18px', color: 'var(--ink-soft)' }}>▷</span>
          </Link>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '20px' }}>
          <Link href="/" style={{ textDecoration: 'underline' }}>
            ← back to home
          </Link>{' '}
          · getangie.com · made for two
        </div>
      </main>
    </div>
  );
}

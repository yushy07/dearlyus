import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Top Colorful Accent Line */}
      <div
        style={{
          height: '3px',
          width: '100%',
          background: 'linear-gradient(90deg, var(--pink) 0%, #FFA07A 30%, var(--blue) 70%, #B388FF 100%)',
        }}
      />

      <div
        style={{
          padding: '60px 28px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Top Header Row: Brand & Live Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px',
            paddingBottom: '32px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span className="brand" style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                angie
                <span className="dots" style={{ marginLeft: '4px' }}>
                  <i className="p" style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--pink)', marginRight: '3px' }}></i>
                  <i className="b" style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--blue)' }}></i>
                </span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'var(--pink-tint)',
                  color: 'var(--pink)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                인생네컷
              </span>
            </div>

            <p style={{ fontSize: '14.5px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              The realtime online date platform for long distance couples. Zero lag, shared photobooth strips, interactive duels, and memory keepsakes across any timezone.
            </p>
          </div>

          {/* System Status & Quick Action */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 10px #10B981',
                  display: 'inline-block',
                }}
              />
              <span>15 Realtime Servers Online</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/photobooth"
                className="btn btn-grad"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '20px',
                }}
              >
                Open Photobooth 📷
              </Link>
              <Link
                href="/activity"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '20px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  textDecoration: 'none',
                }}
              >
                Browse 35 Dates ▷
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Clean Columns Navigation Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px 24px',
            width: '100%',
          }}
        >
          {/* Column 1: Studios & Photobooth */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.8px',
                color: 'var(--pink)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📷</span>
              <span>Studios &amp; Dates</span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <Link href="/photobooth" className="foot-link">Online Photobooth (인생네컷)</Link>
              <Link href="/timezone" className="foot-link">Timezone &amp; Countdown Hub 🌍</Link>
              <Link href="/bucket" className="foot-link">100 Dates Bucket List 🎯</Link>
              <Link href="/fashion" className="foot-link">Fashion Show (PvP Runway) 👗</Link>
              <Link href="/shirts" className="foot-link">Matching Outfits Studio 👕</Link>
              <Link href="/date" className="foot-link">Date Night Planner &amp; Soundscapes 🍷</Link>
              <Link href="/activity" className="foot-link" style={{ fontWeight: 700, color: 'var(--pink)' }}>
                View All Activities →
              </Link>
            </nav>
          </div>

          {/* Column 2: Games & Interactive Duels */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.8px',
                color: 'var(--blue)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🎮</span>
              <span>Games &amp; Duels</span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <Link href="/quiz" className="foot-link">Know Me Quiz (17 + Lore)</Link>
              <Link href="/host" className="foot-link">AI Date Host (Scenarios)</Link>
              <Link href="/match" className="foot-link">Love Match Compatibility</Link>
              <Link href="/arcade" className="foot-link">Face Avatar Arcade</Link>
              <Link href="/iq" className="foot-link">IQ Duel Head-to-Head</Link>
              <Link href="/riddle" className="foot-link">Riddle Night</Link>
              <Link href="/draw" className="foot-link">Draw Together Canvas</Link>
            </nav>
          </div>

          {/* Column 3: Keepsakes & Memory Vault */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.8px',
                color: '#A855F7',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>💌</span>
              <span>Keepsakes &amp; Vault</span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <Link href="/passport" className="foot-link" style={{ fontWeight: 700, color: '#A855F7' }}>
                Couple Date Passport 💮
              </Link>
              <Link href="/future" className="foot-link">Our Future Vision Board</Link>
              <Link href="/letter" className="foot-link">Letters to Future (Time Vault)</Link>
              <Link href="/scrapbook" className="foot-link">Digital Scrapbook Corkboard</Link>
              <Link href="/shop" className="foot-link">Keepsakes Studio (4×6 Strips)</Link>
              <Link href="/birthday" className="foot-link">Birthday Surprise Page</Link>
              <Link href="/cards" className="foot-link">Honest Cards (Deep Questions)</Link>
            </nav>
          </div>

          {/* Column 4: Community, Guides & Contact */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.8px',
                color: 'var(--ink-soft)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🌱</span>
              <span>Community &amp; Legal</span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <Link href="/creators" className="foot-link">Creator Partner Community</Link>
              <Link href="/blog" className="foot-link">Angie Guides &amp; LDR Stories</Link>
              <Link href="/privacy" className="foot-link">Privacy &amp; Data Security</Link>
              <Link href="/terms" className="foot-link">Terms &amp; Conditions</Link>
              <a href="mailto:hello@getangie.com" className="foot-link" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                hello@getangie.com
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Copyright & Love Note */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            paddingTop: '24px',
            borderTop: '1px solid var(--line)',
            fontSize: '12.5px',
            color: 'var(--ink-soft)',
          }}
        >
          <div>
            © {new Date().getFullYear()} <b>Angie</b> (getangie.com). All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Made with</span>
            <span style={{ color: 'var(--pink)', fontSize: '14px' }}>💖</span>
            <span>for long distance couples across the world.</span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ color: 'var(--ink)', fontWeight: 700 }}
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

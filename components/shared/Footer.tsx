import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer>
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span className="brand">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </span>
          <span className="meta">인생네컷 · fun dates for long distance couples across the world</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--pink)', marginBottom: '8px' }}>
              Studio &amp; Dates
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <Link href="/photobooth">Online Photobooth (인생네컷)</Link>
              <Link href="/timezone">Timezone &amp; Reunion Hub 🌍</Link>
              <Link href="/bucket">100 Dates Bucket List 🎯</Link>
              <Link href="/fashion">Fashion Show (PvP Runway)</Link>
              <Link href="/shirts">Matching Outfits Studio</Link>
              <Link href="/date">Date Night Planner &amp; Sounds</Link>
              <Link href="/activity">All Activities</Link>
            </nav>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--blue)', marginBottom: '8px' }}>
              Games &amp; Duels
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <Link href="/quiz">Know Me Quiz (17 + Lore)</Link>
              <Link href="/host">Date Host (Dynamic Scenarios)</Link>
              <Link href="/match">Love Match Test</Link>
              <Link href="/arcade">Face Avatar Arcade</Link>
              <Link href="/iq">IQ Duel Head-to-Head</Link>
              <Link href="/riddle">Riddle Night</Link>
              <Link href="/draw">Draw Together Canvas</Link>
            </nav>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#C9829C', marginBottom: '8px' }}>
              Keepsakes &amp; Memory
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <Link href="/future">Our Future Vision Board</Link>
              <Link href="/letter">Letters to Future (Vault)</Link>
              <Link href="/scrapbook">Digital Scrapbook Corkboard</Link>
              <Link href="/shop">Keepsakes Studio (4×6 &amp; Wallpapers)</Link>
              <Link href="/birthday">Birthday Gift Page</Link>
              <Link href="/cards">Honest Cards Deck</Link>
            </nav>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '8px' }}>
              Community &amp; Legal
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <Link href="/creators">Creator Community</Link>
              <Link href="/blog">Angie Blog &amp; Guides</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <a href="mailto:hello@getangie.com">hello@getangie.com</a>
            </nav>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ink-soft)', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
          © {new Date().getFullYear()} Angie (getangie.com) · Made with love for couples in long distance relationships.
        </div>
      </div>
    </footer>
  );
}

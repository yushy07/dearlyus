'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui';
import { sounds } from '@/lib/sound';

const FAQ_ITEMS = [
  {
    q: 'What games and activities can we play on Dearly Us?',
    a: 'Over 35 realtime activities are live: Truth or Dare with 20 tiny minigames, Honest Cards, the Our Future planning date, the Love Match compatibility test, Riddle Night, IQ Duel, the How Well Do You Know Me quiz, Korean Life4Cuts online photobooth, Couples Debate, Draw Together, Couples Court, Snap Hunt, PvP Fashion Show, Face Avatar Arcade, and The Lab study-date timer. Everything happens synchronously in one shared room.',
  },
  {
    q: 'Is Dearly Us free to play?',
    a: 'Yes, completely! Open a room, share your 5-letter code, and play together for free. Every game, the Korean Life4Cuts photobooth, and all features are 100% free with unlimited plays and zero subscriptions or paid tiers.',
  },
  {
    q: 'How does a realtime online date work?',
    a: 'One partner opens a room and shares its private code; the other joins from anywhere in the world. You can see when your person arrives, lock answers privately, and reveal together with server-synchronized activity state.',
  },
  {
    q: 'Do we need to install an app?',
    a: "No! Dearly Us runs right in any modern web browser on iPhone, Android, iPad, Mac, or Windows — zero downloads needed. Just tap the link and you're connected together in under 5 seconds.",
  },
  {
    q: 'Is the photobooth like 인생네컷 / Life4Cuts?',
    a: 'Yes — the Dearly Us photobooth is meticulously styled after authentic Korean Life4Cuts (인생네컷) booths, customized for couples. You get synchronized countdown snaps, vintage frame colorways, cute stickers, and high-resolution downloadable strips to save or print.',
  },
];

export function HomeFaq() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <section
      className="section"
      id="faq"
      style={{
        background: '#C8DCBA',
        padding: '80px 0 100px',
        margin: 0,
      }}
    >
      <div className="wrap">
        <ScrollReveal animation="fade-up">
          <div className="faq-layout">
            {/* Left Column: Sticky Context & Support Card */}
            <div className="faq-sidebar">
              <div
                className="kicker"
                style={{
                  color: 'var(--pink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>✨</span>
                <span>Good to Know</span>
              </div>
              <h2>Questions long distance couples ask.</h2>
              <p>
                Zero downloads, instant 5-letter room codes, Korean Life4Cuts
                photo strips, and real-time multiplayer across any country or
                timezone.
              </p>

              {/* Direct Contact Helper Card */}
              <div
                style={{
                  background: 'var(--paper-raised)',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 800,
                    fontSize: '14px',
                  }}
                >
                  <span>💌</span>
                  <span>Need help planning a date?</span>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-soft)',
                    lineHeight: 1.5,
                  }}
                >
                  We answer every single couple. Have an activity request or
                  timezone question? Reach out anytime!
                </p>
                <Link
                  href="/privacy"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--pink)',
                    textDecoration: 'none',
                  }}
                >
                  <span>Read our privacy policy</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Card Accordion */}
            <div className="faq-list">
              {FAQ_ITEMS.map((item, idx) => (
                <details
                  key={idx}
                  className="faq-card"
                  open={activeFaq === idx}
                  onClick={(e) => {
                    e.preventDefault();
                    sounds.playPop();
                    setActiveFaq(activeFaq === idx ? null : idx);
                  }}
                >
                  <summary>
                    <span>{item.q}</span>
                    <span className="faq-icon-badge">+</span>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

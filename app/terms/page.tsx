'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar, Footer, Ribbon } from '@/components/shared';

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Ribbon text={<>📜 <b>Terms of Service</b> · Made for loving, safe, and respectful couple connections</>} />

      <Navbar
        rightAction={
          <Link className="btn btn-ghost" href="/activity" style={{ padding: '6px 12px', fontSize: '13px' }}>
            Activities ▷
          </Link>
        }
      />

      <main className="wrap" style={{ paddingTop: '48px', paddingBottom: '80px', maxWidth: '820px', width: '100%', flex: 1 }}>
        {/* Header Title */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              background: 'var(--pink-tint)',
              color: 'var(--pink)',
              fontWeight: 800,
              fontSize: '12px',
              padding: '4px 14px',
              borderRadius: '20px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Community &amp; Service Agreement
          </span>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', margin: '0 0 10px' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15.5px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
            Welcome to Dearly Us. By creating a room or joining an activity session, you and your partner agree to the following simple terms.
          </p>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '8px' }}>
            Last Updated: September 2026 · Version 2.0 (Dearly Us)
          </div>
        </div>

        {/* Main Terms Body */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '40px 36px',
            lineHeight: 1.75,
            fontSize: '15px',
            color: '#2A2A33',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              By visiting, browsing, or using the Dearly Us web application (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, you must discontinue using the Platform.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
              2. Description of the Platform
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              Dearly Us provides interactive digital date night tools for couples separated by distance or sharing screens together, including:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 12px' }}>
              <li>Realtime synchronized Life4Cuts (인생네컷) photobooth studios.</li>
              <li>Interactive multiplayer couple quizzes, question card decks, and timed mini-games.</li>
              <li>Collaborative drawing canvases, memory corkboards, and time capsule letters.</li>
              <li>Soundscape audio synthesizer mixers and 3D globe distance calculators.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
              3. Private Rooms &amp; User Conduct
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              All rooms on Dearly Us are private by design. When you generate a room code, only someone you explicitly share the link or 5-character code with can connect with you.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              You agree to use Dearly Us exclusively for lawful, consensual, and respectful purposes. You may not:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 12px' }}>
              <li>Harass, abuse, or record another person without their informed consent.</li>
              <li>Attempt to disrupt shared-room services, reverse-engineer service protocols, or overload server infrastructure.</li>
              <li>Use the service to distribute malicious scripts, unsolicited spam, or abusive media.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
              4. Intellectual Property &amp; User Content
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              <b>Your Photos &amp; Memories:</b> You retain complete, unrestricted ownership of all photos, drawings, notes, and custom quiz questions created on the Platform. Dearly Us claims no intellectual property rights over your personal content.
            </p>
            <p style={{ margin: 0 }}>
              <b>Our Platform Assets:</b> All trademarks, vector logos, custom audio synthesizer soundscapes, animations, and source code are the intellectual property of Dearly Us and its creators.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
              5. Keepsakes, Downloads &amp; Physical Goods
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              Free downloadable DIY printables (including 4×6 photo sheets, thermal receipts, and phone wallpapers) are provided for personal, non-commercial use. Any optional physical goods ordered through affiliate or printing partners are subject to their respective fulfillment, shipping, and return policies.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
              6. Disclaimer &amp; Limitation of Liability
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              Dearly Us is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind. We cannot guarantee uninterrupted service across all global networks, browsers, or hardware configurations.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
              7. Amendments &amp; Contact
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              We may periodically update these Terms to reflect new features or regulatory requirements. Continued use of the Platform signifies your acceptance of any revisions.
            </p>
            <p style={{ margin: 0 }}>
              For inquiries regarding these Terms, contact our legal team at <a href="mailto:terms@dearlyus.love" style={{ color: 'var(--pink)', fontWeight: 700 }}>terms@dearlyus.love</a>.
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/" style={{ color: 'var(--ink-soft)', fontSize: '14px', fontWeight: 600, textDecoration: 'underline' }}>
            ← Return to Dearly Us Homepage
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

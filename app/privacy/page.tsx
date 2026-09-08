'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar, Footer, Ribbon } from '@/components/shared';

export default function PrivacyPage() {
  return (
    <div
      style={{
        background: 'var(--paper)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Ribbon
        text={
          <>
            🔒 <b>Privacy First Sanctuary</b> · Your photos &amp; video streams
            belong exclusively to you two
          </>
        }
      />

      <Navbar
        rightAction={
          <Link
            className="btn btn-ghost"
            href="/activity"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Activities ▷
          </Link>
        }
      />

      <main
        className="wrap"
        style={{
          paddingTop: '48px',
          paddingBottom: '80px',
          maxWidth: '820px',
          width: '100%',
          flex: 1,
        }}
      >
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
            Privacy &amp; Sanctuary Pledge
          </span>
          <h1
            style={{
              fontSize: '38px',
              fontWeight: 900,
              color: 'var(--ink)',
              letterSpacing: '-0.03em',
              margin: '0 0 10px',
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: '15.5px',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Dearly Us was created as an intimate, safe sanctuary for couples. We
            believe your relationship memories are sacred and private.
          </p>
          <div
            style={{
              fontSize: '12.5px',
              color: 'var(--ink-muted)',
              marginTop: '8px',
            }}
          >
            Effective Date: September 2026 · Version 2.0 (Dearly Us)
          </div>
        </div>

        {/* 3 Core Guarantees Callout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🛡️</div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '16px',
                color: 'var(--ink)',
                marginBottom: '6px',
              }}
            >
              Your Camera Stays Local
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                lineHeight: 1.5,
              }}
            >
              The photobooth uses your device camera locally. Dearly Us does not
              upload, record, or relay camera video.
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎨</div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '16px',
                color: 'var(--ink)',
                marginBottom: '6px',
              }}
            >
              Local by Default
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                lineHeight: 1.5,
              }}
            >
              Photostrips and receipts are created on your device. They are
              uploaded only when you explicitly save one to your private couple
              space.
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚫</div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '16px',
                color: 'var(--ink)',
                marginBottom: '6px',
              }}
            >
              Optional Account
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                lineHeight: 1.5,
              }}
            >
              You can browse without an account. Google is the only sign-in
              method offered when you want a profile, a private couple space,
              saved keepsakes, and shared live-room activities. Dearly Us never
              receives or stores your Google password.
            </div>
          </div>
        </div>

        {/* Main Content Body */}
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
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>1.</span> Information We Process
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              We intentionally minimize data collection to the absolute
              technical minimum required to facilitate synchronized dates:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 12px' }}>
              <li>
                <b>Room Codes:</b> private 8–16 character identifiers used to
                pair signed-in devices for shared activities.
              </li>
              <li>
                <b>Local Device Storage:</b> Your couple nicknames (e.g.
                &ldquo;Mia &amp; Alex&rdquo;), custom passport stamps,
                soundscape volume preferences, and saved custom quiz packs are
                stored locally in your web browser&rsquo;s{' '}
                <code>localStorage</code>. This data never leaves your device.
              </li>
              <li>
                <b>Shared Room Events:</b> your room code, account identifier,
                display name, ready state, activity answers, drawings, and other
                interaction events needed to synchronize and recover a date are
                stored in Supabase. Camera feeds are never included.
              </li>
              <li>
                <b>Account &amp; Couple Space:</b> your Google account
                identifier, email, display name, profile photo URL, city,
                timezone, couple membership, private invite status, and saved
                keepsake references are stored in Supabase so your space can
                follow you across devices.
              </li>
              <li>
                <b>Private Saves:</b> when you deliberately save a keepsake,
                drawing, or photostrip, that file is uploaded to private couple
                storage. Access is restricted to the two members of that couple
                space.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>2.</span> Photobooth Camera &amp; Photo Ownership
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              You retain <b>100% ownership and copyright</b> of all photographs,
              photostrip cuts, recordings, and drawings created on Dearly Us.
            </p>
            <p style={{ margin: 0 }}>
              When you download a photostrip or thermal date lore receipt, the
              file is exported directly from your browser. Dearly Us does not
              upload it automatically. If you choose &ldquo;Save to Our
              Space,&rdquo; the selected file is stored in your private couple
              library so you and your connected partner can revisit it.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>3.</span> Third-Party Services &amp; AI Features
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              AI-powered follow-ups are optional and off by default. If you turn
              them on in Know Me Quiz, Honest Cards, or the Third Wheel Date
              Host, the answers and names you enter for that round are sent to
              Google Gemini to generate the next question. We never send
              personal images, webcam frames, or camera streams. You can turn AI
              follow-ups off at any time; the activities continue using
              on-device questions.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>4.</span> Physical Keepsake &amp; DIY Orders
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              All downloadable DIY keepsake templates (printable 4×6 sheets,
              mobile wallpapers, and calendar cards) are generated 100% on your
              device free of charge. If you choose to fulfill a physical order
              through third-party printing partners, shipping information is
              encrypted and transmitted solely to execute manufacturing and
              delivery.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>5.</span> Cookies &amp; Tracking
            </h2>
            <p style={{ margin: 0 }}>
              Dearly Us does not use intrusive tracking cookies, third-party
              advertising pixels, or behavioral marketing trackers. We only
              utilize standard web storage for essential date night
              functionality (such as audio volume, room codes, and unlocked
              activity milestones).
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>6.</span> Contact &amp; Questions
            </h2>
            <p style={{ margin: 0 }}>
              Privacy controls and account lifecycle information are available
              from your profile after sign-in.
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            href="/"
            style={{
              color: 'var(--ink-soft)',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            ← Return to Dearly Us Homepage
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

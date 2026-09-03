'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar, Footer, Ribbon } from '@/components/shared';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Ribbon text={<>🔒 <b>Privacy First Sanctuary</b> · Your photos &amp; video streams belong exclusively to you two</>} />

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
            Privacy &amp; Sanctuary Pledge
          </span>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', margin: '0 0 10px' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15.5px', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
            Dearly Us was created as an intimate, safe sanctuary for couples. We believe your relationship memories are sacred and private.
          </p>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '8px' }}>
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
          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🛡️</div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', marginBottom: '6px' }}>Zero Server Video</div>
            <div style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              Webcam video feeds are transmitted peer-to-peer (P2P). No server ever records, relays, or stores your live video.
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎨</div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', marginBottom: '6px' }}>Client-Side Strips</div>
            <div style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              Photostrips and thermal receipts are rendered directly on your local device canvas without uploading to a cloud storage bucket.
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚫</div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', marginBottom: '6px' }}>Zero Account Required</div>
            <div style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              No passwords, emails, or personal tracking required. Join instantly with a 5-letter private room code.
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
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>1.</span> Information We Process
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              We intentionally minimize data collection to the absolute technical minimum required to facilitate synchronized dates:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 12px' }}>
              <li>
                <b>Ephemeral Room Codes:</b> 5-character identifiers (e.g. <code>KX7RM</code>) used to pair two devices in real-time.
              </li>
              <li>
                <b>Local Device Storage:</b> Your couple nicknames (e.g. &ldquo;Mia &amp; Alex&rdquo;), custom passport stamps, soundscape volume preferences, and saved custom quiz packs are stored locally in your web browser&rsquo;s <code>localStorage</code>. This data never leaves your device.
              </li>
              <li>
                <b>WebRTC Signaling:</b> Temporary session negotiation metadata (SDP offers/answers and ICE candidates) is passed securely through memory relays and automatically purged immediately upon connection.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>2.</span> Photobooth Camera &amp; Photo Ownership
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              You retain <b>100% ownership and copyright</b> of all photographs, photostrip cuts, recordings, and drawings created on Dearly Us.
            </p>
            <p style={{ margin: 0 }}>
              When you download a photostrip or thermal date lore receipt, the file is exported as an image directly from your browser memory. We do not maintain a cloud gallery or server archive of your photobooth photos.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>3.</span> Third-Party Services &amp; AI Features
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              Certain interactive activities (such as dynamic questions in the Know Me Quiz or the Third Wheel Date Host) utilize large language model APIs to provide adaptive questions. These queries only receive category tags (e.g., &ldquo;Travel &amp; Adventures&rdquo;) and never include your personal images, webcam frames, or sensitive identifying data.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>4.</span> Physical Keepsake &amp; DIY Orders
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              All downloadable DIY keepsake templates (printable 4×6 sheets, mobile wallpapers, and calendar cards) are generated 100% on your device free of charge. If you choose to fulfill a physical order through third-party printing partners, shipping information is encrypted and transmitted solely to execute manufacturing and delivery.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>5.</span> Cookies &amp; Tracking
            </h2>
            <p style={{ margin: 0 }}>
              Dearly Us does not use intrusive tracking cookies, third-party advertising pixels, or behavioral marketing trackers. We only utilize standard web storage for essential date night functionality (such as audio volume, room codes, and unlocked activity milestones).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>6.</span> Contact &amp; Questions
            </h2>
            <p style={{ margin: 0 }}>
              If you have any questions or feedback regarding your privacy on Dearly Us, our team is always here for you at <a href="mailto:hello@dearlyus.love" style={{ color: 'var(--pink)', fontWeight: 700 }}>hello@dearlyus.love</a>.
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

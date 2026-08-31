'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <Link className="btn btn-ghost" href="/activity">
            Activities ▷
          </Link>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '40px', maxWidth: '720px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginBottom: '28px' }}>Last updated: August 2026</p>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '36px 32px', lineHeight: 1.7, fontSize: '15px', color: '#2A2A33' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0 }}>1. Your Camera &amp; Photobooth Streams</h2>
          <p>
            When you use the Angie Online Photobooth, video streams are transmitted peer-to-peer directly between you and your partner using WebRTC.
            We do not store your live video feeds on any server.
          </p>

          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '24px' }}>2. Photo Strips &amp; Memory Keepsakes</h2>
          <p>
            When you save or download a photo strip, it is rendered client-side on your device canvas. When you order physical keepsakes (magnets, framed prints, shirts), the high-resolution strip is securely transmitted to our printing laboratory exclusively for fulfillment.
          </p>

          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '24px' }}>3. Data Protection</h2>
          <p>
            We will never sell your personal data, photos, or relationship memories to third parties or advertisers.
          </p>
        </div>
      </main>
    </div>
  );
}

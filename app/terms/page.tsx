'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
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
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginBottom: '28px' }}>Last updated: August 2026</p>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '36px 32px', lineHeight: 1.7, fontSize: '15px', color: '#2A2A33' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: 0 }}>1. Agreement to Terms</h2>
          <p>
            By accessing or using Angie (getangie.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>

          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '24px' }}>2. Use of Services</h2>
          <p>
            Angie provides virtual date rooms, an online photobooth studio, multiplayer quiz games, and print-on-demand relationship keepsakes for couples.
          </p>

          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '24px' }}>3. Physical Goods &amp; Shipping</h2>
          <p>
            Orders made through the Angie Print Shop are custom-manufactured. Twin-pack shipments are handled with split delivery to both provided addresses.
          </p>
        </div>
      </main>
    </div>
  );
}

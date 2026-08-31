'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function CreatorsPage() {
  const [videoSubmitted, setVideoSubmitted] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [videoLink, setVideoLink] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');

  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVideoSubmitted(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistered(true);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Top Navbar */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <nav>
            <Link href="/photobooth">Photobooth</Link>
            <Link href="/activity">Activities</Link>
            <Link href="/shop">Print Shop</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #17181C 0%, #2A2A36 100%)',
          color: '#fff',
          padding: '48px 24px 72px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, var(--pink), var(--blue))',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          🎬 Creators wanted
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', margin: '0 0 14px', fontWeight: 800 }}>
          Post one video.
          <br />
          Get Angie free for life.
        </h1>
        <p style={{ fontSize: '16px', maxWidth: '560px', margin: '0 auto', opacity: 0.9, lineHeight: 1.6 }}>
          We&apos;re Angie — the online photobooth &amp; date-night games for long distance couples. Make a video about us
          and we&apos;ll pay you in the best thing we have: <b>a Lifetime Pass</b>.
        </p>
      </div>

      <div className="wrap" style={{ maxWidth: '680px', marginTop: '-36px' }}>
        {/* Card 1: Lifetime Pass Fast Track */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)',
            padding: '32px',
            marginBottom: '28px',
            border: '1px solid var(--line)',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: 0, marginBottom: '12px' }}>
            🎟️ Get a Lifetime Pass
          </h2>
          <div
            style={{
              background: 'linear-gradient(135deg, #FFF0F5, #EEF3FF)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '16px 20px',
              fontSize: '14.5px',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            If your video is approved, you get <b>Angie Premium — free, for life</b>. Every game, every HD strip
            download, forever.
          </div>

          <ol style={{ paddingLeft: '20px', display: 'grid', gap: '10px', fontSize: '14.5px', marginBottom: '22px' }}>
            <li>
              Play the photobooth with your partner at <Link href="/photobooth" style={{ color: 'var(--pink)', fontWeight: 700 }}>getangie.com/photobooth</Link>. Screen-record it or film your reactions.
            </li>
            <li>Post the video on <b>TikTok or Instagram</b>.</li>
            <li>Drop the link and your email below — we review every single submission!</li>
          </ol>

          {!videoSubmitted ? (
            <form onSubmit={handleVideoSubmit} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  Link to your TikTok / Instagram post
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.tiktok.com/@you/video/..."
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  Your email <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>— where we send your lifetime pass</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  Instagram / TikTok handle <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button type="submit" className="btn btn-grad" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                Submit my video 🎬
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Got it — we&apos;re watching it!</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>
                If it&apos;s approved you&apos;ll get your Lifetime Pass by email. Keep an eye on your inbox!
              </p>
            </div>
          )}
        </div>

        {/* Card 2: Creator Registration */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            boxShadow: 'var(--shadow)',
            padding: '32px',
            border: '1px solid var(--line)',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: 0, marginBottom: '6px' }}>
            ✍️ Register as a creator
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginBottom: '18px' }}>
            Want to make content with us regularly? Tell us who you are — we&apos;ll reach out on WhatsApp.
          </p>

          {!registered ? (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>WhatsApp number</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (403) 555-0199"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Portfolio link</label>
                <input
                  type="url"
                  required
                  placeholder="https://tiktok.com/@..."
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                Apply to be a Creator ♡
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ fontSize: '42px', marginBottom: '8px' }}>💌</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Application Sent!</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>
                We read every application — if it&apos;s a fit, we will message you on WhatsApp or email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

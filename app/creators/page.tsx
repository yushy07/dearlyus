'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar } from '@/components/shared';

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
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>🎬 Angie Creator Community · <b>Share Your Date Nights &amp; Get Featured Worldwide</b></>} />

      <Navbar
        rightAction={
          <Link className="btn btn-ghost" href="/photobooth" style={{ padding: '6px 12px', fontSize: '13px' }}>
            Open Booth ▷
          </Link>
        }
      />

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
          🎬 Creator Community
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', margin: '0 0 14px', fontWeight: 800 }}>
          Create Content.
          <br />
          Inspire Couples Worldwide.
        </h1>
        <p style={{ fontSize: '16px', maxWidth: '560px', margin: '0 auto', opacity: 0.9, lineHeight: 1.6 }}>
          We&apos;re Angie — the online photobooth &amp; date-night games platform for long distance couples. Share your sessions on TikTok or Instagram, and get featured on our global showcase!
        </p>
      </div>

      <div className="wrap" style={{ maxWidth: '680px', marginTop: '-36px' }}>
        {/* Card 1: Submit Video */}
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
            📹 Submit Your Published Video
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
            Submit your video URL below. Once approved by our team, you&apos;ll be featured on the Angie homepage and official Instagram / TikTok!
          </div>

          {!videoSubmitted ? (
            <form onSubmit={handleVideoSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Video URL (TikTok / Instagram Reel / YouTube Shorts)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://tiktok.com/@you/video/..."
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    Creator Handle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@yourhandle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-grad"
                style={{ padding: '14px', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}
              >
                Submit Video for Feature ▷
              </button>
            </form>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#EBF8EE',
                borderRadius: '12px',
                border: '1px solid #A3E6B4',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ margin: '0 0 6px', color: '#166534', fontWeight: 800 }}>Submission Received!</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#15803D' }}>
                We will review your video within 24 hours and feature your session on our official feeds.
              </p>
            </div>
          )}
        </div>

        {/* Card 2: Creator Program Application */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)',
            padding: '32px',
            border: '1px solid var(--line)',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: 0, marginBottom: '12px' }}>
            🤝 Join the Ambassador Network
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', marginTop: 0, marginBottom: '20px', lineHeight: 1.5 }}>
            Are you a content creator focused on relationships, long-distance love, or aesthetic vlogs? Join our official community!
          </p>

          {!registered ? (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mia Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mia@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    WhatsApp / Telegram
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Primary Social Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="@miainthecity on TikTok / IG"
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Link to Profile / Media Kit
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/yourhandle"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '14px', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}
              >
                Apply as Creator Ambassador ▷
              </button>
            </form>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#EBF8EE',
                borderRadius: '12px',
                border: '1px solid #A3E6B4',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💌</div>
              <h3 style={{ margin: '0 0 6px', color: '#166534', fontWeight: 800 }}>Application Submitted!</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#15803D' }}>
                Thank you for applying. We will reach out to you via WhatsApp or Email within 48 hours!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

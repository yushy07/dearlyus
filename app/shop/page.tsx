'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar, Confetti } from '@/components/shared';
import { sounds } from '@/lib/sound';

interface KeepsakeTemplate {
  id: string;
  name: string;
  badge?: string;
  description: string;
  features: string[];
  icon: string;
  previewUrl: string;
}

const KEEPSAKES: KeepsakeTemplate[] = [
  {
    id: 'sheet',
    name: 'Printable 4×6 DIY Photo Sheet',
    badge: '★ Popular',
    description: 'High-resolution 300 DPI layout formatted for standard 4×6 photo paper at home or your local print kiosk.',
    features: ['300 DPI print-ready layout', 'Standard 4×6 photo border guidelines', 'Direct PNG / PDF export'],
    icon: '🖨️',
    previewUrl: '/photos/frame1.webp',
  },
  {
    id: 'lockscreen',
    name: 'Couple Lockscreen & Wallpaper Set',
    badge: 'Mobile Set',
    description: 'A matching pair of HD phone wallpapers for both of your lockscreens featuring your custom photostrips.',
    features: ['Optimized for iPhone & Android screens', 'Matching ambient background tones', 'Instant high-res download'],
    icon: '📱',
    previewUrl: '/photos/frame2.webp',
  },
  {
    id: 'magnet-template',
    name: 'DIY Fridge Magnet Cutout Sheet',
    badge: 'DIY Craft',
    description: 'Printable cutout template with trim guidelines to mount your photostrips onto magnetic backing sheets.',
    features: ['Exact Korean 4-cut 인생네컷 dimensions', 'Trim-line guides for easy mounting', 'High-res printable sheet'],
    icon: '🧲',
    previewUrl: '/photos/frame3.webp',
  },
  {
    id: 'calendar',
    name: 'Digital Anniversary Calendar Card',
    badge: 'Anniversary',
    description: 'A custom digital calendar card commemorating your milestone dates, anniversary, and favorite memories.',
    features: ['Dual timezone highlights', 'Custom couple names and coordinates', 'Print-ready export'],
    icon: '📅',
    previewUrl: '/photos/frame4.webp',
  },
];

export default function KeepsakeStudioPage() {
  const [selectedKeepsake, setSelectedKeepsake] = useState<KeepsakeTemplate>(KEEPSAKES[0]);
  const [downloaded, setDownloaded] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  const handleDownload = () => {
    sounds.playCelebration();
    setConfettiActive(true);
    setDownloaded(true);
    setTimeout(() => {
      setConfettiActive(false);
      setDownloaded(false);
    }, 3000);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>🎁 Keepsake &amp; Wallpaper Studio · <b>Create Printable Sheets &amp; Matching Wallpapers</b></>} />
      <Confetti active={confettiActive} />

      <Navbar
        rightAction={
          <Link className="btn btn-grad" href="/photobooth" style={{ padding: '6px 14px', fontSize: '13px' }}>
            Take New Photostrip 📸
          </Link>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '980px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
          <span className="eyebrow">Digital Keepsakes Studio</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, margin: '8px 0 12px' }}>
            Turn your strips into <span className="grad">forever keepsakes</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Export high-res printable 4×6 photo sheets, matching phone wallpapers, and DIY fridge magnet templates.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Keepsakes List */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {KEEPSAKES.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedKeepsake(item)}
                style={{
                  background: '#FFFFFF',
                  border: selectedKeepsake.id === item.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '28px' }}>{item.icon}</span>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>{item.name}</h3>
                  </div>
                  {item.badge && <span className="badge hot">{item.badge}</span>}
                </div>

                <p style={{ color: 'var(--ink-soft)', fontSize: '13.5px', margin: '4px 0 12px' }}>{item.description}</p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--pink)', fontWeight: 700 }}>Select Template ▷</span>
                </div>
              </div>
            ))}
          </div>

          {/* Keepsake Generator & Download Panel */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="badge hot">{selectedKeepsake.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                  Digital Format
                </span>
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{selectedKeepsake.name}</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', marginBottom: '20px' }}>
                {selectedKeepsake.description}
              </p>

              {/* Preview image */}
              <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', background: '#17181C', marginBottom: '20px' }}>
                <img src={selectedKeepsake.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Features list */}
              <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
                {selectedKeepsake.features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--pink)', fontWeight: 800 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', justifyContent: 'center' }}
            >
              {downloaded ? '✓ Keepsake Saved to Device!' : 'Download High-Res PNG / PDF 💾'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

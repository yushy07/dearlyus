'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { InteractiveGlobe, calculateGreatCircleDistance } from '@/lib/globe';

interface PackingItem {
  id: string;
  text: string;
  category: string;
  packed: boolean;
}

export default function TimezoneHubPage() {
  const [city1, setCity1] = useState('Calgary, CA (GMT-6)');
  const [city2, setCity2] = useState('Jakarta, ID (GMT+7)');
  const [offsetHours] = useState(13); // Jakarta is 13 hrs ahead of Calgary
  const [reunionDate, setReunionDate] = useState('2026-11-20T18:00');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [heartbeatSent, setHeartbeatSent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeInstanceRef = useRef<InteractiveGlobe | null>(null);

  // Calgary: 51.0447° N, 114.0719° W (-114.07)
  // Jakarta: 6.2088° S (-6.2088), 106.8456° E (106.8456)
  const distanceKm = calculateGreatCircleDistance(51.0447, -114.0719, -6.2088, 106.8456);

  useEffect(() => {
    if (!canvasRef.current) return;
    const globe = new InteractiveGlobe(
      canvasRef.current,
      { name: 'Calgary', lat: 51.0447, lng: -114.0719, color: '#5FA0FF' },
      { name: 'Jakarta', lat: -6.2088, lng: 106.8456, color: '#FF7BA3' }
    );
    globe.start();
    globeInstanceRef.current = globe;
    return () => globe.stop();
  }, []);

  // Suitcase Packing Checklist
  const [packingList, setPackingList] = useState<PackingItem[]>([
    { id: '1', text: 'Passport & Travel Visa Documents', category: 'Essentials', packed: true },
    { id: '2', text: 'Favorite oversized hoodie with perfume/cologne', category: 'Keepsakes', packed: true },
    { id: '3', text: 'Universal dual-voltage power plug adapter', category: 'Electronics', packed: false },
    { id: '4', text: 'Snacks & candy partner cannot get in their country', category: 'Gifts', packed: false },
    { id: '5', text: 'Noise-cancelling headphones for the long-haul flight', category: 'Electronics', packed: false },
    { id: '6', text: 'Framed 인생네컷 photostrip to place on their nightstand', category: 'Keepsakes', packed: false },
  ]);

  const [newItemText, setNewItemText] = useState('');

  // Live Time calculation
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reunion Countdown calculation
  useEffect(() => {
    const target = new Date(reunionDate).getTime();
    const updateCountdown = () => {
      const difference = target - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [reunionDate]);

  const togglePacked = (id: string) => {
    setPackingList(packingList.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item)));
  };

  const addPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setPackingList([
      ...packingList,
      { id: Date.now().toString(), text: newItemText.trim(), category: 'Custom', packed: false },
    ]);
    setNewItemText('');
  };

  const sendHeartbeat = () => {
    sounds.playHeartbeat();
    setHeartbeatSent(true);
    globeInstanceRef.current?.triggerHeartbeatPulse();
    setTimeout(() => setHeartbeatSent(false), 2500);
  };

  // Time formatter helpers
  const getCityTime = (timeOffset: number) => {
    const d = new Date(now.getTime() + timeOffset * 3600 * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>🌍 Timezone Hub &amp; Reunion Center · <b>Dual-City Sun/Moon Horizon &amp; Airport Countdown</b></>} />

      <Navbar
        rightAction={
          <button onClick={sendHeartbeat} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px', animation: heartbeatSent ? 'gl-pulse 0.4s ease infinite' : 'none' }}>💖</span>
            {heartbeatSent ? 'Heartbeat Sent!' : 'Send Heartbeat Touch'}
          </button>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '980px' }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="eyebrow">Bridging the Distance</span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '8px 0' }}>
            Two Cities, <span className="grad">One Shared Clock</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '54ch', margin: '0 auto' }}>
            Track daylight overlap, calculate golden call hours, count down to your airport reunion, and organize your joint travel suitcase.
          </p>
        </div>

        {/* 3D Earth Globe Hero */}
        <div
          style={{
            background: 'linear-gradient(180deg, #151822 0%, #0F1118 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '24px 20px',
            marginBottom: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <span className="badge hot" style={{ fontSize: '11px' }}>3D Orbit &amp; Flight Arc</span>
              <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>
                Calgary ✈️ Jakarta
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#FFD68A', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800 }}>
                {distanceKm.toLocaleString()} km
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                Great-Circle Distance
              </div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={600}
            height={320}
            style={{ maxWidth: '100%', height: 'auto', cursor: 'grab' }}
          />

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            <span>🖱️ Drag to rotate globe</span>
            <span>·</span>
            <button
              onClick={sendHeartbeat}
              className="btn btn-grad"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Send Live Heartbeat Wave 💖
            </button>
          </div>
        </div>

        {/* Dual Live Clocks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {/* City 1 Card */}
          <div className="booth-box" style={{ padding: '28px 24px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: '#F0F4F8', color: '#334E68', fontWeight: 800 }}>
                🏙️ Partner A Hometown
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                ☀️ Daytime
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>{city1}</h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, color: 'var(--pink)' }}>
              {getCityTime(0)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '6px' }}>
              {now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* City 2 Card */}
          <div className="booth-box" style={{ padding: '28px 24px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: '#FFF0F5', color: 'var(--pink)', fontWeight: 800 }}>
                🌸 Partner B Hometown
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--pink)', fontWeight: 800 }}>
                +{offsetHours} Hours Ahead
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>{city2}</h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, color: 'var(--blue)' }}>
              {getCityTime(offsetHours)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '6px' }}>
              {new Date(now.getTime() + offsetHours * 3600 * 1000).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* 24-Hour Visual Horizon Overlap Bar */}
        <div className="booth-box" style={{ padding: '28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>24-Hour Mutual Awake &amp; Golden Hours</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                Green highlight represents the optimal window when both of you are awake and free to talk.
              </p>
            </div>
            <span className="badge hot" style={{ padding: '6px 12px', fontSize: '12px' }}>
              ✨ Golden Window: 7:00 PM – 10:30 PM
            </span>
          </div>

          {/* 24-hour visual bar */}
          <div style={{ position: 'relative', height: '48px', borderRadius: '12px', overflow: 'hidden', background: '#E2E8F0', display: 'flex' }}>
            {Array.from({ length: 24 }).map((_, hour) => {
              // Simulate golden overlap between 18:00 and 22:00
              const isGolden = hour >= 18 && hour <= 22;
              const isSleepA = hour >= 0 && hour <= 7;
              return (
                <div
                  key={hour}
                  style={{
                    flex: 1,
                    background: isGolden ? '#48BB78' : isSleepA ? '#2D3748' : '#ECC94B',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    display: 'grid',
                    placeItems: 'center',
                    color: isGolden || isSleepA ? '#FFF' : '#1A202C',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}
                  title={`${hour}:00`}
                >
                  {hour % 3 === 0 ? hour : ''}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#48BB78' }}></span>
              <b>Golden Overlap (Both Awake)</b>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ECC94B' }}></span>
              Daylight (One Working)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#2D3748' }}></span>
              Night / Sleep Time
            </span>
          </div>
        </div>

        {/* Precision Airport Reunion Countdown Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #17181C 0%, #2A2B36 100%)',
            color: '#fff',
            borderRadius: '20px',
            padding: '36px 32px',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--pink)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
                ✈️ Next Airport Reunion Ticker
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>Until We Close the Distance</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="datetime-local"
                value={reunionDate}
                onChange={(e) => setReunionDate(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Countdown Numbers Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, color: 'var(--pink)' }}>
                {timeLeft.days}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '.1em' }}>Days</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, color: 'var(--blue)' }}>
                {timeLeft.hours}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '.1em' }}>Hours</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, color: '#FFD68A' }}>
                {timeLeft.minutes}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '.1em' }}>Minutes</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, color: '#4ECCA3' }}>
                {timeLeft.seconds}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '.1em' }}>Seconds</div>
            </div>
          </div>
        </div>

        {/* Shared Suitcase Packing Checklist */}
        <div className="booth-box" style={{ padding: '32px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>🧳 Shared Suitcase Packing Checklist</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink-soft)' }}>
                Coordinate what to pack so neither of you forgets passports, adapters, or surprise gifts.
              </p>
            </div>
            <span className="badge" style={{ background: '#EBF8FF', color: '#2B6CB0', fontWeight: 800 }}>
              {packingList.filter((i) => i.packed).length} / {packingList.length} Packed
            </span>
          </div>

          {/* List items */}
          <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
            {packingList.map((item) => (
              <div
                key={item.id}
                onClick={() => togglePacked(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: item.packed ? 'rgba(72,187,120,0.08)' : 'var(--paper)',
                  border: item.packed ? '1px solid #48BB78' : '1px solid var(--line)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input type="checkbox" checked={item.packed} onChange={() => {}} style={{ width: '18px', height: '18px' }} />
                <span
                  style={{
                    fontSize: '14.5px',
                    fontWeight: item.packed ? 600 : 700,
                    textDecoration: item.packed ? 'line-through' : 'none',
                    color: item.packed ? 'var(--ink-soft)' : 'var(--ink)',
                  }}
                >
                  {item.text}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--paper-raised)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  {item.category}
                </span>
              </div>
            ))}
          </div>

          {/* Add item form */}
          <form onSubmit={addPackingItem} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Add new packing item (e.g., Couple matching hoodies, Camera film)..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: '#fff',
                fontSize: '14px',
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              + Add Item
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

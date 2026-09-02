'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import { sounds } from '@/lib/sound';
import { CoupleNameBar } from '@/components/shared';

export default function ProfilePage() {
  const { partnerA, partnerB, cityA, cityB, roomCode: storedRoom, updateProfile } = useCoupleProfile();
  const [userName, setUserName] = useState(partnerA);
  const [userCity, setUserCity] = useState(cityA);
  const [partnerName, setPartnerName] = useState(partnerB);
  const [partnerCity, setPartnerCity] = useState(cityB);
  const [roomCode, setRoomCode] = useState(storedRoom);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setUserName(partnerA);
    setPartnerName(partnerB);
    setUserCity(cityA);
    setPartnerCity(cityB);
    setRoomCode(storedRoom);
  }, [partnerA, partnerB, cityA, cityB, storedRoom]);

  const handleSave = () => {
    sounds.playCelebration();
    updateProfile({
      partnerA: userName,
      partnerB: partnerName,
      cityA: userCity,
      cityB: partnerCity,
      roomCode,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const [savedStrips] = useState([
    { id: '1', date: 'Aug 2026', room: roomCode, img: '/photos/frame1.webp' },
    { id: '2', date: 'Jul 2026', room: 'NX29A', img: '/photos/frame2.webp' },
  ]);

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

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <CoupleNameBar />
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            {userName} &amp; {partnerName}&apos;s <span className="grad">Space</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Connected room: <b>{roomCode}</b> · {userCity} ✈️ {partnerCity}
          </p>
        </div>

        {/* Profile Card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '32px 28px',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '28px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Partner Info</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--pink)' }}>
                Your Name &amp; City (🌸 {userName})
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your Name"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '8px' }}
              />
              <input
                type="text"
                value={userCity}
                onChange={(e) => setUserCity(e.target.value)}
                placeholder="Your City"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--blue)' }}>
                Partner&apos;s Name &amp; City (💙 {partnerName})
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Partner's Name"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '8px' }}
              />
              <input
                type="text"
                value={partnerCity}
                onChange={(e) => setPartnerCity(e.target.value)}
                placeholder="Partner's City"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Permanent Room Code</span>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '16px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--line)', width: '120px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {savedMessage && (
                <span style={{ color: '#0A7D4D', fontWeight: 700, fontSize: '13px' }}>
                  ✓ Profile &amp; Names Synced Globally!
                </span>
              )}
              <button className="btn btn-primary" onClick={handleSave}>
                Save Profile 💾
              </button>
            </div>
          </div>
        </div>

        {/* Saved Photostrip Album */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '32px 28px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Saved Photo Strips</h3>
            <Link className="btn btn-ghost" href="/photobooth">
              Take New Strip 📸
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {savedStrips.map((strip) => (
              <div
                key={strip.id}
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <img
                  src={strip.img}
                  alt={`Saved strip ${strip.id}`}
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                />
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Session {strip.date}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-soft)' }}>
                  Room {strip.room}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

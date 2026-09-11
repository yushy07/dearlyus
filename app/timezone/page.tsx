'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { InteractiveGlobe, calculateGreatCircleDistance } from '@/lib/globe';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { loadActivityRecords, upsertActivityRecord } from '@/lib/activity-records';

interface PackingItem {
  id: string;
  text: string;
  category: 'Essentials' | 'Keepsakes' | 'Electronics' | 'Documents' | 'Gifts' | 'Custom';
  owner: 'mine' | 'partner' | 'shared';
  packed: boolean;
}

const COMMON_TIMEZONES = [
  { label: 'Calgary / Edmonton (MT)', tz: 'America/Edmonton', lat: 51.0447, lng: -114.0719 },
  { label: 'Jakarta / Bangkok (WIB)', tz: 'Asia/Jakarta', lat: -6.2088, lng: 106.8456 },
  { label: 'Vancouver / Seattle (PT)', tz: 'America/Vancouver', lat: 49.2827, lng: -123.1207 },
  { label: 'Toronto / New York (ET)', tz: 'America/Toronto', lat: 43.6532, lng: -79.3832 },
  { label: 'London / Dublin (GMT/BST)', tz: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { label: 'Paris / Berlin (CET)', tz: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  { label: 'Tokyo / Seoul (JST/KST)', tz: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { label: 'Sydney / Melbourne (AEST)', tz: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { label: 'Singapore / Manila (SGT)', tz: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
];

export default function TimezoneHubPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const { space } = useCoupleSpace();
  const [city1, setCity1] = useState(cityA || 'Calgary');
  const [city2, setCity2] = useState(cityB || 'Jakarta');
  const [tz1, setTz1] = useState('America/Edmonton');
  const [tz2, setTz2] = useState('Asia/Jakarta');

  const [reunionDate, setReunionDate] = useState('2026-11-20T18:00');
  const [flightNotes, setFlightNotes] = useState('Terminal 3 · Flight AC 840 · Meet by Arrival Carousel 4');
  const [viewMode, setViewMode] = useState<'globe' | 'accessible'>('globe');
  const [currentStage, setCurrentStage] = useState<'ready' | 'play' | 'remember'>('play');
  const [heartbeatSent, setHeartbeatSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeInstanceRef = useRef<InteractiveGlobe | null>(null);

  const { saveKeepsake, isSaving } = useKeepsakeWriter();
  const runtime = useActivityRuntime({
    activityType: 'timezone',
    transportMode: 'auto',
  });

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live times using IANA Timezone definitions
  const getTimeInTz = (date: Date, timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return date.toLocaleTimeString();
    }
  };

  const getDateInTz = (date: Date, timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  };

  // Compute timezone offset difference in hours
  const getTzHourOffset = (timeZoneA: string, timeZoneB: string) => {
    try {
      const date = new Date();
      const strA = date.toLocaleString('en-US', { timeZone: timeZoneA });
      const strB = date.toLocaleString('en-US', { timeZone: timeZoneB });
      const diffMs = new Date(strB).getTime() - new Date(strA).getTime();
      return Math.round(diffMs / (3600 * 1000));
    } catch {
      return 13;
    }
  };

  const offsetHours = getTzHourOffset(tz1, tz2);

  // Selected cities geo
  const city1Geo = COMMON_TIMEZONES.find((c) => c.tz === tz1) || COMMON_TIMEZONES[0];
  const city2Geo = COMMON_TIMEZONES.find((c) => c.tz === tz2) || COMMON_TIMEZONES[1];

  const distanceKm = calculateGreatCircleDistance(
    city1Geo.lat,
    city1Geo.lng,
    city2Geo.lat,
    city2Geo.lng,
  );

  // 3D Globe Initialization
  useEffect(() => {
    if (viewMode !== 'globe' || !canvasRef.current) return;
    const globe = new InteractiveGlobe(
      canvasRef.current,
      {
        name: city1,
        lat: city1Geo.lat,
        lng: city1Geo.lng,
        color: '#437EEB',
      },
      {
        name: city2,
        lat: city2Geo.lat,
        lng: city2Geo.lng,
        color: '#FF4E78',
      },
    );
    globe.start();
    globeInstanceRef.current = globe;
    return () => globe.stop();
  }, [viewMode, city1, city2, city1Geo, city2Geo]);

  // Reunion Countdown calculation
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [reunionDate]);

  // Shared Packing Checklist
  const [packingList, setPackingList] = useState<PackingItem[]>([
    { id: '1', text: 'Passport & Travel Visa Documents', category: 'Documents', owner: 'mine', packed: true },
    { id: '2', text: 'Printed Boarding Passes & Hotel Reservation', category: 'Documents', owner: 'shared', packed: true },
    { id: '3', text: 'Favorite oversized hoodie sprayed with scent', category: 'Keepsakes', owner: 'partner', packed: true },
    { id: '4', text: 'Universal dual-voltage power plug adapter', category: 'Electronics', owner: 'shared', packed: false },
    { id: '5', text: 'Snacks & local treats partner misses', category: 'Gifts', owner: 'mine', packed: false },
    { id: '6', text: 'Noise-cancelling headphones for long-haul flight', category: 'Electronics', owner: 'mine', packed: false },
    { id: '7', text: 'Framed Dearly Us photostrip for nightstand', category: 'Keepsakes', owner: 'shared', packed: false },
  ]);

  const [newItemText, setNewItemText] = useState('');
  const [newItemCat, setNewItemCat] = useState<PackingItem['category']>('Essentials');
  const [newItemOwner, setNewItemOwner] = useState<PackingItem['owner']>('shared');
  const [sharedLoaded, setSharedLoaded] = useState(false);

  useEffect(() => {
    if (!space?.id) return;
    void loadActivityRecords<{
      city1?: string; city2?: string; tz1?: string; tz2?: string;
      reunionDate?: string; flightNotes?: string; packingList?: PackingItem[];
    }>(space.id, 'reunion').then((records) => {
      const saved = records.find((record) => record.key === 'current-reunion');
      if (!saved) return;
      if (saved.payload.city1) setCity1(saved.payload.city1);
      if (saved.payload.city2) setCity2(saved.payload.city2);
      if (saved.payload.tz1) setTz1(saved.payload.tz1);
      if (saved.payload.tz2) setTz2(saved.payload.tz2);
      if (saved.payload.reunionDate) setReunionDate(saved.payload.reunionDate);
      if (saved.payload.flightNotes) setFlightNotes(saved.payload.flightNotes);
      if (saved.payload.packingList) setPackingList(saved.payload.packingList);
    }).catch((error) => console.error('Failed to restore reunion plan:', error))
      .finally(() => setSharedLoaded(true));
  }, [space?.id]);

  useEffect(() => {
    if (!space?.id || !sharedLoaded) return;
    const timer = setTimeout(() => void upsertActivityRecord({
      coupleId: space.id, kind: 'reunion', key: 'current-reunion', title: 'Our Next Reunion',
      targetAt: Number.isNaN(Date.parse(reunionDate)) ? null : new Date(reunionDate).toISOString(),
      payload: { city1, city2, tz1, tz2, reunionDate, flightNotes, packingList },
    }).catch((error) => console.error('Failed to sync reunion plan:', error)), 700);
    return () => clearTimeout(timer);
  }, [city1, city2, tz1, tz2, reunionDate, flightNotes, packingList, sharedLoaded, space?.id]);

  const togglePacked = (id: string) => {
    sounds.playPop();
    setPackingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item)),
    );
    runtime.dispatch({
      type: 'timezone_packing_toggle',
      payload: { id },
    });
  };

  const addPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    sounds.playPop();
    const newItem: PackingItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      category: newItemCat,
      owner: newItemOwner,
      packed: false,
    };
    setPackingList((prev) => [...prev, newItem]);
    runtime.dispatch({
      type: 'timezone_packing_add',
      payload: { text: newItem.text, category: newItem.category },
    });
    setNewItemText('');
  };

  const sendHeartbeat = () => {
    sounds.playHeartbeat();
    setHeartbeatSent(true);
    globeInstanceRef.current?.triggerHeartbeatPulse();
    setTimeout(() => setHeartbeatSent(false), 2500);
  };

  const downloadCalendarFile = () => {
    sounds.playPop();
    const d = new Date(reunionDate);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dStr = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dearly Us//Timezone Reunion Hub//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Airport Reunion · ${partnerA} & ${partnerB}`,
      `DTSTART:${dStr}`,
      `DTEND:${dStr}`,
      `LOCATION:${city2} International Airport`,
      `DESCRIPTION:${flightNotes} · Counted down on Dearly Us!`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reunion-${partnerA}-${partnerB}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToOurSpace = async () => {
    sounds.playCelebration();
    const success = await saveKeepsake({
      kind: 'activity',
      title: `Airport Reunion Countdown · ${city1} ✈️ ${city2}`,
      subtitle: `${timeLeft.days} days until we close the distance (${distanceKm.toLocaleString()} km)`,
      metadata: {
        activityType: 'timezone',
        cityA: city1,
        cityB: city2,
        timezoneA: tz1,
        timezoneB: tz2,
        distanceKm,
        reunionDate,
        flightNotes,
        totalPacked: packingList.filter((i) => i.packed).length,
        totalItems: packingList.length,
      },
    });
    if (success) {
      setSaveSuccess(true);
      setCurrentStage('remember');
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <ActivityShell
      activityTitle="Timezone & Reunion Hub"
      activitySubtitle={`Connecting ${city1} and ${city2} · ${distanceKm.toLocaleString()} km apart`}
      currentStage={currentStage}
      partnerPresence={runtime.partnerPresence}
      roomCode={runtime.roomId}
      isHost={runtime.isHost}
      stageIndicator="Ready → Horizon → Countdown → Suitcase"
      guidancePhase="timezone"
      guidancePrivacyNote="Times and packing lists are private to your couple room."
      keepsakeSummary={{
        kind: 'activity',
        title: `Reunion Horizon · ${city1} ⇄ ${city2}`,
        subtitle: `${timeLeft.days} days remaining · ${packingList.filter((i) => i.packed).length}/${packingList.length} packed`,
        badge: 'Distance',
      }}
    >
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Top Controls: City & Timezone Selection */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>
                🌸 {partnerA}&apos;s City &amp; Timezone
              </label>
              <select
                value={tz1}
                onChange={(e) => {
                  setTz1(e.target.value);
                  const found = COMMON_TIMEZONES.find((c) => c.tz === e.target.value);
                  if (found) setCity1(found.label.split(' ')[0]);
                }}
                style={{
                  display: 'block',
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
              >
                {COMMON_TIMEZONES.map((c) => (
                  <option key={c.tz} value={c.tz}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '20px', color: 'var(--ink-soft)', alignSelf: 'center', marginTop: '14px' }}>
              ⇄
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>
                💙 {partnerB}&apos;s City &amp; Timezone
              </label>
              <select
                value={tz2}
                onChange={(e) => {
                  setTz2(e.target.value);
                  const found = COMMON_TIMEZONES.find((c) => c.tz === e.target.value);
                  if (found) setCity2(found.label.split(' ')[0]);
                }}
                style={{
                  display: 'block',
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
              >
                {COMMON_TIMEZONES.map((c) => (
                  <option key={c.tz} value={c.tz}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setViewMode(viewMode === 'globe' ? 'accessible' : 'globe')}
              className="btn btn-ghost"
              style={{ fontSize: '12.5px', padding: '8px 14px' }}
              title="Toggle between 3D Globe and accessible list representation"
            >
              {viewMode === 'globe' ? '📋 Horizon List View' : '🌐 3D Orbit Globe'}
            </button>
            <button
              onClick={sendHeartbeat}
              className="btn btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>💖</span>
              {heartbeatSent ? 'Heartbeat Sent!' : 'Send Heartbeat Touch'}
            </button>
          </div>
        </div>

        {/* Dual Live Clock Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Partner A Clock */}
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge" style={{ background: '#FFF0F5', color: '#B83280', fontWeight: 800 }}>
                🌸 {partnerA} · {city1}
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                {tz1}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '38px', fontWeight: 900, color: 'var(--pink)' }}>
              {getTimeInTz(now, tz1)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              {getDateInTz(now, tz1)}
            </div>
          </div>

          {/* Partner B Clock */}
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge" style={{ background: '#EBF8FF', color: '#2B6CB0', fontWeight: 800 }}>
                💙 {partnerB} · {city2}
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                {offsetHours >= 0 ? `+${offsetHours} hrs` : `${offsetHours} hrs`} · {tz2}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '38px', fontWeight: 900, color: '#3182CE' }}>
              {getTimeInTz(now, tz2)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              {getDateInTz(now, tz2)}
            </div>
          </div>
        </div>

        {/* Visual Earth Globe or Accessible Representation */}
        {viewMode === 'globe' ? (
          <div
            style={{
              background: 'linear-gradient(180deg, #161722 0%, #0F1017 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '24px 20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div>
                <span className="badge hot" style={{ fontSize: '11px' }}>
                  Great-Circle Flight Arc
                </span>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>
                  {city1} ✈️ {city2}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#FFD68A', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800 }}>
                  {distanceKm.toLocaleString()} km
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  Distance Between Hearts
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} width={600} height={300} style={{ maxWidth: '100%', height: 'auto', cursor: 'grab' }} />

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              <span>🖱️ Drag to rotate globe</span>
              <span>·</span>
              <span>🔴 Live Heartbeat Signal: Active</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
              Accessible Horizon Summary
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '16px' }}>
              Your great-circle distance is <b>{distanceKm.toLocaleString()} km</b>. 
              {offsetHours === 0 ? ' You both share the exact same timezone hour!' : ` ${city2} is ${Math.abs(offsetHours)} hours ${offsetHours > 0 ? 'ahead of' : 'behind'} ${city1}.`}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '12px 16px', background: 'var(--paper)', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{partnerA} Coordinates</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{city1Geo.lat}° N, {city1Geo.lng}° E</div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--paper)', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{partnerB} Coordinates</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{city2Geo.lat}° N, {city2Geo.lng}° E</div>
              </div>
            </div>
          </div>
        )}

        {/* 24-Hour Sweet Spot Calling Window Ribbon */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                24-Hour Mutual Awake &amp; Calling Ribbon
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                The green blocks represent your optimal calling window where neither of you is asleep or working.
              </p>
            </div>
            <span className="badge hot" style={{ padding: '6px 12px', fontSize: '12px' }}>
              ✨ Recommended Call: 8:00 PM – 10:30 PM ({city1})
            </span>
          </div>

          <div style={{ display: 'flex', height: '48px', borderRadius: '10px', overflow: 'hidden', background: '#E2E8F0' }}>
            {Array.from({ length: 24 }).map((_, h) => {
              const partnerBHour = (h + offsetHours + 24) % 24;
              const isSweetSpot = h >= 19 && h <= 22 && partnerBHour >= 8 && partnerBHour <= 12;
              const isSleepingA = h >= 0 && h <= 7;
              return (
                <div
                  key={h}
                  style={{
                    flex: 1,
                    background: isSweetSpot ? '#48BB78' : isSleepingA ? '#2D3748' : '#ECC94B',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    display: 'grid',
                    placeItems: 'center',
                    color: isSweetSpot || isSleepingA ? '#FFF' : '#1A202C',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}
                  title={`${city1}: ${h}:00 | ${city2}: ${partnerBHour}:00`}
                >
                  {h % 3 === 0 ? h : ''}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '14px', fontSize: '12.5px', color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#48BB78' }} />
              <b>Golden Overlap (Both Awake &amp; Available)</b>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ECC94B' }} />
              One Working / Awake
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#2D3748' }} />
              Night / Sleeping Hours
            </span>
          </div>
        </div>

        {/* Airport Reunion Countdown Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #181A24 0%, #292C3D 100%)',
            color: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--pink)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                ✈️ Airport Reunion Milestone
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>
                Until We Close the Distance
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="datetime-local"
                value={reunionDate}
                onChange={(e) => setReunionDate(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={downloadCalendarFile}
                className="btn btn-ghost"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '8px 14px' }}
                title="Download .ics event to sync to Google Calendar / Apple Calendar"
              >
                📅 Add to Calendar
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '42px', fontWeight: 900, color: 'var(--pink)' }}>
                {timeLeft.days}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Days</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '42px', fontWeight: 900, color: '#63B3ED' }}>
                {timeLeft.hours}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hours</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '42px', fontWeight: 900, color: '#FFD68A' }}>
                {timeLeft.minutes}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Minutes</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '42px', fontWeight: 900, color: '#4ECCA3' }}>
                {timeLeft.seconds}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Seconds</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={flightNotes}
              onChange={(e) => setFlightNotes(e.target.value)}
              placeholder="Flight details, terminal, arrival baggage gate..."
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
              }}
            />
            <button
              onClick={handleSaveToOurSpace}
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved to Our Space! 💖' : 'Save Milestone to Our Space'}
            </button>
          </div>
        </div>

        {/* Shared Suitcase & Travel Documents Checklist */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                🧳 Shared Suitcase &amp; Travel Checklist
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink-soft)' }}>
                Coordinate what each of you is packing so neither of you forgets adapters, keepsakes, or surprises.
              </p>
            </div>
            <span className="badge" style={{ background: '#EBF8FF', color: '#2B6CB0', fontWeight: 800 }}>
              {packingList.filter((i) => i.packed).length} / {packingList.length} Packed
            </span>
          </div>

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
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  <span
                    style={{
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
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      background: item.owner === 'mine' ? '#FFF0F5' : item.owner === 'partner' ? '#EBF8FF' : 'var(--paper-raised)',
                      color: item.owner === 'mine' ? 'var(--pink)' : item.owner === 'partner' ? '#3182CE' : 'var(--ink-soft)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {item.owner === 'mine' ? partnerA : item.owner === 'partner' ? partnerB : 'Both'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add item form */}
          <form onSubmit={addPackingItem} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Add packing item (e.g. Travel adapter, Letter for the plane)..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                fontSize: '13.5px',
                color: 'var(--ink)',
              }}
            />
            <select
              value={newItemCat}
              onChange={(e) => setNewItemCat(e.target.value as PackingItem['category'])}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            >
              <option value="Essentials">Essentials</option>
              <option value="Keepsakes">Keepsakes</option>
              <option value="Electronics">Electronics</option>
              <option value="Documents">Documents</option>
              <option value="Gifts">Gifts</option>
              <option value="Custom">Custom</option>
            </select>
            <select
              value={newItemOwner}
              onChange={(e) => setNewItemOwner(e.target.value as PackingItem['owner'])}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            >
              <option value="shared">Packed Together</option>
              <option value="mine">{partnerA}</option>
              <option value="partner">{partnerB}</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              + Add Item
            </button>
          </form>
        </div>
      </div>
    </ActivityShell>
  );
}

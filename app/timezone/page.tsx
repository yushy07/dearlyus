'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { InteractiveGlobe, calculateGreatCircleDistance } from '@/lib/globe';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import {
  loadActivityRecords,
  upsertActivityRecord,
} from '@/lib/activity-records';
import './timezone.css';

const COMMON_TIMEZONES = [
  {
    label: 'Calgary / Edmonton (MT)',
    tz: 'America/Edmonton',
    lat: 51.0447,
    lng: -114.0719,
  },
  {
    label: 'Jakarta / Bangkok (WIB)',
    tz: 'Asia/Jakarta',
    lat: -6.2088,
    lng: 106.8456,
  },
  {
    label: 'Vancouver / Seattle (PT)',
    tz: 'America/Vancouver',
    lat: 49.2827,
    lng: -123.1207,
  },
  {
    label: 'Toronto / New York (ET)',
    tz: 'America/Toronto',
    lat: 43.6532,
    lng: -79.3832,
  },
  {
    label: 'London / Dublin (GMT/BST)',
    tz: 'Europe/London',
    lat: 51.5074,
    lng: -0.1278,
  },
  {
    label: 'Paris / Berlin (CET)',
    tz: 'Europe/Paris',
    lat: 48.8566,
    lng: 2.3522,
  },
  {
    label: 'Tokyo / Seoul (JST/KST)',
    tz: 'Asia/Tokyo',
    lat: 35.6762,
    lng: 139.6503,
  },
  {
    label: 'Sydney / Melbourne (AEST)',
    tz: 'Australia/Sydney',
    lat: -33.8688,
    lng: 151.2093,
  },
  {
    label: 'Singapore / Manila (SGT)',
    tz: 'Asia/Singapore',
    lat: 1.3521,
    lng: 103.8198,
  },
];

export default function TimezoneHubPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const { space } = useCoupleSpace();
  const [city1, setCity1] = useState(cityA || 'Calgary');
  const [city2, setCity2] = useState(cityB || 'Jakarta');
  const [tz1, setTz1] = useState('America/Edmonton');
  const [tz2, setTz2] = useState('Asia/Jakarta');

  const [reunionDate, setReunionDate] = useState('2026-11-20T18:00');
  const [momentLabel, setMomentLabel] = useState('Our next moment together');
  const [viewMode, setViewMode] = useState<'globe' | 'accessible'>('globe');
  const [currentStage, setCurrentStage] = useState<
    'ready' | 'play' | 'remember'
  >('play');
  const [heartbeatSent, setHeartbeatSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeInstanceRef = useRef<InteractiveGlobe | null>(null);

  const { saveKeepsake, isSaving } = useKeepsakeWriter();
  const runtime = useActivityRuntime({
    activityType: 'timezone',
    transportMode: 'auto',
  });

  // Leave live clock fields blank until mount so the server and browser hydrate
  // the same view, then start the clock locally.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live times using IANA Timezone definitions
  const getTimeInTz = (date: Date | null, timeZone: string) => {
    if (!date) return '—';
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

  const getDateInTz = (date: Date | null, timeZone: string) => {
    if (!date) return '—';
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
  const overlapHours = Array.from({ length: 24 }, (_, hour) => hour).filter(
    (hour) => {
      const partnerHour = (hour + offsetHours + 24) % 24;
      return hour >= 7 && hour <= 22 && partnerHour >= 7 && partnerHour <= 22;
    },
  );
  const formatHour = (hour: number) => {
    const normalized = (hour + 24) % 24;
    const period = normalized >= 12 ? 'PM' : 'AM';
    const displayHour = normalized % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };
  const overlapRanges = overlapHours.reduce<
    Array<{ start: number; end: number }>
  >((ranges, hour) => {
    const current = ranges[ranges.length - 1];
    if (current && hour === current.end + 1) current.end = hour;
    else ranges.push({ start: hour, end: hour });
    return ranges;
  }, []);
  const overlapLabel = overlapRanges.length
    ? `${overlapRanges.map((range) => `${formatHour(range.start)} – ${formatHour(range.end + 1)}`).join(' & ')} (${city1})`
    : 'No easy awake-time overlap today';

  // Selected cities geo
  const city1Geo =
    COMMON_TIMEZONES.find((c) => c.tz === tz1) || COMMON_TIMEZONES[0];
  const city2Geo =
    COMMON_TIMEZONES.find((c) => c.tz === tz2) || COMMON_TIMEZONES[1];

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
        color: '#C89A9F',
      },
      {
        name: city2,
        lat: city2Geo.lat,
        lng: city2Geo.lng,
        color: '#B89A67',
      },
    );
    globe.start();
    globeInstanceRef.current = globe;
    return () => globe.stop();
  }, [viewMode, city1, city2, city1Geo, city2Geo]);

  // Reunion Countdown calculation
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
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

  const [sharedLoaded, setSharedLoaded] = useState(false);

  useEffect(() => {
    if (!space?.id) return;
    void loadActivityRecords<{
      city1?: string;
      city2?: string;
      tz1?: string;
      tz2?: string;
      reunionDate?: string;
      momentLabel?: string;
    }>(space.id, 'reunion')
      .then((records) => {
        const saved = records.find(
          (record) => record.key === 'current-reunion',
        );
        if (!saved) return;
        if (saved.payload.city1) setCity1(saved.payload.city1);
        if (saved.payload.city2) setCity2(saved.payload.city2);
        if (saved.payload.tz1) setTz1(saved.payload.tz1);
        if (saved.payload.tz2) setTz2(saved.payload.tz2);
        if (saved.payload.reunionDate)
          setReunionDate(saved.payload.reunionDate);
        if (saved.payload.momentLabel)
          setMomentLabel(saved.payload.momentLabel);
      })
      .catch((error) => console.error('Failed to restore reunion plan:', error))
      .finally(() => setSharedLoaded(true));
  }, [space?.id]);

  useEffect(() => {
    if (!space?.id || !sharedLoaded) return;
    const timer = setTimeout(
      () =>
        void upsertActivityRecord({
          coupleId: space.id,
          kind: 'reunion',
          key: 'current-reunion',
          title: 'Our Next Moment',
          targetAt: Number.isNaN(Date.parse(reunionDate))
            ? null
            : new Date(reunionDate).toISOString(),
          payload: { city1, city2, tz1, tz2, reunionDate, momentLabel },
        }).catch((error) =>
          console.error('Failed to sync reunion plan:', error),
        ),
      700,
    );
    return () => clearTimeout(timer);
  }, [
    city1,
    city2,
    tz1,
    tz2,
    reunionDate,
    momentLabel,
    sharedLoaded,
    space?.id,
  ]);

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
      'PRODID:-//Dearly Us//Across the Distance//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${momentLabel} · ${partnerA} & ${partnerB}`,
      `DTSTART:${dStr}`,
      `DTEND:${dStr}`,
      'DESCRIPTION:A shared moment set on Dearly Us.',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `next-moment-${partnerA}-${partnerB}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToOurSpace = async () => {
    sounds.playCelebration();
    const success = await saveKeepsake({
      kind: 'activity',
      title: `${momentLabel} · ${city1} ⇄ ${city2}`,
      subtitle: `${timeLeft.days} days to look forward to (${distanceKm.toLocaleString()} km apart)`,
      metadata: {
        activityType: 'timezone',
        cityA: city1,
        cityB: city2,
        timezoneA: tz1,
        timezoneB: tz2,
        distanceKm,
        reunionDate,
        momentLabel,
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
      activityTitle="Across the Distance"
      activitySubtitle={`Connecting ${city1} and ${city2} · ${distanceKm.toLocaleString()} km apart`}
      currentStage={currentStage}
      partnerPresence={runtime.partnerPresence}
      roomCode={runtime.roomId}
      isHost={runtime.isHost}
      stageIndicator="Clocks → Horizon → Shared moment"
      guidancePhase="timezone"
      guidancePrivacyNote="Times and your shared moment are private to your couple room."
      keepsakeSummary={{
        kind: 'activity',
        title: `Distance Between Us · ${city1} ⇄ ${city2}`,
        subtitle: `${timeLeft.days} days until ${momentLabel}`,
        badge: 'Distance',
      }}
    >
      <div className="distance-space">
        <div className="distance-space__intro" aria-hidden="true">
          <span>DEARLY US · ACROSS THE DISTANCE</span>
          <i>Two clocks, one shared rhythm</i>
        </div>

        {/* Top Controls: City & Timezone Selection */}
        <div
          className="distance-controls"
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
          <div className="distance-controls__cities">
            <div className="distance-city-field">
              <label>
                <span className="distance-person-dot distance-person-dot--rose" />{' '}
                {partnerA}&apos;s place
              </label>
              <select
                value={tz1}
                onChange={(e) => {
                  setTz1(e.target.value);
                  const found = COMMON_TIMEZONES.find(
                    (c) => c.tz === e.target.value,
                  );
                  if (found) setCity1(found.label.split(' ')[0]);
                }}
                className="distance-select"
              >
                {COMMON_TIMEZONES.map((c) => (
                  <option key={c.tz} value={c.tz}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="distance-controls__link" aria-hidden="true">
              <span>♡</span>
            </div>

            <div className="distance-city-field">
              <label>
                <span className="distance-person-dot distance-person-dot--brass" />{' '}
                {partnerB}&apos;s place
              </label>
              <select
                value={tz2}
                onChange={(e) => {
                  setTz2(e.target.value);
                  const found = COMMON_TIMEZONES.find(
                    (c) => c.tz === e.target.value,
                  );
                  if (found) setCity2(found.label.split(' ')[0]);
                }}
                className="distance-select"
              >
                {COMMON_TIMEZONES.map((c) => (
                  <option key={c.tz} value={c.tz}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="distance-controls__actions">
            <button
              onClick={() =>
                setViewMode(viewMode === 'globe' ? 'accessible' : 'globe')
              }
              className="distance-button distance-button--quiet"
              title="Toggle between 3D Globe and accessible list representation"
            >
              {viewMode === 'globe' ? 'Read the distance' : 'View the globe'}
            </button>
            <button
              onClick={sendHeartbeat}
              className="distance-button distance-button--heart"
            >
              <span aria-hidden="true">♡</span>
              {heartbeatSent ? 'Heartbeat sent' : 'Send a heartbeat'}
            </button>
          </div>
        </div>

        {/* Dual Live Clock Cards */}
        <div className="distance-clocks">
          {/* Partner A Clock */}
          <div
            className="distance-clock distance-clock--rose"
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span className="distance-clock__name">
                {partnerA} · {city1}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-soft)',
                }}
              >
                {tz1}
              </span>
            </div>
            <div className="distance-clock__time">{getTimeInTz(now, tz1)}</div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--ink-soft)',
                marginTop: '4px',
              }}
            >
              {getDateInTz(now, tz1)}
            </div>
          </div>

          {/* Partner B Clock */}
          <div
            className="distance-clock distance-clock--brass"
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span className="distance-clock__name">
                {partnerB} · {city2}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-soft)',
                }}
              >
                {offsetHours >= 0
                  ? `+${offsetHours} hrs`
                  : `${offsetHours} hrs`}{' '}
                · {tz2}
              </span>
            </div>
            <div className="distance-clock__time">{getTimeInTz(now, tz2)}</div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--ink-soft)',
                marginTop: '4px',
              }}
            >
              {getDateInTz(now, tz2)}
            </div>
          </div>
        </div>

        {/* Visual Earth Globe or Accessible Representation */}
        {viewMode === 'globe' ? (
          <div
            className="distance-globe"
            style={{
              background: '#33262D',
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
                  Between your worlds
                </span>
                <div
                  style={{
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 800,
                    marginTop: '4px',
                  }}
                >
                  {city1} ⇄ {city2}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    color: '#FFD68A',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '18px',
                    fontWeight: 800,
                  }}
                >
                  {distanceKm.toLocaleString()} km
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  apart, still connected
                </div>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              style={{ maxWidth: '100%', height: 'auto', cursor: 'grab' }}
            />

            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <span>Drag to turn the globe</span>
              <span>·</span>
              <span>Heartbeat line ready</span>
            </div>
          </div>
        ) : (
          <div
            className="distance-summary"
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h3
              style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}
            >
              Accessible Horizon Summary
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--ink-soft)',
                marginBottom: '16px',
              }}
            >
              Your great-circle distance is{' '}
              <b>{distanceKm.toLocaleString()} km</b>.
              {offsetHours === 0
                ? ' You both share the exact same timezone hour!'
                : ` ${city2} is ${Math.abs(offsetHours)} hours ${offsetHours > 0 ? 'ahead of' : 'behind'} ${city1}.`}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--paper)',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                  {partnerA} Coordinates
                </div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>
                  {city1Geo.lat}° N, {city1Geo.lng}° E
                </div>
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--paper)',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                  {partnerB} Coordinates
                </div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>
                  {city2Geo.lat}° N, {city2Geo.lng}° E
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shared time window */}
        <div
          className="distance-window"
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                Your shared time window
              </h3>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13.5px',
                  color: 'var(--ink-soft)',
                }}
              >
                Use this gentle guide to find a time that could work for both of
                you.
              </p>
            </div>
            <span className="distance-window__recommendation">
              Possible overlap · {overlapLabel}
            </span>
          </div>

          <div
            className="distance-ribbon"
            aria-label="Twenty-four hour shared availability guide"
          >
            {Array.from({ length: 24 }).map((_, h) => {
              const partnerBHour = (h + offsetHours + 24) % 24;
              const isAwakeA = h >= 7 && h <= 22;
              const isAwakeB = partnerBHour >= 7 && partnerBHour <= 22;
              const isSweetSpot = isAwakeA && isAwakeB;
              const periodClass = isSweetSpot
                ? 'overlap'
                : isAwakeA || isAwakeB
                  ? 'awake'
                  : 'sleep';
              return (
                <div
                  key={h}
                  className={`distance-ribbon__hour distance-ribbon__hour--${periodClass}`}
                  style={{
                    flex: 1,
                  }}
                  title={`${city1}: ${h}:00 | ${city2}: ${partnerBHour}:00`}
                >
                  {h % 3 === 0 ? h : ''}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '14px',
              fontSize: '12.5px',
              color: 'var(--ink-soft)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="distance-key distance-key--overlap" />
              <b>Possible overlap</b>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="distance-key distance-key--awake" />
              One may be awake
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="distance-key distance-key--sleep" />
              Likely sleeping
            </span>
          </div>
        </div>

        {/* Shared-moment countdown */}
        <div
          className="distance-countdown"
          style={{
            background: '#33262D',
            color: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--pink)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                YOUR NEXT SHARED MOMENT
              </span>
              <h2
                style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}
              >
                A little closer to {momentLabel}
              </h2>
            </div>
            <div className="distance-countdown__date">
              <input
                type="datetime-local"
                value={reunionDate}
                onChange={(e) => setReunionDate(e.target.value)}
                className="distance-dark-input"
              />
              <button
                onClick={downloadCalendarFile}
                className="distance-button distance-button--dark"
                title="Download .ics event to sync to Google Calendar / Apple Calendar"
              >
                Add to calendar
              </button>
            </div>
          </div>

          <div className="distance-countdown__numbers">
            <div className="distance-countdown__unit">
              <div>{timeLeft.days}</div>
              <div
                style={{
                  fontSize: '11px',
                  opacity: 0.8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Days
              </div>
            </div>
            <div className="distance-countdown__unit">
              <div>{timeLeft.hours}</div>
              <div
                style={{
                  fontSize: '11px',
                  opacity: 0.8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Hours
              </div>
            </div>
            <div className="distance-countdown__unit">
              <div>{timeLeft.minutes}</div>
              <div
                style={{
                  fontSize: '11px',
                  opacity: 0.8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Minutes
              </div>
            </div>
            <div className="distance-countdown__unit">
              <div>{timeLeft.seconds}</div>
              <div
                style={{
                  fontSize: '11px',
                  opacity: 0.8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Seconds
              </div>
            </div>
          </div>

          <div className="distance-countdown__actions">
            <input
              type="text"
              value={momentLabel}
              onChange={(e) => setMomentLabel(e.target.value)}
              placeholder="e.g. Friday movie call, our next hug"
              className="distance-dark-input distance-dark-input--label"
            />
            <button
              onClick={handleSaveToOurSpace}
              disabled={isSaving}
              className="distance-button distance-button--save"
            >
              {isSaving
                ? 'Saving...'
                : saveSuccess
                  ? 'Saved to Our Space! 💖'
                  : 'Save moment to Our Space'}
            </button>
          </div>
        </div>
      </div>
    </ActivityShell>
  );
}

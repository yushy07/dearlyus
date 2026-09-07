'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/sound';
import { saveScheduledDate } from '@/lib/account';

export interface TimezoneBridgeProps {
  coupleId?: string;
  partnerA?: string;
  partnerB?: string;
  timezoneA?: string;
  timezoneB?: string;
  cityA?: string;
  cityB?: string;
  scheduledDate?: { scheduledAt: string; title: string } | null;
  onDateScheduled?: () => void;
}

function getDetailsForTz(timezone?: string) {
  const now = new Date();
  try {
    const timeStr = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || undefined,
    }).format(now);

    const dateStr = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: timezone || undefined,
    }).format(now);

    const hour = Number(
      new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone || undefined,
      }).format(now),
    );

    return { timeStr, dateStr, hour };
  } catch {
    return {
      timeStr: now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      }),
      dateStr: now.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
      hour: now.getHours(),
    };
  }
}

export function TimezoneBridge({
  coupleId,
  partnerA = 'You',
  partnerB = 'Your person',
  timezoneA,
  timezoneB,
  cityA = 'Home',
  cityB = 'Away',
  scheduledDate,
  onDateScheduled,
}: TimezoneBridgeProps) {
  const [timeA, setTimeA] = useState(() => getDetailsForTz(timezoneA));
  const [timeB, setTimeB] = useState(() => getDetailsForTz(timezoneB));

  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('Our Cozy Date Night');
  const [isSaving, setIsSaving] = useState(false);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeA(getDetailsForTz(timezoneA));
      setTimeB(getDetailsForTz(timezoneB));
    }, 60000);
    return () => clearInterval(timer);
  }, [timezoneA, timezoneB]);

  // Warm time-aware copy generator
  const getGreetingCopy = () => {
    const hourA = timeA.hour;
    const hourB = timeB.hour;

    const isNightA = hourA >= 21 || hourA < 5;
    const isNightB = hourB >= 21 || hourB < 5;
    const isMorningA = hourA >= 5 && hourA < 12;
    const isMorningB = hourB >= 5 && hourB < 12;

    if (isMorningA && isNightB) {
      return `Sunrise for ${partnerA} while ${partnerB} drifts to sleep under the stars 🌙✨`;
    }
    if (isNightA && isMorningB) {
      return `Good night to ${partnerA} while ${partnerB} greets the morning sun ☀️💛`;
    }
    if (hourA >= 18 && hourB >= 18) {
      return `Both of your evening skies are glowing — perfect window for a date night 🍷🕯️`;
    }
    return `Bridging the distance across ${cityA} and ${cityB} with every passing minute ♡`;
  };

  const getOffsetLabel = () => {
    const diff = timeB.hour - timeA.hour;
    if (diff === 0) return 'Same timezone ♡';
    const ahead = (diff + 24) % 24;
    if (ahead <= 12) {
      return `${partnerB} is +${ahead}h ahead`;
    } else {
      return `${partnerB} is -${24 - ahead}h behind`;
    }
  };

  const handleSaveScheduled = async () => {
    if (!coupleId || !scheduleTime) return;
    setIsSaving(true);
    sounds.playChime();
    try {
      await saveScheduledDate(
        coupleId,
        new Date(scheduleTime).toISOString(),
        scheduleTitle,
      );
      setSchedulingOpen(false);
      onDateScheduled?.();
    } finally {
      setIsSaving(false);
    }
  };

  const isDayA = timeA.hour >= 6 && timeA.hour < 18;
  const isDayB = timeB.hour >= 6 && timeB.hour < 18;

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.95), var(--paper-subtle, #FAF8F5))',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌏</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--ink)',
                }}
              >
                Timezone Bridge
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--pink)',
                  background: 'var(--pink-tint)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 78, 120, 0.2)',
                }}
              >
                {getOffsetLabel()}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              Synchronized clocks across {cityA} &amp; {cityB}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSchedulingOpen((v) => !v)}
          className="btn btn-ghost"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            borderRadius: '999px',
          }}
        >
          📅 Schedule Next Date
        </button>
      </div>

      {/* Dual Clocks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Partner A */}
        <div
          style={{
            background: 'var(--paper-raised, #FFFFFF)',
            borderRadius: '18px',
            padding: '18px',
            border: '1px solid rgba(255, 78, 120, 0.25)',
            boxShadow: '0 4px 16px rgba(255, 78, 120, 0.06)',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--pink)',
              }}
            >
              🌸 {partnerA} ({cityA})
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--ink-soft)',
              }}
            >
              {isDayA ? '☀️ Day' : '🌙 Night'}
            </span>
          </div>
          <div
            style={{
              fontSize: '30px',
              fontWeight: 900,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {timeA.timeStr}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--ink-soft)',
              marginTop: '4px',
            }}
          >
            {timeA.dateStr}
          </div>
        </div>

        {/* Partner B */}
        <div
          style={{
            background: 'var(--paper-raised, #FFFFFF)',
            borderRadius: '18px',
            padding: '18px',
            border: '1px solid rgba(67, 126, 235, 0.25)',
            boxShadow: '0 4px 16px rgba(67, 126, 235, 0.06)',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--blue)',
              }}
            >
              💙 {partnerB} ({cityB})
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--ink-soft)',
              }}
            >
              {isDayB ? '☀️ Day' : '🌙 Night'}
            </span>
          </div>
          <div
            style={{
              fontSize: '30px',
              fontWeight: 900,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {timeB.timeStr}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--ink-soft)',
              marginTop: '4px',
            }}
          >
            {timeB.dateStr}
          </div>
        </div>
      </div>

      {/* Warm Time-Aware Copy */}
      <div
        style={{
          background: 'var(--pink-tint)',
          borderLeft: '3px solid var(--pink)',
          padding: '10px 14px',
          borderRadius: '0 10px 10px 0',
          fontSize: '13px',
          color: 'var(--ink)',
          marginBottom: '16px',
        }}
      >
        {getGreetingCopy()}
      </div>

      {/* Overlap Suggestions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            background: 'var(--paper-raised, #FFFFFF)',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ink-soft)',
            }}
          >
            ⏱️ 15 MIN QUICK SYNC
          </div>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--ink)',
              marginTop: '2px',
            }}
          >
            Bedtime Question
          </div>
        </div>

        <div
          style={{
            background: 'var(--paper-raised, #FFFFFF)',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ink-soft)',
            }}
          >
            ⏱️ 30 MIN SWEET SPOT
          </div>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--ink)',
              marginTop: '2px',
            }}
          >
            Quiz Lore Sync
          </div>
        </div>

        <div
          style={{
            background: 'var(--paper-raised, #FFFFFF)',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ink-soft)',
            }}
          >
            ⏱️ 60 MIN FULL DATE
          </div>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--ink)',
              marginTop: '2px',
            }}
          >
            Draw &amp; Ambient Radios
          </div>
        </div>
      </div>

      {/* Scheduled Date Display */}
      {scheduledDate && (
        <div
          style={{
            background:
              'linear-gradient(135deg, var(--pink-tint), var(--blue-tint))',
            padding: '12px 16px',
            borderRadius: '14px',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--pink)',
                textTransform: 'uppercase',
              }}
            >
              Next Scheduled Rendezvous
            </span>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--ink)',
                marginTop: '2px',
              }}
            >
              {scheduledDate.title} ·{' '}
              {new Date(scheduledDate.scheduledAt).toLocaleString([], {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </div>
          </div>
          <span style={{ fontSize: '20px' }}>💌</span>
        </div>
      )}
      {/* Scheduling Popover */}
      {schedulingOpen && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #FBCFE8',
          }}
        >
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 700,
              margin: '0 0 10px',
              color: '#881337',
            }}
          >
            Schedule Our Next Date Night
          </h4>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            />
            <input
              type="text"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              placeholder="Date night theme or title..."
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            />
          </div>
          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
          >
            <button
              type="button"
              onClick={() => setSchedulingOpen(false)}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveScheduled}
              disabled={isSaving || !scheduleTime}
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: '12px' }}
            >
              {isSaving ? 'Saving...' : 'Set Date'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

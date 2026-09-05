'use client';

import React from 'react';
import type { Keepsake } from '@/lib/account';

export interface MemoryWeatherProps {
  preferredMood?: string;
  moodHistory?: Array<{ mood: string; date: string }>;
  partnerA?: string;
  partnerB?: string;
  keepsakes?: Keepsake[];
}

const MOOD_META: Record<string, { label: string; icon: string; bg: string; color: string; forecast: string }> = {
  cozy: {
    label: 'Cozy',
    icon: '☕',
    bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
    color: '#92400E',
    forecast: 'Warm golden tea & blanket weather. Soft laughter and relaxed quiet moments.',
  },
  romantic: {
    label: 'Romantic',
    icon: '🌹',
    bg: 'linear-gradient(135deg, #FFE4E6, #FECDD3)',
    color: '#9F1239',
    forecast: 'Deep crimson sunset. High emotional resonance and tender late-night conversations.',
  },
  playful: {
    label: 'Playful',
    icon: '✨',
    bg: 'linear-gradient(135deg, #FEF9C3, #FDE047)',
    color: '#854D0E',
    forecast: 'Sunny spontaneous giggles. Cheerful banter and teasing energy across the miles.',
  },
  deep: {
    label: 'Deep',
    icon: '🌊',
    bg: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
    color: '#075985',
    forecast: 'Midnight ocean calm. Vulnerability, earnest truths, and soul-level understanding.',
  },
  spontaneous: {
    label: 'Spontaneous',
    icon: '⚡',
    bg: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
    color: '#6B21A8',
    forecast: 'Electric aurora flashes. Unplanned date nights, surprise calls, and wild inside jokes.',
  },
};

export function MemoryWeather({
  preferredMood = 'romantic',
  moodHistory = [],
  partnerA = 'You',
  partnerB = 'Your person',
  keepsakes = [],
}: MemoryWeatherProps) {
  // Count frequency of explicit moods
  const counts: Record<string, number> = { cozy: 0, romantic: 0, playful: 0, deep: 0, spontaneous: 0 };
  
  const explicitFromKeepsakes = keepsakes
    .map((k) => (k.metadata?.mood as string) || (k.metadata?.capsuleMood as string))
    .filter(Boolean)
    .map((m) => ({ mood: m.toLowerCase(), date: new Date().toISOString() }));

  const allMoodItems = [...explicitFromKeepsakes, ...moodHistory];
  
  if (allMoodItems.length > 0) {
    allMoodItems.forEach((item) => {
      const m = item.mood.toLowerCase();
      if (counts[m] !== undefined) counts[m] += 1;
    });
  } else {
    counts[preferredMood.toLowerCase() || 'romantic'] = 1;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  // Determine dominant mood
  let dominantMood = preferredMood.toLowerCase() || 'romantic';
  let highestCount = -1;
  Object.entries(counts).forEach(([mood, count]) => {
    if (count > highestCount) {
      highestCount = count;
      dominantMood = mood;
    }
  });

  const meta = MOOD_META[dominantMood] || MOOD_META.romantic;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid rgba(244, 114, 182, 0.25)',
        boxShadow: '0 10px 30px -5px rgba(225, 29, 72, 0.06)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🌤️</span>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>
              Memory Weather
            </h3>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              Atmosphere between {partnerA} &amp; {partnerB}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: meta.bg,
            color: meta.color,
            fontSize: '12.5px',
            fontWeight: 700,
          }}
        >
          <span>{meta.icon}</span>
          <span>{meta.label} Skies</span>
        </div>
      </div>

      <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5, margin: '0 0 16px', fontWeight: 500 }}>
        {meta.forecast}
      </p>

      {/* Mood Distribution Bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
          Chosen Date Mood Distribution ({total} {total === 1 ? 'session' : 'sessions'})
        </div>

        <div
          style={{
            display: 'flex',
            height: '10px',
            borderRadius: '999px',
            overflow: 'hidden',
            background: '#F3F4F6',
            gap: '2px',
          }}
        >
          {Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([mood, count]) => {
              const pct = Math.round((count / total) * 100);
              const mMeta = MOOD_META[mood] || MOOD_META.romantic;
              return (
                <div
                  key={mood}
                  title={`${mMeta.label}: ${pct}%`}
                  style={{
                    width: `${pct}%`,
                    background: mMeta.color,
                    borderRadius: '999px',
                  }}
                />
              );
            })}
        </div>
      </div>

      {/* Legend Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {Object.entries(counts)
          .filter(([, count]) => count > 0)
          .map(([mood, count]) => {
            const pct = Math.round((count / total) * 100);
            const mMeta = MOOD_META[mood] || MOOD_META.romantic;
            return (
              <span
                key={mood}
                style={{
                  fontSize: '11.5px',
                  color: mMeta.color,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{mMeta.icon}</span>
                <span>{mMeta.label} ({pct}%)</span>
              </span>
            );
          })}
      </div>

      {/* Explicit Disclaimer */}
      <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.4, borderTop: '1px dashed #F3F4F6', paddingTop: '10px' }}>
        🔒 <strong>Private &amp; Self-Chosen:</strong> Calculated strictly from your explicit mood selections when sealing date nights. Dearly Us never evaluates or judges your relationship health.
      </div>
    </div>
  );
}

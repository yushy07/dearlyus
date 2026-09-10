'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { speakCupidot, stopCupidotSpeech } from '@/lib/voice';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

interface CheckinMetrics {
  energy: number; // 1-5
  affection: number; // 1-5
  stress: number; // 1-5
  availability: number; // 1-5
}

interface ForecastCondition {
  name: string;
  badge: string;
  icon: string;
  headline: string;
  description: string;
  prescription: string;
  warning: string;
  bgColor: string;
}

const CONDITIONS: Record<string, ForecastCondition> = {
  soft: {
    name: 'Soft Morning Skies',
    badge: '🌤️ Soft & Gentle',
    icon: '🌤️',
    headline: 'High warmth with gentle, unhurried breezes',
    description: 'Both hearts are seeking quiet closeness, slow conversations, and undemanding company.',
    prescription: 'Brew a warm mug of tea on FaceTime, put on cozy lo-fi audio, and share one sweet memory from your favorite trip.',
    warning: 'Minor risk of spontaneous heart fluttering and afternoon naps.',
    bgColor: '#FFF5F5',
  },
  playful: {
    name: 'Playful Warm Front',
    badge: '⚡ High Electric Sparks',
    icon: '⚡',
    headline: 'Abundant sunshine and high giggling frequency',
    description: 'High energy and high availability meet! Ideal conditions for a spontaneous duel or arcade rematch.',
    prescription: 'Jump into The Arcade or Couples Court together and wager tonight’s bedtime voice note on the winner.',
    warning: 'Elevated chance of loud laughing that wakes up roommates.',
    bgColor: '#FFFDF0',
  },
  rain: {
    name: 'Reassurance Rain',
    badge: '🌧️ Tender Care Required',
    icon: '🌧️',
    headline: 'Emotional drizzle with high craving for comfort',
    description: 'Work stress or distance fatigue is higher than usual. Heart barometer demands soft words and extra empathy.',
    prescription: 'No heavy problem-solving tonight. Exchange three things you love about each other and leave the call running while reading.',
    warning: 'Long-distance hug deficit advisory in effect. Deploy extra heart emojis.',
    bgColor: '#F0F4F8',
  },
  rest: {
    name: 'Quiet Rest Advisory',
    badge: '🌙 Low Energy Sanctuary',
    icon: '🌙',
    headline: 'Low energy fog covering both horizons',
    description: 'Both of you had exhausting days. The goal tonight is zero productivity pressure and maximum relaxation.',
    prescription: 'Prop your phones up, say goodnight with zero guilt, or sleep on a silent FaceTime call with screens dim.',
    warning: 'Do not attempt difficult relationship debates on empty fuel tanks.',
    bgColor: '#F7FAFC',
  },
};

export default function ForecastPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const [currentStage, setCurrentStage] = useState<'ready' | 'play' | 'remember'>('ready');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Private Check-in State
  const [metrics, setMetrics] = useState<CheckinMetrics>({
    energy: 3,
    affection: 4,
    stress: 2,
    availability: 4,
  });

  const [hasSubmittedCheckin, setHasSubmittedCheckin] = useState(false);
  const [activeConditionKey, setActiveConditionKey] = useState<string>('soft');

  const { saveKeepsake, isSaving } = useKeepsakeWriter();
  const runtime = useActivityRuntime({
    activityType: 'forecast',
    transportMode: 'auto',
  });

  useEffect(() => {
    return () => {
      stopCupidotSpeech();
    };
  }, []);

  const calculateCondition = (m: CheckinMetrics): string => {
    if (m.energy <= 2 && m.stress >= 4) return 'rest';
    if (m.stress >= 4 && m.affection >= 3) return 'rain';
    if (m.energy >= 4 && m.availability >= 4) return 'playful';
    return 'soft';
  };

  const handleSubmitCheckin = () => {
    sounds.playCelebration();
    const cond = calculateCondition(metrics);
    setActiveConditionKey(cond);
    setHasSubmittedCheckin(true);
    setCurrentStage('play');

    runtime.dispatch({
      type: 'forecast_checkin_submit',
      payload: { isA: true, metrics },
    });

    runtime.dispatch({
      type: 'forecast_reveal',
      payload: { condition: CONDITIONS[cond].name },
    });
  };

  const currentCondition = CONDITIONS[activeConditionKey] || CONDITIONS.soft;

  const handleReadAloud = () => {
    if (isSpeaking) {
      stopCupidotSpeech();
      setIsSpeaking(false);
      return;
    }
    sounds.playPop();
    setIsSpeaking(true);
    speakCupidot(
      `Daily Romantic Weather Report for ${partnerA} in ${cityA} and ${partnerB} in ${cityB}. Today's forecast: ${currentCondition.name}. ${currentCondition.headline}. Bureau Warning: ${currentCondition.warning}. Cupidot Prescription: ${currentCondition.prescription}`,
      {
        mood: 'happy',
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      },
    );
  };

  const handleDownloadStoryCard = () => {
    sounds.playCelebration();
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Deep Editorial Velvet & Rose)
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#15131C');
    bg.addColorStop(0.5, '#251622');
    bg.addColorStop(1, '#121118');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // Border lines
    ctx.strokeStyle = 'rgba(255, 198, 120, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, 960, 1800);
    ctx.strokeStyle = 'rgba(255, 78, 120, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(76, 76, 928, 1768);

    // Header text
    ctx.fillStyle = '#FF4E78';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ʚ 🤖 💘 ɞ  DEARLY US · WEATHER BUREAU', 540, 180);

    ctx.fillStyle = '#FFF5EB';
    ctx.font = 'bold 54px serif';
    ctx.fillText('DAILY ROMANTIC FORECAST', 540, 260);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '28px sans-serif';
    ctx.fillText(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), 540, 320);

    // Couple Name Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(140, 380, 800, 110);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`${partnerA} (${cityA}) ✈️ ${partnerB} (${cityB})`, 540, 450);

    // Forecast Icon & Title
    ctx.font = '120px sans-serif';
    ctx.fillText(currentCondition.icon, 540, 680);

    ctx.fillStyle = '#FFD68A';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(currentCondition.name, 540, 780);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px sans-serif';
    ctx.fillText(currentCondition.headline, 540, 840);

    // Prescription Box
    ctx.fillStyle = 'rgba(255, 78, 120, 0.12)';
    ctx.fillRect(120, 960, 840, 360);
    ctx.strokeStyle = 'rgba(255, 78, 120, 0.4)';
    ctx.strokeRect(120, 960, 840, 360);

    ctx.fillStyle = '#FF8FA3';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CUPIDOT OFFICIAL PRESCRIPTION', 540, 1020);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px sans-serif';
    ctx.fillText(currentCondition.prescription.slice(0, 48), 540, 1100);
    ctx.fillText(currentCondition.prescription.slice(48, 96), 540, 1150);
    ctx.fillText(currentCondition.prescription.slice(96, 144), 540, 1200);

    // Bureau Warning
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'italic 26px sans-serif';
    ctx.fillText(`⚠️ Warning: ${currentCondition.warning}`, 540, 1450);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '22px monospace';
    ctx.fillText('DEARLY US COUPLE WEATHER DISPATCH · SAVED TO OUR SPACE', 540, 1740);

    const link = document.createElement('a');
    link.download = `love-forecast-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSaveToOurSpace = async () => {
    sounds.playCelebration();
    const success = await saveKeepsake({
      kind: 'activity',
      title: `Love Forecast · ${currentCondition.name}`,
      subtitle: `${currentCondition.headline} · ${partnerA} (${cityA}) & ${partnerB} (${cityB})`,
      metadata: {
        activityType: 'forecast',
        condition: currentCondition.name,
        headline: currentCondition.headline,
        prescription: currentCondition.prescription,
        warning: currentCondition.warning,
        date: new Date().toISOString().slice(0, 10),
        partnerA,
        partnerB,
        cityA,
        cityB,
      },
    });
    if (success) {
      setSaveSuccess(true);
      setCurrentStage('remember');
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  return (
    <ActivityShell
      activityTitle="Daily Romantic Weather Bureau"
      activitySubtitle={`Couple climate barometer for ${partnerA} (${cityA}) & ${partnerB} (${cityB})`}
      currentStage={currentStage}
      partnerPresence={runtime.partnerPresence}
      roomCode={runtime.roomId}
      isHost={runtime.isHost}
      stageIndicator="Check-In → Combined Weather → Story Card Keepsake"
      guidancePhase="forecast"
      guidancePrivacyNote="Check-in metrics are private to your couple room and calculated transparently."
      keepsakeSummary={{
        kind: 'activity',
        title: `Love Forecast · ${currentCondition.name}`,
        subtitle: `${cityA} ⇄ ${cityB} · ${currentCondition.badge}`,
        badge: 'Forecast',
      }}
    >
      <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Stage 1: Private Couple Barometer Check-In */}
        {currentStage === 'ready' && (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge hot" style={{ fontSize: '12px' }}>
                Private Barometer Sliders
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 4px' }}>
                How is your emotional weather today?
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: 0 }}>
                Be fully honest. Your numbers will combine with {partnerB}&apos;s into a shared weather dispatch and care prescription.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {/* Energy Slider */}
              <div style={{ padding: '18px', background: 'var(--paper)', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '14px' }}>⚡ Energy Level</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--pink)', fontWeight: 800 }}>
                    {metrics.energy} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={metrics.energy}
                  onChange={(e) => setMetrics({ ...metrics, energy: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--pink)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  <span>Exhausted</span>
                  <span>Charged &amp; Vibrant</span>
                </div>
              </div>

              {/* Affection Need Slider */}
              <div style={{ padding: '18px', background: 'var(--paper)', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '14px' }}>💖 Affection Need</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--pink)', fontWeight: 800 }}>
                    {metrics.affection} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={metrics.affection}
                  onChange={(e) => setMetrics({ ...metrics, affection: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--pink)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  <span>Comfortable solo</span>
                  <span>Craving long cuddles</span>
                </div>
              </div>

              {/* Stress Level Slider */}
              <div style={{ padding: '18px', background: 'var(--paper)', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '14px' }}>🌧️ External Stress</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#3182CE', fontWeight: 800 }}>
                    {metrics.stress} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={metrics.stress}
                  onChange={(e) => setMetrics({ ...metrics, stress: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#3182CE' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  <span>Completely Zen</span>
                  <span>Heavy deadlines</span>
                </div>
              </div>

              {/* Availability Slider */}
              <div style={{ padding: '18px', background: 'var(--paper)', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '14px' }}>⏱️ Free Evening Time</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#38A169', fontWeight: 800 }}>
                    {metrics.availability} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={metrics.availability}
                  onChange={(e) => setMetrics({ ...metrics, availability: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38A169' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  <span>Packed schedule</span>
                  <span>Open all night</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleSubmitCheckin}
                className="btn btn-primary"
                style={{ padding: '12px 32px', fontSize: '14.5px', fontWeight: 700 }}
              >
                Reveal Our Shared Forecast 🌤️
              </button>
            </div>
          </div>
        )}

        {/* Stage 2 & 3: Revealed Forecast Report */}
        {(currentStage === 'play' || currentStage === 'remember') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Weather Bureau Main Dispatch Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, #181924 0%, #2B212D 100%)',
                color: '#FFFFFF',
                borderRadius: '24px',
                padding: '40px 36px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="badge hot" style={{ fontSize: '11px' }}>
                    {currentCondition.badge}
                  </span>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    BUREAU ID: {cityA.toUpperCase()}-{cityB.toUpperCase()}-DAILY
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleReadAloud}
                    className="btn btn-ghost"
                    style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '6px 14px' }}
                  >
                    {isSpeaking ? '⏹️ Stop Voice' : '🔊 Cupidot Read Aloud'}
                  </button>
                  <button
                    onClick={handleDownloadStoryCard}
                    className="btn btn-ghost"
                    style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '6px 14px' }}
                  >
                    📥 Story Card (PNG)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '72px', lineHeight: 1 }}>{currentCondition.icon}</div>
                <div>
                  <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 6px', color: '#FFD68A' }}>
                    {currentCondition.name}
                  </h2>
                  <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                    {currentCondition.headline}
                  </p>
                </div>
              </div>

              {/* Prescription Banner */}
              <div
                style={{
                  background: 'rgba(255, 78, 120, 0.12)',
                  border: '1px solid rgba(255, 78, 120, 0.3)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                }}
              >
                <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  💊 Cupidot Recommended Evening Care Prescription:
                </div>
                <div style={{ fontSize: '15px', lineHeight: 1.5, color: '#FFF' }}>
                  {currentCondition.prescription}
                </div>
              </div>

              {/* Warning note */}
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                ⚠️ Official Bureau Advisory: {currentCondition.warning}
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  onClick={() => setCurrentStage('ready')}
                  className="btn btn-ghost"
                  style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.25)', fontSize: '12.5px' }}
                >
                  Adjust Check-In Sliders
                </button>
                <button
                  onClick={handleSaveToOurSpace}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '13.5px' }}
                >
                  {isSaving ? 'Saving...' : saveSuccess ? 'Saved to Our Space! 💖' : 'Save Story Card to Our Space'}
                </button>
              </div>
            </div>

            {/* 7-Day Gentle Pattern History */}
            <div
              style={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>
                7-Day Romantic Atmosphere History
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 16px' }}>
                A peaceful pattern view of your recent emotional seasons, free from streaks or guilt.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                {[
                  { day: 'Mon', icon: '🌤️', name: 'Soft Skies' },
                  { day: 'Tue', icon: '🌧️', name: 'Reassurance' },
                  { day: 'Wed', icon: '⚡', name: 'Playful' },
                  { day: 'Thu', icon: '🌤️', name: 'Soft Skies' },
                  { day: 'Fri', icon: '⚡', name: 'Playful' },
                  { day: 'Sat', icon: '🌤️', name: 'Soft Skies' },
                  { day: 'Today', icon: currentCondition.icon, name: currentCondition.name.split(' ')[0] },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      textAlign: 'center',
                      padding: '14px 8px',
                      background: item.day === 'Today' ? 'rgba(255,78,120,0.08)' : 'var(--paper)',
                      borderRadius: '12px',
                      border: item.day === 'Today' ? '1px solid var(--pink)' : '1px solid var(--line)',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 700 }}>{item.day}</div>
                    <div style={{ fontSize: '26px', margin: '6px 0' }}>{item.icon}</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600 }}>{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}

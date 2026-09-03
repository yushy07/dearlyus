'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CupidotBot, BotState } from '@/components/bot/CupidotBot';
import { generateLoveForecast, LoveForecast } from '@/lib/cupidot';
import { sounds } from '@/lib/sound';
import { speakCupidot } from '@/lib/voice';
import { CoupleNameBar, Confetti } from '@/components/shared';
import { GlowBadge } from '@/components/ui';
import { useCoupleProfile } from '@/lib/couple';

export default function ForecastPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const [forecast, setForecast] = useState<LoveForecast | null>(null);
  const [botState, setBotState] = useState<BotState>('happy');
  const [confettiActive, setConfettiActive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const f = generateLoveForecast(partnerA, partnerB, cityA || 'Calgary', cityB || 'Jakarta');
    setForecast(f);
  }, [partnerA, partnerB, cityA, cityB]);

  const handleReadAloud = () => {
    if (!forecast) return;
    sounds.playPop();
    setBotState('talking');
    speakCupidot(
      `Daily Romantic Weather Report for ${partnerA} and ${partnerB}. ${forecast.headline}. Warning: ${forecast.severeWeatherWarning}. ${forecast.cupidotPrescription}`,
      {
        mood: 'happy',
        onStart: () => setBotState('talking'),
        onEnd: () => setBotState('celebration'),
      }
    );
  };

  // 1-Click Instagram Story / Keepsake Card Export using HTML5 Canvas
  const handleExportCard = () => {
    if (!forecast) return;
    sounds.playCelebration();
    setIsExporting(true);
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2500);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // 1. Background gradient (Deep Midnight Velvet & Rose)
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#15131C');
    bg.addColorStop(0.4, '#24141E');
    bg.addColorStop(0.7, '#1B1424');
    bg.addColorStop(1, '#0F0E17');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ornate Golden Celestial Border
    ctx.strokeStyle = 'rgba(255, 198, 120, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, 980, 1820);
    ctx.strokeStyle = 'rgba(255, 77, 128, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(65, 65, 950, 1790);

    // 3. Header Badges
    ctx.fillStyle = '#FF4D80';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ʚ 🤖 💘 ɞ  ANGIE × CUPIDOT WEATHER BUREAU', 540, 140);

    ctx.fillStyle = '#FFE0B2';
    ctx.font = 'bold 54px serif';
    ctx.fillText('DAILY ROMANTIC FORECAST', 540, 220);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '32px sans-serif';
    ctx.fillText(forecast.dateString, 540, 275);

    // 4. Couple Names Banner
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(`${partnerA} ♡ ${partnerB}`, 540, 370);

    ctx.fillStyle = '#FFB899';
    ctx.font = 'italic 34px sans-serif';
    ctx.fillText(`${cityA || 'City A'}  ⇄  ${cityB || 'City B'}`, 540, 425);

    // 5. Center Radar Dials Frame
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(100, 480, 880, 360, 30);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    // Metric 1: Sweetness
    ctx.fillStyle = '#FF758C';
    ctx.font = 'bold 72px monospace';
    ctx.fillText(`${forecast.sweetnessPressure}%`, 250, 610);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Sweetness Pressure', 250, 660);
    ctx.font = '24px sans-serif';
    ctx.fillText('☁️ High Barometer', 250, 700);

    // Metric 2: Stolen Hoodie
    ctx.fillStyle = '#FFA07A';
    ctx.font = 'bold 72px monospace';
    ctx.fillText(`${forecast.stolenHoodieProbability}%`, 540, 610);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Stolen Hoodie Risk', 540, 660);
    ctx.font = '24px sans-serif';
    ctx.fillText('🧥 Severe Warning', 540, 700);

    // Metric 3: Laughter Humidity
    ctx.fillStyle = '#70A1FF';
    ctx.font = 'bold 72px monospace';
    ctx.fillText(`${forecast.laughterPrecipitation}%`, 830, 610);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Laughter Humidity', 830, 660);
    ctx.font = '24px sans-serif';
    ctx.fillText('🌦️ Heavy Showers', 830, 700);

    // 6. Headline & Atmospheric Notes
    ctx.fillStyle = 'rgba(255, 77, 128, 0.15)';
    ctx.roundRect(100, 880, 880, 240, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 77, 128, 0.4)';
    ctx.stroke();

    ctx.fillStyle = '#FF7BA3';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ ATMOSPHERIC HEADLINE', 140, 940);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px serif';
    // Wrap headline text
    const words = forecast.headline.split(' ');
    let line = '';
    let y = 1000;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 800 && n > 0) {
        ctx.fillText(line, 140, y);
        line = words[n] + ' ';
        y += 50;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 140, y);

    // 7. Severe Weather Warning
    ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
    ctx.roundRect(100, 1160, 880, 180, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.stroke();

    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('🚨 SEVERE ROMANTIC WEATHER WARNING', 140, 1215);

    ctx.fillStyle = '#FFF';
    ctx.font = '32px sans-serif';
    ctx.fillText(forecast.severeWeatherWarning.replace('⚠️ ', ''), 140, 1275);

    // 8. Cupidot Prescription
    ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
    ctx.roundRect(100, 1380, 880, 220, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.stroke();

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('💌 CUPIDOT\'S OFFICIAL PRESCRIPTION', 140, 1435);

    ctx.fillStyle = '#FFF9EB';
    ctx.font = 'italic 32px serif';
    ctx.fillText(forecast.cupidotPrescription, 140, 1500);

    // 9. Footer Watermark & Love Seal
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('CERTIFIED BY CUPIDOT 3D ROMANTIC AI · OURSPACE / ANGIE', 540, 1720);
    ctx.fillText('✨ KEEP THIS FORECAST FOREVER AS A MILESTONE ✨', 540, 1760);

    // Convert to image download
    const link = document.createElement('a');
    link.download = `Cupidot-Love-Forecast-${partnerA}-${partnerB}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsExporting(false);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '90px', color: 'var(--ink)' }}>
      <Confetti active={confettiActive} />

      {/* Top Angie Navigation Bar */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CoupleNameBar />
            <Link className="btn btn-sm" href="/activity">
              All Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ maxWidth: '860px', paddingTop: '32px' }}>
        {/* Header Ribbon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <GlowBadge text="Whimsical Couple Meteorological Bureau" size="md" />
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 900,
              letterSpacing: '-1px',
              margin: '12px 0 8px',
              background: 'linear-gradient(135deg, #1A121E 0%, #FF4D80 50%, #E04A18 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cupidot&apos;s Daily Love Forecast 🌦️
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '52ch', margin: '0 auto' }}>
            Autonomous romantic barometric pressure, hoodie-stealing probability, and celestial chemistry radar between{' '}
            <b>{partnerA}</b> &amp; <b>{partnerB}</b>.
          </p>
        </div>

        {/* 3D Meteorologist Cupidot Stage */}
        <div
          style={{
            background: 'linear-gradient(180deg, #FFF0F5 0%, #FFFFFF 100%)',
            border: '2px solid rgba(255, 77, 128, 0.25)',
            borderRadius: '24px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(255, 77, 128, 0.1)',
            marginBottom: '32px',
            position: 'relative',
          }}
        >
          <div style={{ width: '150px', height: '150px', margin: '0 auto -12px' }}>
            <CupidotBot state={botState} scale={2.4} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 77, 128, 0.1)',
              color: '#FF4D80',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
            }}
          >
            <span>📡 TELEMETRY ACTIVE</span>
            <span>·</span>
            <span>{forecast?.dateString}</span>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1B1C22', margin: '10px 0 4px' }}>
            {forecast?.headline}
          </h3>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            <button
              onClick={handleReadAloud}
              className="btn btn-sm"
              style={{
                background: '#FF4D80',
                color: '#FFF',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
              }}
            >
              <span>🔊</span>
              <span>Listen to Weather Report</span>
            </button>

            <button
              onClick={handleExportCard}
              disabled={isExporting}
              className="btn btn-grad btn-sm"
              style={{
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
              }}
            >
              <span>📸</span>
              <span>{isExporting ? 'Generating Keepsake...' : 'Download Instagram Story Keepsake'}</span>
            </button>
          </div>
        </div>

        {/* 3 Core Meteorological Barometer Dials */}
        {forecast && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {/* Dial 1: Sweetness Barometer */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '22px',
                border: '1.5px solid #FFD6E8',
                boxShadow: '0 4px 16px rgba(255, 77, 128, 0.08)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🍯</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', textTransform: 'uppercase' }}>
                Sweetness Barometer
              </div>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#1E1B24', margin: '4px 0' }}>
                {forecast.sweetnessPressure}%
              </div>
              <p style={{ fontSize: '12px', color: '#6A6874', margin: 0 }}>
                Atmospheric density of heart emojis and involuntary grinning.
              </p>
            </div>

            {/* Dial 2: Stolen Hoodie Warning */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '22px',
                border: '1.5px solid #FFE0D1',
                boxShadow: '0 4px 16px rgba(255, 120, 80, 0.08)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🧥</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#E04A18', textTransform: 'uppercase' }}>
                Stolen Hoodie Threat
              </div>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#1E1B24', margin: '4px 0' }}>
                {forecast.stolenHoodieProbability}%
              </div>
              <p style={{ fontSize: '12px', color: '#6A6874', margin: 0 }}>
                Imminent sweater confiscation upon next reunion contact.
              </p>
            </div>

            {/* Dial 3: Laughter Humidity */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '22px',
                border: '1.5px solid #D6E8FF',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.08)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>😂</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>
                Laughter Precipitation
              </div>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#1E1B24', margin: '4px 0' }}>
                {forecast.laughterPrecipitation}%
              </div>
              <p style={{ fontSize: '12px', color: '#6A6874', margin: 0 }}>
                Chance of late-night laughing snorts on speakerphone.
              </p>
            </div>
          </div>
        )}

        {/* Severe Romantic Weather Warning Alert Box */}
        {forecast && (
          <div
            style={{
              background: 'linear-gradient(135deg, #FFF5F5 0%, #FFF0F2 100%)',
              border: '2px dashed #FF4D80',
              borderRadius: '18px',
              padding: '20px 24px',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#D93838', textTransform: 'uppercase', letterSpacing: '1px' }}>
                OFFICIAL METEOROLOGICAL ADVISORY
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1B1C22', lineHeight: 1.5 }}>
              {forecast.severeWeatherWarning}
            </div>
            <div style={{ fontSize: '13px', color: '#FF4D80', fontWeight: 700, marginTop: '8px' }}>
              Corridor: {forecast.windDirection}
            </div>
          </div>
        )}

        {/* Partner Synced Radar Cards */}
        {forecast && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#FFF0F5', padding: '18px', borderRadius: '16px', border: '1px solid #FFD6E8' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)', marginBottom: '6px' }}>
                🌸 {partnerA}&apos;s Telemetry Radar
              </div>
              <div style={{ fontSize: '13.5px', color: '#4A3E34', lineHeight: 1.5 }}>
                {forecast.partnerANote}
              </div>
            </div>

            <div style={{ background: '#F0F7FF', padding: '18px', borderRadius: '16px', border: '1px solid #D6E8FF' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue)', marginBottom: '6px' }}>
                💙 {partnerB}&apos;s Telemetry Radar
              </div>
              <div style={{ fontSize: '13.5px', color: '#4A3E34', lineHeight: 1.5 }}>
                {forecast.partnerBNote}
              </div>
            </div>
          </div>
        )}

        {/* Cupidot Prescription Prescription Box */}
        {forecast && (
          <div
            style={{
              background: '#FFFDF9',
              border: '1.5px solid #F3E8DC',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>💌</span>
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1B1C22', margin: '0 0 8px' }}>
              Cupidot&apos;s Daily Prescription
            </h4>
            <p style={{ fontSize: '15px', fontStyle: 'italic', color: '#78350F', maxWidth: '58ch', margin: '0 auto 16px', lineHeight: 1.6 }}>
              &ldquo;{forecast.cupidotPrescription}&rdquo;
            </p>
            <button
              onClick={handleExportCard}
              className="btn btn-primary"
              style={{ fontSize: '14px', padding: '10px 24px' }}
            >
              Save Today&apos;s Weather Keepsake 📸
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

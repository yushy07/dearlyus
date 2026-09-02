'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/sound';

export function AudioPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rainVol, setRainVol] = useState(0.4);
  const [romanticVol, setRomanticVol] = useState(0.35);
  const [pianoVol, setPianoVol] = useState(0.35);
  const [lofiVol, setLofiVol] = useState(0.3);

  const toggleMaster = () => {
    if (isPlaying) {
      sounds.stopAllAmbience();
      setIsPlaying(false);
    } else {
      sounds.startRain(rainVol);
      sounds.startRomantic(romanticVol);
      sounds.startPiano(pianoVol);
      sounds.startLofiChords(lofiVol);
      setIsPlaying(true);
    }
  };

  const setPreset = (preset: 'rain' | 'cozy' | 'lofi') => {
    if (preset === 'rain') {
      setRainVol(0.6);
      setRomanticVol(0.2);
      setPianoVol(0.35);
      setLofiVol(0.2);
      if (isPlaying) {
        sounds.startRain(0.6);
        sounds.startRomantic(0.2);
        sounds.startPiano(0.35);
        sounds.startLofiChords(0.2);
      }
    } else if (preset === 'cozy') {
      setRainVol(0.2);
      setRomanticVol(0.6);
      setPianoVol(0.4);
      setLofiVol(0.3);
      if (isPlaying) {
        sounds.startRain(0.2);
        sounds.startRomantic(0.6);
        sounds.startPiano(0.4);
        sounds.startLofiChords(0.3);
      }
    } else if (preset === 'lofi') {
      setRainVol(0.3);
      setRomanticVol(0.2);
      setPianoVol(0.35);
      setLofiVol(0.6);
      if (isPlaying) {
        sounds.startRain(0.3);
        sounds.startRomantic(0.2);
        sounds.startPiano(0.35);
        sounds.startLofiChords(0.6);
      }
    }
  };

  return (
    <aside
      aria-label="Ambient sound player"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {isOpen && (
        <div
          style={{
            background: 'rgba(23, 24, 28, 0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '20px',
            width: '280px',
            color: '#FFFFFF',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
            animation: 'gl-rise 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800 }}>
              <span>📻</span>
              <span>Lofi Radio &amp; Ambience</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#999', fontSize: '16px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '16px' }}>
            <button
              onClick={() => setPreset('rain')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '6px 4px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🌧️ Attic Rain
            </button>
            <button
              onClick={() => setPreset('cozy')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '6px 4px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              💖 Romantic
            </button>
            <button
              onClick={() => setPreset('lofi')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '6px 4px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ☕ Tokyo Cafe
            </button>
          </div>

          {/* Track Sliders */}
          <div style={{ display: 'grid', gap: '10px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>🌧️ Rain</span>
                <span>{Math.round(rainVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={rainVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setRainVol(val);
                  if (isPlaying) sounds.startRain(val);
                }}
                style={{ width: '100%', accentColor: 'var(--blue)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>💖 Romantic Serenade</span>
                <span>{Math.round(romanticVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={romanticVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setRomanticVol(val);
                  if (isPlaying) sounds.startRomantic(val);
                }}
                style={{ width: '100%', accentColor: 'var(--pink)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>🎹 Piano Melody</span>
                <span>{Math.round(pianoVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={pianoVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPianoVol(val);
                  if (isPlaying) sounds.startPiano(val);
                }}
                style={{ width: '100%', accentColor: '#DDAA77' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>🎧 Lofi Chords</span>
                <span>{Math.round(lofiVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={lofiVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLofiVol(val);
                  if (isPlaying) sounds.startLofiChords(val);
                }}
                style={{ width: '100%', accentColor: '#9D8DF1' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(23, 24, 28, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '30px',
          padding: '6px 12px 6px 8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        }}
      >
        <button
          onClick={toggleMaster}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isPlaying ? 'var(--pink)' : 'rgba(255,255,255,0.12)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '14px',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={isPlaying ? 'Pause Ambience' : 'Play Ambience'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>📻</span>
          <span>{isPlaying ? 'Ambience Playing' : 'Radio Mixer'}</span>
        </button>
      </div>
    </aside>
  );
}

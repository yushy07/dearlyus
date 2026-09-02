'use client';

import React, { useState } from 'react';
import { sounds } from '@/lib/sound';

interface TrackConfig {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string;
  volume: number;
  setVolume: (v: number) => void;
  start: (v: number) => void;
}

export function AudioPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState<'warm' | 'romantic' | 'tokyo' | null>(null);

  const [warmVol, setWarmVol] = useState(0.4);
  const [romanticVol, setRomanticVol] = useState(0.35);
  const [pianoVol, setPianoVol] = useState(0.35);
  const [lofiVol, setLofiVol] = useState(0.3);

  // Previous non-zero volumes for quick channel mute/unmute
  const [prevVols, setPrevVols] = useState({
    warm: 0.4,
    romantic: 0.35,
    piano: 0.35,
    lofi: 0.3,
  });

  const toggleMaster = () => {
    sounds.playPop();
    if (isPlaying) {
      sounds.stopAllAmbience();
      setIsPlaying(false);
    } else {
      sounds.startWarm(warmVol);
      sounds.startRomantic(romanticVol);
      sounds.startPiano(pianoVol);
      sounds.startTokyoCafe(lofiVol);
      setIsPlaying(true);
    }
  };

  const setPreset = (preset: 'warm' | 'romantic' | 'tokyo') => {
    sounds.playPop();
    setActivePreset(preset);

    if (preset === 'warm') {
      setWarmVol(0.65);
      setRomanticVol(0.2);
      setPianoVol(0.35);
      setLofiVol(0.2);
      if (isPlaying) {
        sounds.startWarm(0.65);
        sounds.startRomantic(0.2);
        sounds.startPiano(0.35);
        sounds.startTokyoCafe(0.2);
      }
    } else if (preset === 'romantic') {
      setWarmVol(0.2);
      setRomanticVol(0.65);
      setPianoVol(0.4);
      setLofiVol(0.25);
      if (isPlaying) {
        sounds.startWarm(0.2);
        sounds.startRomantic(0.65);
        sounds.startPiano(0.4);
        sounds.startTokyoCafe(0.25);
      }
    } else if (preset === 'tokyo') {
      setWarmVol(0.3);
      setRomanticVol(0.2);
      setPianoVol(0.35);
      setLofiVol(0.65);
      if (isPlaying) {
        sounds.startWarm(0.3);
        sounds.startRomantic(0.2);
        sounds.startPiano(0.35);
        sounds.startTokyoCafe(0.65);
      }
    }
  };

  const toggleChannelMute = (
    key: 'warm' | 'romantic' | 'piano' | 'lofi',
    currentVol: number,
    setVol: (v: number) => void,
    startFn: (v: number) => void
  ) => {
    sounds.playPop();
    if (currentVol > 0) {
      setPrevVols((prev) => ({ ...prev, [key]: currentVol }));
      setVol(0);
      if (isPlaying) startFn(0);
    } else {
      const restored = prevVols[key] || 0.4;
      setVol(restored);
      if (isPlaying) startFn(restored);
    }
  };

  const tracks: TrackConfig[] = [
    {
      id: 'warm',
      name: 'Warm Ambience',
      subtitle: 'Rainfall & Cozy Waves',
      icon: '☕',
      color: 'var(--blue)',
      gradient: 'linear-gradient(90deg, #5FA0FF, #82B6FF)',
      volume: warmVol,
      setVolume: setWarmVol,
      start: (v) => sounds.startWarm(v),
    },
    {
      id: 'romantic',
      name: 'Romantic Serenade',
      subtitle: 'Strings & Acoustic Warmth',
      icon: '💖',
      color: 'var(--pink)',
      gradient: 'linear-gradient(90deg, #FF7BA3, #FFA0BC)',
      volume: romanticVol,
      setVolume: setRomanticVol,
      start: (v) => sounds.startRomantic(v),
    },
    {
      id: 'piano',
      name: 'Piano Melody',
      subtitle: 'Gentle Nocturne Chords',
      icon: '🎹',
      color: '#FFB347',
      gradient: 'linear-gradient(90deg, #FFB347, #FFCC80)',
      volume: pianoVol,
      setVolume: setPianoVol,
      start: (v) => sounds.startPiano(v),
    },
    {
      id: 'lofi',
      name: 'Tokyo Cafe',
      subtitle: 'Late Night Smooth Jazz',
      icon: '🎷',
      color: '#B388FF',
      gradient: 'linear-gradient(90deg, #B388FF, #D1B3FF)',
      volume: lofiVol,
      setVolume: setLofiVol,
      start: (v) => sounds.startTokyoCafe(v),
    },
  ];

  return (
    <aside
      aria-label="Ambient sound studio"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
      }}
    >
      {/* Floating Studio Modal */}
      {isOpen && (
        <div
          style={{
            background: 'rgba(14, 16, 22, 0.92)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '20px',
            padding: '20px 22px',
            width: '320px',
            color: '#FFFFFF',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(255, 123, 163, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            animation: 'gl-rise 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '140px',
              height: '140px',
              background: isPlaying ? 'radial-gradient(circle, rgba(255,123,163,0.25) 0%, transparent 70%)' : 'none',
              pointerEvents: 'none',
              transition: 'background 0.5s ease',
            }}
          />

          {/* Studio Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: isPlaying ? 'linear-gradient(135deg, rgba(255,123,163,0.3), rgba(95,160,255,0.3))' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                }}
              >
                📻
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Soundscape Studio</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isPlaying ? '#4ADE80' : '#888',
                      boxShadow: isPlaying ? '0 0 8px #4ADE80' : 'none',
                      display: 'inline-block',
                    }}
                  />
                  <span>{isPlaying ? '4 Tracks Active' : 'Ready to stream'}</span>
                </div>
              </div>
            </div>

            {/* Top Right EQ Visualizer & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isPlaying && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2.5px', height: '18px' }}>
                  <div className="radio-eq-bar" />
                  <div className="radio-eq-bar" />
                  <div className="radio-eq-bar" />
                  <div className="radio-eq-bar" />
                </div>
              )}

              <button
                onClick={() => {
                  sounds.playPop();
                  setIsOpen(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
                aria-label="Close radio mixer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Atmosphere Presets */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginBottom: '8px' }}>
              Curated Moods
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                onClick={() => setPreset('warm')}
                className="radio-preset-btn"
                style={{
                  background: activePreset === 'warm' ? 'rgba(95,160,255,0.22)' : 'rgba(255,255,255,0.05)',
                  border: activePreset === 'warm' ? '1px solid rgba(95,160,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '8px 4px',
                  color: activePreset === 'warm' ? '#82B6FF' : '#FFFFFF',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span style={{ fontSize: '14px' }}>☕</span>
                <span>Warm Cozy</span>
              </button>

              <button
                onClick={() => setPreset('romantic')}
                className="radio-preset-btn"
                style={{
                  background: activePreset === 'romantic' ? 'rgba(255,123,163,0.22)' : 'rgba(255,255,255,0.05)',
                  border: activePreset === 'romantic' ? '1px solid rgba(255,123,163,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '8px 4px',
                  color: activePreset === 'romantic' ? '#FFA0BC' : '#FFFFFF',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span style={{ fontSize: '14px' }}>💖</span>
                <span>Romantic</span>
              </button>

              <button
                onClick={() => setPreset('tokyo')}
                className="radio-preset-btn"
                style={{
                  background: activePreset === 'tokyo' ? 'rgba(179,136,255,0.22)' : 'rgba(255,255,255,0.05)',
                  border: activePreset === 'tokyo' ? '1px solid rgba(179,136,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '8px 4px',
                  color: activePreset === 'tokyo' ? '#D1B3FF' : '#FFFFFF',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span style={{ fontSize: '14px' }}>🎷</span>
                <span>Tokyo Cafe</span>
              </button>
            </div>
          </div>

          {/* 4 Interactive Channel Strips */}
          <div style={{ display: 'grid', gap: '8px', marginBottom: '18px' }}>
            {tracks.map((track) => {
              const isMuted = track.volume === 0;
              const percent = Math.round(track.volume * 100);

              return (
                <div
                  key={track.id}
                  className="radio-channel-card"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    padding: '9px 12px',
                  }}
                >
                  {/* Channel Meta & Mute */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {track.icon}
                      </span>
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: isMuted ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }}>
                          {track.name}
                        </div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>
                          {track.subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() =>
                          toggleChannelMute(
                            track.id as 'warm' | 'romantic' | 'piano' | 'lofi',
                            track.volume,
                            track.setVolume,
                            track.start
                          )
                        }
                        style={{
                          background: isMuted ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 6px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          color: isMuted ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
                          transition: 'all 0.15s ease',
                        }}
                        title={isMuted ? 'Unmute Channel' : 'Mute Channel'}
                      >
                        {isMuted ? '🔇' : '🔊'}
                      </button>

                      <span
                        style={{
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: isMuted ? 'rgba(255,255,255,0.3)' : track.color,
                          minWidth: '32px',
                          textAlign: 'right',
                        }}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Gradient-Filled Range Slider */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={track.volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        track.setVolume(val);
                        setActivePreset(null);
                        if (isPlaying) track.start(val);
                      }}
                      className="radio-slider"
                      style={{
                        background: `linear-gradient(90deg, ${track.color} 0%, ${track.color} ${percent}%, rgba(255,255,255,0.12) ${percent}%, rgba(255,255,255,0.12) 100%)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master Control Footer Bar */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button
              onClick={toggleMaster}
              style={{
                flex: 1,
                background: isPlaying
                  ? 'linear-gradient(135deg, #FF7BA3, #FF9E64)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
                border: isPlaying ? 'none' : '1px solid rgba(255,255,255,0.14)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: isPlaying ? '0 4px 18px rgba(255, 123, 163, 0.4)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
              <span>{isPlaying ? 'Pause Ambience' : 'Play Soundscape'}</span>
            </button>

            {isPlaying && (
              <button
                onClick={() => {
                  sounds.playPop();
                  sounds.stopAllAmbience();
                  setIsPlaying(false);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Mute All Sounds"
              >
                Mute
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Pill Trigger */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(16, 18, 24, 0.90)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: isPlaying ? '1px solid rgba(255, 123, 163, 0.4)' : '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '36px',
          padding: '6px 14px 6px 8px',
          boxShadow: isPlaying
            ? '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 24px rgba(255, 123, 163, 0.35)'
            : '0 8px 24px rgba(0, 0, 0, 0.35)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Play/Pause Round Trigger Button */}
        <button
          onClick={toggleMaster}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: isPlaying
              ? 'linear-gradient(135deg, var(--pink), #FF9E64)'
              : 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '13px',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: isPlaying ? '0 2px 10px rgba(255, 123, 163, 0.5)' : 'none',
          }}
          title={isPlaying ? 'Pause Ambience' : 'Play Soundscape'}
          aria-label={isPlaying ? 'Pause Ambience' : 'Play Soundscape'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Modal Opener / Indicator */}
        <button
          onClick={() => {
            sounds.playPop();
            setIsOpen(!isOpen);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '12.5px',
            fontWeight: 800,
            letterSpacing: '-0.2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Rotating Vinyl Icon When Playing */}
          <span
            className={isPlaying ? 'radio-spinning-disc' : ''}
            style={{
              fontSize: '14px',
              display: 'inline-block',
            }}
          >
            {isPlaying ? '💿' : '📻'}
          </span>

          <span>{isPlaying ? 'Soundscape Live' : 'Radio Mixer'}</span>

          {isPlaying && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px', marginLeft: '2px' }}>
              <div className="radio-eq-bar" style={{ width: '2px', height: '6px' }} />
              <div className="radio-eq-bar" style={{ width: '2px', height: '10px' }} />
              <div className="radio-eq-bar" style={{ width: '2px', height: '8px' }} />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

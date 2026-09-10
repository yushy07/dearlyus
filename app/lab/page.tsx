'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

type PresetType = '25/5' | '45/10' | '60/15';

interface PresetConfig {
  focusMin: number;
  breakMin: number;
  label: string;
  tag: string;
}

const PRESET_CONFIGS: Record<PresetType, PresetConfig> = {
  '25/5': { focusMin: 25, breakMin: 5, label: 'Pomodoro Focus', tag: '25m Focus / 5m Break' },
  '45/10': { focusMin: 45, breakMin: 10, label: 'Deep Work Block', tag: '45m Focus / 10m Break' },
  '60/15': { focusMin: 60, breakMin: 15, label: 'Studio Flow Session', tag: '60m Focus / 15m Break' },
};

export default function LabPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const [currentStage, setCurrentStage] = useState<'ready' | 'play' | 'remember'>('ready');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('25/5');
  const [isBreak, setIsBreak] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [completedBlocks, setCompletedBlocks] = useState(0);

  // Dual Desks State
  const [taskA, setTaskA] = useState('Writing & planning tomorrow’s sprint');
  const [taskB, setTaskB] = useState('Studying architecture & reading notes');
  const [statusA, setStatusA] = useState<'focused' | 'away' | 'tea'>('focused');
  const [statusB, setStatusB] = useState<'focused' | 'away' | 'tea'>('focused');

  // Independent Local Ambience Mixer
  const [ambientSound, setAmbientSound] = useState<'rain' | 'cafe' | 'lofi' | 'fire' | 'off'>('off');
  const [reflectionNote, setReflectionNote] = useState('It felt so grounding having you at the desk across from me.');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { saveKeepsake, isSaving } = useKeepsakeWriter();
  const runtime = useActivityRuntime({
    activityType: 'lab',
    transportMode: 'auto',
  });

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      sounds.playCelebration();
      setIsRunning(false);
      if (!isBreak) {
        setCompletedBlocks((b) => b + 1);
        setIsBreak(true);
        setSecondsLeft(PRESET_CONFIGS[selectedPreset].breakMin * 60);
        runtime.dispatch({ type: 'lab_block_complete', payload: {} });
      } else {
        setIsBreak(false);
        setSecondsLeft(PRESET_CONFIGS[selectedPreset].focusMin * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, isBreak, selectedPreset, runtime]);

  // Audio Ambience
  useEffect(() => {
    sounds.stopAllAmbience();
    if (!isRunning || ambientSound === 'off') {
      return;
    }
    if (ambientSound === 'rain') sounds.startRain(0.35);
    else if (ambientSound === 'cafe') sounds.startTokyoCafe(0.35);
    else if (ambientSound === 'lofi') sounds.startWarm(0.35);
    else if (ambientSound === 'fire') sounds.toggleFireplaceSound(true);

    return () => {
      sounds.stopAllAmbience();
    };
  }, [ambientSound, isRunning]);

  const handleSelectPreset = (preset: PresetType) => {
    sounds.playPop();
    setSelectedPreset(preset);
    setIsBreak(false);
    setIsRunning(false);
    setSecondsLeft(PRESET_CONFIGS[preset].focusMin * 60);
    runtime.dispatch({
      type: 'lab_preset_select',
      payload: { preset },
    });
  };

  const handleToggleRunning = () => {
    sounds.playPop();
    const next = !isRunning;
    setIsRunning(next);
    if (next && currentStage === 'ready') {
      setCurrentStage('play');
    }
    runtime.dispatch({
      type: next ? 'lab_start' : 'lab_pause',
      payload: {},
    });
  };

  const handleSkipToBreak = () => {
    sounds.playPop();
    setIsBreak(true);
    setIsRunning(false);
    setSecondsLeft(PRESET_CONFIGS[selectedPreset].breakMin * 60);
  };

  const handleFinishSession = () => {
    sounds.playCelebration();
    setIsRunning(false);
    sounds.stopAllAmbience();
    setCurrentStage('remember');
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const totalFocusMinutes = (completedBlocks * PRESET_CONFIGS[selectedPreset].focusMin) + (isBreak ? 0 : Math.floor((PRESET_CONFIGS[selectedPreset].focusMin * 60 - secondsLeft) / 60));

  const handleSaveCertificate = async () => {
    sounds.playCelebration();
    const success = await saveKeepsake({
      kind: 'activity',
      title: `Shared Study Session · ${totalFocusMinutes} Minutes Focused`,
      subtitle: `${partnerA} & ${partnerB} · ${completedBlocks} blocks completed`,
      metadata: {
        activityType: 'lab',
        preset: selectedPreset,
        totalFocusMinutes,
        completedBlocks,
        taskA,
        taskB,
        reflectionNote,
        partnerA,
        partnerB,
        cityA,
        cityB,
        date: new Date().toISOString().slice(0, 10),
      },
    });
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  return (
    <ActivityShell
      activityTitle="The Lab · Shared Co-Working Room"
      activitySubtitle={`Two desks, synchronized focus lamps, and calm presence for ${partnerA} & ${partnerB}`}
      currentStage={currentStage}
      partnerPresence={runtime.partnerPresence}
      roomCode={runtime.roomId}
      isHost={runtime.isHost}
      stageIndicator="Desk Setup → Focus Block → Tea Break Record"
      guidancePhase="intentions"
      guidancePrivacyNote="Task goals and presence are shared with your partner; ambient audio is strictly local."
      keepsakeSummary={{
        kind: 'activity',
        title: 'Study Room Session Record',
        subtitle: `${totalFocusMinutes} mins focused · ${completedBlocks} blocks`,
        badge: 'Study Room',
      }}
    >
      <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Desk Lamps Hero / Focus Timer Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #191B24 0%, #2A2633 100%)',
            color: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            position: 'relative',
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span className="badge hot" style={{ fontSize: '11.5px' }}>
              {isBreak ? '☕ Mutual Tea Break Time' : '💡 Synchronized Focus Block'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['25/5', '45/10', '60/15'] as PresetType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handleSelectPreset(p)}
                  className={`btn ${selectedPreset === p ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '6px 12px', fontSize: '12px', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Huge Timer Digits */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(56px, 8vw, 84px)', fontWeight: 900, color: isBreak ? '#4ECCA3' : 'var(--pink)', letterSpacing: '0.04em' }}>
              {timeStr}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>
              {isBreak ? 'Step away, stretch, sip water, or smile at each other' : `${PRESET_CONFIGS[selectedPreset].label} in progress`}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handleToggleRunning}
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '14.5px', fontWeight: 700 }}
            >
              {isRunning ? '⏸️ Pause Desk' : '▶️ Begin Focus Block'}
            </button>
            {!isBreak && isRunning && (
              <button
                onClick={handleSkipToBreak}
                className="btn btn-ghost"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '12px 20px', fontSize: '13.5px' }}
              >
                ☕ Take Tea Break Early
              </button>
            )}
            <button
              onClick={handleFinishSession}
              className="btn btn-ghost"
              style={{ color: '#4ECCA3', borderColor: '#4ECCA3', padding: '12px 20px', fontSize: '13.5px' }}
            >
              ✓ End Session &amp; Record
            </button>
          </div>
        </div>

        {/* Dual Desks Visual Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Desk A: Partner A */}
          <div
            style={{
              background: 'var(--paper-raised)',
              border: statusA === 'focused' && isRunning ? '2px solid var(--pink)' : '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge" style={{ background: '#FFF0F5', color: '#B83280', fontWeight: 800 }}>
                🌸 {partnerA}&apos;s Desk ({cityA})
              </span>
              <span style={{ fontSize: '12px', color: statusA === 'focused' && isRunning ? 'var(--pink)' : 'var(--ink-soft)', fontWeight: 700 }}>
                {statusA === 'focused' && isRunning ? '🟡 Lamp Warm &amp; Focused' : '⚪ Desk Light Dimmed'}
              </span>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Current Focus Intention:
            </div>
            <input
              type="text"
              value={taskA}
              onChange={(e) => setTaskA(e.target.value)}
              placeholder="What are you working on right now?"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13.5px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setStatusA(statusA === 'focused' ? 'away' : 'focused')}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {statusA === 'focused' ? '🚶 Step Away (5m)' : '✓ Back at Desk'}
              </button>
            </div>
          </div>

          {/* Desk B: Partner B */}
          <div
            style={{
              background: 'var(--paper-raised)',
              border: statusB === 'focused' && isRunning ? '2px solid #3182CE' : '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge" style={{ background: '#EBF8FF', color: '#2B6CB0', fontWeight: 800 }}>
                💙 {partnerB}&apos;s Desk ({cityB})
              </span>
              <span style={{ fontSize: '12px', color: statusB === 'focused' && isRunning ? '#3182CE' : 'var(--ink-soft)', fontWeight: 700 }}>
                {statusB === 'focused' && isRunning ? '🔵 Lamp Warm &amp; Focused' : '⚪ Desk Light Dimmed'}
              </span>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Current Focus Intention:
            </div>
            <input
              type="text"
              value={taskB}
              onChange={(e) => setTaskB(e.target.value)}
              placeholder="What is your partner tackling?"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13.5px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setStatusB(statusB === 'focused' ? 'away' : 'focused')}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {statusB === 'focused' ? '🚶 Step Away (5m)' : '✓ Back at Desk'}
              </button>
            </div>
          </div>
        </div>

        {/* Local Ambient Soundscape Mixer */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px' }}>
              🎧 Local Desk Ambience (Your Headphones Only)
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)' }}>
              Choose calming background audio that plays on your side without forcing sound on your partner.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'rain', label: '🌧️ Window Rain' },
              { key: 'cafe', label: '☕ Tokyo Cafe' },
              { key: 'lofi', label: '📻 Warm Lo-Fi' },
              { key: 'fire', label: '🔥 Fireplace' },
              { key: 'off', label: '🔇 Silent' },
            ].map((amb) => (
              <button
                key={amb.key}
                onClick={() => setAmbientSound(amb.key as any)}
                className={`btn ${ambientSound === amb.key ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
              >
                {amb.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stage 3: Closing Reflection & Keepsake Certificate */}
        {currentStage === 'remember' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                background: '#FFFDF9',
                color: '#222',
                borderRadius: '16px',
                padding: '36px',
                border: '2px solid #E2D9CE',
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                textAlign: 'center',
              }}
            >
              <span className="badge hot" style={{ fontSize: '11px', marginBottom: '10px' }}>
                Study Session Certificate
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 6px' }}>
                {totalFocusMinutes} Minutes of Parallel Presence
              </h3>
              <div style={{ fontSize: '13.5px', color: '#666', marginBottom: '20px' }}>
                {partnerA} ({cityA}) &amp; {partnerB} ({cityB}) · {completedBlocks} blocks completed
              </div>

              <div style={{ background: '#F8F6F0', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <b>🌸 {partnerA}:</b> {taskA}
                </div>
                <div>
                  <b>💙 {partnerB}:</b> {taskB}
                </div>
              </div>

              <div style={{ fontStyle: 'italic', fontSize: '13.5px', color: '#444', borderTop: '1px dashed #DDD', paddingTop: '16px' }}>
                &ldquo;{reflectionNote}&rdquo;
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                placeholder="Closing study thought or tea break note..."
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper-raised)',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={handleSaveCertificate}
                disabled={isSaving}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '14px', fontWeight: 700 }}
              >
                {isSaving ? 'Saving Certificate...' : saveSuccess ? 'Saved to Our Space! 💖' : 'Save Study Record to Our Space'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}

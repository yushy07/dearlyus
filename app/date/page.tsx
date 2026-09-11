'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { upsertActivityRecord } from '@/lib/activity-records';

interface ItineraryStep {
  id: string;
  title: string;
  durationMin: number;
  category: string;
  path: string;
  icon: string;
  description: string;
  done: boolean;
}

interface DatePreferences {
  duration: '30m' | '60m' | '90m' | '120m';
  mood: 'intimate' | 'playful' | 'creative' | 'kitchen';
  camera: 'full' | 'audio' | 'canvas';
  depth: 'deep' | 'light' | 'nostalgic';
}

const PRESET_PLANS: Record<string, { name: string; tag: string; description: string; steps: Omit<ItineraryStep, 'id' | 'done'>[] }> = {
  intimate: {
    name: 'Midnight Tea & Open Hearts',
    tag: '🕯️ Intimate & Warm',
    description: 'A slow-paced evening of deep curiosity, tactile stationery, and future dreaming.',
    steps: [
      {
        title: 'Honest Cards: Deep Reflection',
        durationMin: 20,
        category: 'Conversation',
        path: '/cards',
        icon: '🎴',
        description: 'Warm, unhurried questions about love, vulnerability, and our favorite memories.',
      },
      {
        title: 'Draw Together: Memory Sketches',
        durationMin: 20,
        category: 'Creative',
        path: '/draw',
        icon: '🎨',
        description: 'Draw your favorite inside joke or dream apartment on one synchronized canvas.',
      },
      {
        title: 'Letters to the Future: Wax Seal',
        durationMin: 20,
        category: 'Keepsake',
        path: '/letter',
        icon: '💌',
        description: 'Seal a handwritten letter and audio memo to be unlocked on our next reunion.',
      },
    ],
  },
  playful: {
    name: 'The Chaos & Arcade Rematch',
    tag: '⚡ Playful & Competitive',
    description: 'High-energy duel of reflexes, styling flair, and a celebratory 4-cut photobooth finish.',
    steps: [
      {
        title: 'The Arcade: Mini-Game Tournament',
        durationMin: 20,
        category: 'Competitive',
        path: '/arcade',
        icon: '🕹️',
        description: 'Battle for the high score across Asteroid Catch, Cloud Bouncer, and Pong.',
      },
      {
        title: 'Couples Court: Gavel Deliberation',
        durationMin: 20,
        category: 'Playful',
        path: '/court',
        icon: '⚖️',
        description: 'Settle harmless couple debates with humorous objections and house rules.',
      },
      {
        title: 'The 4-Cut Photobooth Strip',
        durationMin: 15,
        category: 'Milestone',
        path: '/photobooth',
        icon: '📸',
        description: 'Pose for a vintage 4-cut photostrip holding our favorite items to camera.',
      },
    ],
  },
  creative: {
    name: 'Studio Night: Art & Blueprint',
    tag: '✨ Creative & Dreaming',
    description: 'Co-design matching artifacts, scrapbook recent moments, and map future milestones.',
    steps: [
      {
        title: 'Matching Shirts Studio',
        durationMin: 25,
        category: 'Design',
        path: '/shirts',
        icon: '👕',
        description: 'Create a paired DIY tee graphic with connected lines and city coordinates.',
      },
      {
        title: 'Our Future: 3-Year Vision Board',
        durationMin: 25,
        category: 'Planning',
        path: '/future',
        icon: '🏡',
        description: 'Pin travel destinations, home dreams, and shared milestones to our timeline.',
      },
      {
        title: 'The Photobooth Strip',
        durationMin: 15,
        category: 'Milestone',
        path: '/photobooth',
        icon: '📸',
        description: 'Capture victory photos wearing our virtual creations.',
      },
    ],
  },
  kitchen: {
    name: 'Parallel Kitchen: Carbonara & Toast',
    tag: '🍝 Parallel Cooking',
    description: 'Cook the exact same comforting recipe in two kitchens, then dine on FaceTime.',
    steps: [
      {
        title: 'Prep & Sizzle: Garlic & Pasta',
        durationMin: 20,
        category: 'Cooking',
        path: '/date',
        icon: '🧄',
        description: 'Mince garlic on camera, boil pasta, and whip up the creamy egg sauce together.',
      },
      {
        title: 'Plate & Candlelight Dining',
        durationMin: 30,
        category: 'Dining',
        path: '/cards',
        icon: '🍷',
        description: 'Light a candle, plate your dish, and answer 3 lightweight dinner table prompts.',
      },
      {
        title: 'Photobooth: Toast to the Chef',
        durationMin: 15,
        category: 'Milestone',
        path: '/photobooth',
        icon: '🥂',
        description: 'Hold your forks and wine glasses to the camera for a victory photo strip.',
      },
    ],
  },
};

export default function DateNightPlannerPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>('intimate');
  const [currentStage, setCurrentStage] = useState<'ready' | 'play' | 'remember'>('ready');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [stepSecondsLeft, setStepSecondsLeft] = useState(1200);
  const [timerRunning, setTimerRunning] = useState(false);
  const [favoriteHighlight, setFavoriteHighlight] = useState('Laughing until our faces hurt during the photobooth!');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preference survey
  const [preferences, setPreferences] = useState<DatePreferences>({
    duration: '60m',
    mood: 'intimate',
    camera: 'full',
    depth: 'deep',
  });

  // Active Itinerary items
  const [itinerary, setItinerary] = useState<ItineraryStep[]>([
    {
      id: 'step-1',
      title: 'Honest Cards: Deep Reflection',
      durationMin: 20,
      category: 'Conversation',
      path: '/cards',
      icon: '🎴',
      description: 'Warm, unhurried questions about love, vulnerability, and our favorite memories.',
      done: false,
    },
    {
      id: 'step-2',
      title: 'Draw Together: Memory Sketches',
      durationMin: 20,
      category: 'Creative',
      path: '/draw',
      icon: '🎨',
      description: 'Draw your favorite inside joke or dream apartment on one synchronized canvas.',
      done: false,
    },
    {
      id: 'step-3',
      title: 'Letters to the Future: Wax Seal',
      durationMin: 20,
      category: 'Keepsake',
      path: '/letter',
      icon: '💌',
      description: 'Seal a handwritten letter and audio memo to be unlocked on our next reunion.',
      done: false,
    },
  ]);

  const { saveKeepsake, isSaving } = useKeepsakeWriter();
  const { space } = useCoupleSpace();
  const runtime = useActivityRuntime({
    activityType: 'date',
    transportMode: 'auto',
  });

  // Step countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && stepSecondsLeft > 0) {
      interval = setInterval(() => {
        setStepSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (stepSecondsLeft === 0 && timerRunning) {
      sounds.playCelebration();
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, stepSecondsLeft]);

  // Apply selected preset plan
  const applyPreset = (key: string) => {
    sounds.playPop();
    setSelectedPlanKey(key);
    const preset = PRESET_PLANS[key];
    if (preset) {
      const newSteps: ItineraryStep[] = preset.steps.map((s, idx) => ({
        ...s,
        id: `step-${Date.now()}-${idx}`,
        done: false,
      }));
      setItinerary(newSteps);
      setActiveStepIdx(0);
      setStepSecondsLeft(newSteps[0].durationMin * 60);
      setTimerRunning(false);
      runtime.dispatch({
        type: 'date_itinerary_build',
        payload: { itinerary: newSteps },
      });
    }
  };

  const startItinerary = () => {
    sounds.playCelebration();
    setCurrentStage('play');
    setActiveStepIdx(0);
    setStepSecondsLeft(itinerary[0].durationMin * 60);
    setTimerRunning(true);
    runtime.dispatch({
      type: 'date_step_start',
      payload: { stepIndex: 0 },
    });
  };

  const markStepDone = (idx: number) => {
    sounds.playPop();
    const updated = itinerary.map((item, i) => (i === idx ? { ...item, done: true } : item));
    setItinerary(updated);
    runtime.dispatch({
      type: 'date_step_complete',
      payload: { stepIndex: idx },
    });

    if (idx < itinerary.length - 1) {
      const nextIdx = idx + 1;
      setActiveStepIdx(nextIdx);
      setStepSecondsLeft(itinerary[nextIdx].durationMin * 60);
      setTimerRunning(false);
    } else {
      sounds.playCelebration();
      setCurrentStage('remember');
      runtime.dispatch({ type: 'date_finish', payload: {} });
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalMinutes = itinerary.reduce((acc, curr) => acc + curr.durationMin, 0);

  const handleSaveReceipt = async () => {
    sounds.playCelebration();
    const success = await saveKeepsake({
      kind: 'activity',
      title: `Date Night Receipt · ${PRESET_PLANS[selectedPlanKey]?.name || 'Custom Evening'}`,
      subtitle: `${itinerary.filter((s) => s.done).length}/${itinerary.length} acts completed · ${totalMinutes} total minutes`,
      metadata: {
        activityType: 'date',
        planName: PRESET_PLANS[selectedPlanKey]?.name || 'Custom Date Night',
        partnerA,
        partnerB,
        cityA,
        cityB,
        totalMinutes,
        steps: itinerary.map((s) => ({ title: s.title, duration: s.durationMin, done: s.done })),
        favoriteHighlight,
        completedAt: new Date().toISOString(),
      },
    });
    if (success) {
      if (space?.id) await upsertActivityRecord({
        coupleId: space.id, kind: 'date_plan', key: crypto.randomUUID(),
        title: PRESET_PLANS[selectedPlanKey]?.name || 'Custom Date Night',
        payload: { selectedPlanKey, preferences, itinerary, favoriteHighlight, totalMinutes },
        status: 'completed',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  return (
    <ActivityShell
      activityTitle="Date Night Architect & Itinerary"
      activitySubtitle={`Curated date evening for ${partnerA} (${cityA}) & ${partnerB} (${cityB})`}
      currentStage={currentStage}
      partnerPresence={runtime.partnerPresence}
      roomCode={runtime.roomId}
      isHost={runtime.isHost}
      stageIndicator="Preferences → Curate Itinerary → Live Execution → Thermal Receipt"
      guidancePhase="planning"
      guidancePrivacyNote="Itinerary timing and completed steps are synced with your partner."
      keepsakeSummary={{
        kind: 'activity',
        title: 'Date Night Itinerary Receipt',
        subtitle: `${itinerary.filter((s) => s.done).length}/${itinerary.length} acts finished`,
        badge: 'Architect',
      }}
    >
      <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Stage 1: Preferences & Curated Plans */}
        {currentStage === 'ready' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Preferences Bar */}
            <div
              style={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px' }}>
                1. Evening Preferences &amp; Energy Check
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                    Available Time
                  </label>
                  <select
                    value={preferences.duration}
                    onChange={(e) => setPreferences({ ...preferences, duration: e.target.value as any })}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    <option value="30m">30 Minutes (Quick Date)</option>
                    <option value="60m">60 Minutes (Standard)</option>
                    <option value="90m">90 Minutes (Deep Evening)</option>
                    <option value="120m">2 Hours+ (Full Date Night)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                    Conversation Depth
                  </label>
                  <select
                    value={preferences.depth}
                    onChange={(e) => setPreferences({ ...preferences, depth: e.target.value as any })}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    <option value="deep">Deep, Honest &amp; Intimate</option>
                    <option value="light">Playful &amp; Laugh-Out-Loud</option>
                    <option value="nostalgic">Nostalgic &amp; Future Dreams</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                    Camera Setup
                  </label>
                  <select
                    value={preferences.camera}
                    onChange={(e) => setPreferences({ ...preferences, camera: e.target.value as any })}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    <option value="full">Full Video &amp; Photobooth</option>
                    <option value="audio">Relaxed Video / Audio</option>
                    <option value="canvas">Co-Op Canvas &amp; Games</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Curated Date Packages */}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px' }}>
                2. Choose a Curated Date Night Arc
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {Object.entries(PRESET_PLANS).map(([key, plan]) => {
                  const isSelected = selectedPlanKey === key;
                  return (
                    <div
                      key={key}
                      onClick={() => applyPreset(key)}
                      style={{
                        padding: '24px',
                        borderRadius: '16px',
                        background: isSelected ? 'rgba(255, 78, 120, 0.05)' : 'var(--paper-raised)',
                        border: isSelected ? '2px solid var(--pink)' : '1px solid var(--line)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 8px 24px rgba(255,78,120,0.12)' : 'var(--shadow-sm)',
                      }}
                    >
                      <span className="badge" style={{ background: isSelected ? '#FFF0F5' : 'var(--paper)', color: isSelected ? 'var(--pink)' : 'var(--ink-soft)', fontWeight: 800 }}>
                        {plan.tag}
                      </span>
                      <h4 style={{ fontSize: '17px', fontWeight: 800, margin: '12px 0 6px' }}>
                        {plan.name}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 16px', minHeight: '38px' }}>
                        {plan.description}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {plan.steps.map((s, idx) => (
                          <div key={idx} style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                            <span>{s.icon}</span>
                            <span style={{ fontWeight: 600 }}>{s.title}</span>
                            <span style={{ marginLeft: 'auto', color: 'var(--ink-soft)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                              {s.durationMin}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Itinerary Preview & Launch Button */}
            <div
              style={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                  Ready to run: {PRESET_PLANS[selectedPlanKey]?.name}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                  Total Date Night Duration: <b>{totalMinutes} minutes</b> · {itinerary.length} synchronized acts
                </p>
              </div>
              <button
                onClick={startItinerary}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '14.5px', fontWeight: 700 }}
              >
                🚀 Start Date Night Now
              </button>
            </div>
          </div>
        )}

        {/* Stage 2: Live Synchronized Itinerary Runner */}
        {currentStage === 'play' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Active Step Hero */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1C1E2A 0%, #292B3A 100%)',
                color: '#FFFFFF',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span className="badge hot" style={{ fontSize: '12px' }}>
                  Act {activeStepIdx + 1} of {itinerary.length}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                  {timerRunning ? '⏳ Step In Progress' : '⏸️ Timer Paused'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {itinerary[activeStepIdx]?.icon}
                  </div>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px' }}>
                    {itinerary[activeStepIdx]?.title}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: '52ch' }}>
                    {itinerary[activeStepIdx]?.description}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '52px', fontWeight: 900, color: 'var(--pink)' }}>
                    {formatTimer(stepSecondsLeft)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      onClick={() => setTimerRunning((p) => !p)}
                      className="btn btn-ghost"
                      style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '6px 14px' }}
                    >
                      {timerRunning ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => setStepSecondsLeft(itinerary[activeStepIdx]?.durationMin * 60)}
                      className="btn btn-ghost"
                      style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '6px 14px' }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Active Step */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Link
                  href={`${itinerary[activeStepIdx]?.path}?roomId=${runtime.roomId || 'room'}`}
                  target="_blank"
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '14px', textDecoration: 'none' }}
                >
                  Open Activity in New Tab ↗
                </Link>
                <button
                  onClick={() => markStepDone(activeStepIdx)}
                  className="btn btn-ghost"
                  style={{
                    color: '#4ECCA3',
                    borderColor: '#4ECCA3',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  ✓ Complete &amp; Next Act
                </button>
              </div>
            </div>

            {/* Itinerary Track List */}
            <div
              style={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
                Evening Itinerary Track
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {itinerary.map((step, idx) => {
                  const isActive = idx === activeStepIdx;
                  return (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: isActive ? 'rgba(255,78,120,0.06)' : step.done ? 'rgba(72,187,120,0.06)' : 'var(--paper)',
                        border: isActive ? '1px solid var(--pink)' : step.done ? '1px solid #48BB78' : '1px solid var(--line)',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{step.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: step.done ? 'var(--ink-soft)' : 'var(--ink)' }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                          {step.category} · {step.durationMin} minutes
                        </div>
                      </div>
                      {step.done ? (
                        <span className="badge" style={{ background: '#C6F6D5', color: '#22543D', fontWeight: 800 }}>
                          ✓ Completed
                        </span>
                      ) : isActive ? (
                        <span className="badge hot">
                          Playing Now
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                          Upcoming
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stage 3: Date Night Thermal Receipt Keepsake */}
        {currentStage === 'remember' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            {/* Physical Thermal Receipt Card */}
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#FFFDF9',
                color: '#222',
                fontFamily: 'var(--font-mono)',
                padding: '36px 28px',
                borderRadius: '8px',
                border: '1px dashed #CCC',
                boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                position: 'relative',
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #BBB', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '2px' }}>DEARLY US</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>PARALLEL DATE NIGHT RECEIPT</div>
                <div style={{ fontSize: '12px', marginTop: '6px', fontWeight: 700 }}>
                  {partnerA} ✈️ {partnerB}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px dashed #BBB', paddingBottom: '16px', marginBottom: '16px' }}>
                {itinerary.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>{step.done ? '[X]' : '[ ]'} {step.title.slice(0, 24)}</span>
                    <span>{step.durationMin}m</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '16px' }}>
                <span>TOTAL ACTS COMPLETED</span>
                <span>{itinerary.filter((s) => s.done).length} / {itinerary.length}</span>
              </div>

              <div style={{ background: '#F7F7F7', padding: '12px', borderRadius: '6px', fontSize: '11.5px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 800, color: '#555', marginBottom: '4px' }}>FAVORITE MOMENT:</div>
                <div style={{ fontStyle: 'italic', color: '#333' }}>&ldquo;{favoriteHighlight}&rdquo;</div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#777', paddingTop: '8px', borderTop: '1px dashed #BBB' }}>
                NEXT DATE PROPOSAL: 100 Dates Bucket List &amp; Photobooth
                <br />
                *** THANK YOU FOR DATING TOGETHER ***
              </div>
            </div>

            {/* Form to update highlight note and save to Our Space */}
            <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={favoriteHighlight}
                onChange={(e) => setFavoriteHighlight(e.target.value)}
                placeholder="Our favorite highlight of this evening was..."
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper-raised)',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={handleSaveReceipt}
                disabled={isSaving}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '14px', fontWeight: 700 }}
              >
                {isSaving ? 'Saving Receipt...' : saveSuccess ? 'Saved to Our Space! 💖' : 'Save Date Night Receipt to Our Space'}
              </button>
              <button
                onClick={() => {
                  setCurrentStage('ready');
                  applyPreset(selectedPlanKey);
                }}
                className="btn btn-ghost"
                style={{ fontSize: '12.5px' }}
              >
                Plan Another Date Night
              </button>
            </div>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}

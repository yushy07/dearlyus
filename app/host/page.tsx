'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Confetti,
  CoupleNameBar,
  AiConsentToggle,
  ActivityShell,
} from '@/components/shared';
import { sounds } from '@/lib/sound';
import { DateReceiptData } from '@/lib/receipt-canvas';
import { ThermalReceiptModal } from '@/components/shared/ThermalReceiptModal';
import type { BotState } from '@/components/bot/CupidotBot';
import { Cupidot2D } from '@/components/bot/Cupidot2D';
import { useCoupleProfile } from '@/lib/couple';
import { useAiConsent } from '@/lib/ai-consent';
import { generateAdaptiveQuestion } from '@/lib/gemini';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { usePrivateAnswers } from '@/hooks/usePrivateAnswers';

interface HostScenario {
  id: number;
  category: string;
  question: string;
  options: string[];
  commentary?: string;
}

const HOST_TONES = [
  { id: 'cozy', label: 'Cozy & Intimate', icon: '🕯️', desc: 'Soft questions, quiet moments, slow connection' },
  { id: 'playful', label: 'Playful Debates', icon: '✨', desc: 'Silly hypothetical dilemmas & travel instincts' },
  { id: 'deep', label: 'Soulful & Deep', icon: '🌊', desc: 'Meaningful reflections, dreams & unspoken thoughts' },
  { id: 'chaotic', label: 'Late Night Chaos', icon: '🌙', desc: '2 AM absurdity, karaoke duets & high laughs' },
];

const CURATED_SCENARIOS: Record<string, HostScenario[]> = {
  cozy: [
    {
      id: 101,
      category: 'Cozy Living',
      question: 'A rainy Sunday afternoon with nowhere to be. What is our unspoken couple sanctuary ritual?',
      options: [
        'Brew tea/coffee in silence, curl under one thick duvet with two books',
        'Cook a complex slow meal together while playing lo-fi jazz in the kitchen',
        'Binge a nostalgic comfort show from start to finish with takeout on the carpet',
        'Build a living room pillow fort, light candles, and just talk until evening',
      ],
      commentary: 'Observing your quiet Sunday frequency and cozy retreat chemistry!',
    },
    {
      id: 102,
      category: 'Tender Habit',
      question: 'When one of us has had an exhausting day, what is the best non-verbal gesture of support?',
      options: [
        'An unprompted head or shoulder massage without asking any questions',
        'Handing over a favorite warm drink and leaving quiet space to decompress',
        'A long, silent 30-second hug before saying a single word',
        'Putting away all chores quietly so there is zero mental clutter to face',
      ],
      commentary: 'Noting how you care for each other during quiet moments.',
    },
  ],
  playful: [
    {
      id: 201,
      category: 'Spontaneous Travel',
      question: 'We just landed in a dream city for our 2-week reunion trip, but our luggage was delayed 24 hours. Game plan?',
      options: [
        'Check into the hotel, order room service & sleep off the jetlag',
        'Buy cheap thrift outfits and start exploring immediately',
        'Go to a 24-hour convenience store and feast on foreign snacks',
        'Hunt down the best local ramen / street food stall on foot in the rain',
      ],
      commentary: 'Assessing couple spontaneous travel instincts and crisis resilience!',
    },
    {
      id: 202,
      category: 'Midnight Adventure',
      question: 'We enter a couple karaoke tournament at 2 AM in Tokyo. Which duet are we singing to guarantee first place?',
      options: [
        'A dramatic 90s ballad with full impassioned arm gestures',
        'An energetic pop track with synchronized hand choreography',
        'A classic Disney duet we secretly both know all the words to',
        'An upbeat rock anthem where we scream the chorus together',
      ],
      commentary: 'Observing your stage synergy and secret performance dreams!',
    },
  ],
  deep: [
    {
      id: 301,
      category: 'Life & Horizons',
      question: 'If we could pause time for exactly one week with zero responsibilities, where do we go together?',
      options: [
        'A secluded cabin in the misty mountains with a wood stove and no signal',
        'A quiet coastal village with stone cottages and long morning walks by the sea',
        'A bustling historic European capital wandering bookstores and evening cafes',
        'Right at home, phones turned off, cooking and resting in our own world',
      ],
      commentary: 'Dissecting your deepest shared haven and escape fantasies!',
    },
    {
      id: 302,
      category: 'Unspoken Devotion',
      question: 'Looking ahead 10 years, what is the one quality about our bond that you hope never changes?',
      options: [
        'The effortless way we can laugh until our stomachs hurt at small things',
        'How safe and peaceful it feels to be completely quiet next to each other',
        'Our unwavering teamwork when life throws unexpected storms at us',
        'The butterflies and warmth whenever we reunite after time apart',
      ],
      commentary: 'Touching upon the anchor that holds your relationship together.',
    },
  ],
  chaotic: [
    {
      id: 401,
      category: '2 AM Hypothetical',
      question: 'A mysterious millionaire offers us $100,000, BUT we must wear matching medieval knight armor for 7 consecutive days. Do we take it?',
      options: [
        'Absolutely yes, we clank into grocery stores like royal champions',
        'Only if we get custom matching capes and wooden swords',
        'No way, the chafing and airport security would destroy us',
        'We negotiate for $250,000 and then wear it for a month',
      ],
      commentary: 'Evaluating financial pragmatism versus couple public dignity!',
    },
    {
      id: 402,
      category: 'Wild Stakes',
      question: 'Zombie apocalypse starts right now. What are our assigned couple roles?',
      options: [
        'One plans master survival strategy, the other hoards snacks and supplies',
        'Both barricade the bedroom and watch movies until it blows over',
        'We adopt a stray dog, find a sailboat, and live off fish in the ocean',
        'We immediately become the neighborhood warlords with matching leather jackets',
      ],
      commentary: 'Survival chemistry tested and certified by the Host!',
    },
  ],
};

export default function DateHostPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { hasAiConsent } = useAiConsent();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [actStage, setActStage] = useState<'checkin' | 'dilemmas' | 'closing'>('checkin');
  const [selectedTone, setSelectedTone] = useState<'playful' | 'romantic' | 'deep' | 'spicy'>('playful');
  const [scenarios, setScenarios] = useState<HostScenario[]>(CURATED_SCENARIOS.playful);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [partnerAPick, setPartnerAPick] = useState<number | null>(null);
  const [partnerBPick, setPartnerBPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hostCommentary, setHostCommentary] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [receiptModalData, setReceiptModalData] = useState<DateReceiptData | null>(null);
  const [botState, setBotState] = useState<BotState>('idle');
  const [steeringToast, setSteeringToast] = useState<string | null>(null);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const [sessionHistory, setSessionHistory] = useState<
    Array<{ question: string; answerA: string; answerB: string; agreement: boolean }>
  >([]);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-host` : 'local-host',
    activityType: 'host',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { theme: selectedTone, promptIndex: currentIdx },
  });

  const scenario = scenarios[currentIdx] || scenarios[0];
  const isLivePair = runtime.transportName !== 'mock';
  const privateChoices = usePrivateAnswers({
    roundNumber: currentIdx,
    localRuntime: runtime,
  });

  const completeReveal = (pickA: number, pickB: number) => {
    if (revealed) return;
    setPartnerAPick(pickA);
    setPartnerBPick(pickB);
    setRevealed(true);
    void runtime.sendEvent('host_speaker_switch', { activeSpeaker: partnerB });

    const isMatch = pickA === pickB;
    if (isMatch) {
      sounds.playCelebration();
      setConfettiActive(true);
      setBotState('celebration');
      setTimeout(() => setConfettiActive(false), 2500);
      setTimeout(() => setBotState('love'), 1800);
    } else {
      sounds.playCountdownBeep(true);
      setBotState('talking');
      setTimeout(() => setBotState('happy'), 2000);
    }

    const currentRoundData = {
      question: scenario.question,
      answerA: scenario.options[pickA],
      answerB: scenario.options[pickB],
      agreement: isMatch,
    };
    setSessionHistory((history) =>
      history.some((entry) => entry.question === currentRoundData.question)
        ? history
        : [...history, currentRoundData],
    );
    const updatedHistory = sessionHistory.some((entry) => entry.question === currentRoundData.question)
      ? sessionHistory
      : [...sessionHistory, currentRoundData];
    if (hasAiConsent) {
      void generateAdaptiveQuestion({
        partnerA: { name: partnerA, answer: scenario.options[pickA] },
        partnerB: { name: partnerB, answer: scenario.options[pickB] },
        mode: 'host',
        mood: selectedTone,
        aiConsent: true,
        history: updatedHistory.map((entry) => ({
          question: entry.question,
          answerA: entry.answerA,
          answerB: entry.answerB,
        })),
      }).then((data: any) => {
        if (!data?.question || !Array.isArray(data.options)) return;
        const nextScenario: HostScenario = {
          id: Date.now(),
          category: 'Adaptive Follow-Up',
          question: data.question,
          options: data.options,
          commentary: data.commentary || 'Observing your real-time couple synergy!',
        };
        setScenarios((items) => {
          if (items.some((item) => item.question === nextScenario.question)) return items;
          const nextList = [...items];
          nextList.splice(currentIdx + 1, 0, nextScenario);
          return nextList;
        });
        if (data.commentary) setHostCommentary(data.commentary);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!privateChoices.revealedAnswers || privateChoices.revealedAnswers.length < 2) return;
    const mine = Number(
      privateChoices.revealedAnswers.find((answer) => answer.userId === runtime.currentUserId)?.answer,
    );
    const theirs = Number(
      privateChoices.revealedAnswers.find((answer) => answer.userId !== runtime.currentUserId)?.answer,
    );
    if (!Number.isInteger(mine) || !Number.isInteger(theirs)) return;
    completeReveal(runtime.isHost ? mine : theirs, runtime.isHost ? theirs : mine);
  }, [privateChoices.revealedAnswers]);

  useEffect(() => {
    const snap = runtime.snapshot as { promptIndex?: number; theme?: string };
    if (typeof snap?.promptIndex === 'number' && snap.promptIndex < scenarios.length) {
      setCurrentIdx(snap.promptIndex);
    }
    if (snap?.theme && CURATED_SCENARIOS[snap.theme] && snap.theme !== selectedTone) {
      setSelectedTone(snap.theme as 'playful' | 'romantic' | 'deep' | 'spicy');
      setScenarios(CURATED_SCENARIOS[snap.theme]);
    }
  }, [runtime.snapshot, scenarios.length, selectedTone]);

  const handleSelectTone = (toneId: 'playful' | 'romantic' | 'deep' | 'spicy') => {
    sounds.playPop();
    setSelectedTone(toneId);
    setScenarios(CURATED_SCENARIOS[toneId] || CURATED_SCENARIOS.playful);
    setCurrentIdx(0);
    void runtime.sendEvent('host_tone_change', { theme: toneId });
  };

  const handleStartHostNight = () => {
    sounds.playCelebration();
    setActStage('dilemmas');
    setBotState('talking');
    setTimeout(() => setBotState('happy'), 2200);
  };

  const handleSteerSignal = (signal: 'lighter' | 'deeper' | 'pause' | 'spark', senderName: string) => {
    sounds.playTick();
    void runtime.sendEvent('host_steer_signal', { signal, senderName });

    const messages: Record<string, string> = {
      lighter: `🕊️ ${senderName} requested a lighter vibe. Cupidot is easing the pressure!`,
      deeper: `🌊 ${senderName} signaled for deeper depth. Diving into tender truths...`,
      pause: `☕ ${senderName} signaled a tea pause. Take your time, lovebirds!`,
      spark: `✨ ${senderName} sparked the host for an unexpected twist!`,
    };

    setSteeringToast(messages[signal]);
    setBotState(signal === 'pause' ? 'sleeping' : 'thinking');
    setTimeout(() => {
      setSteeringToast(null);
      setBotState('idle');
    }, 3800);
  };

  const handleReveal = async () => {
    if (isLivePair) {
      const myPick = runtime.isHost ? partnerAPick : partnerBPick;
      if (myPick === null) return;
      if (!privateChoices.isLocked) await privateChoices.lock(myPick);
      if (privateChoices.bothLocked || privateChoices.partnerLocked) {
        await privateChoices.reveal();
      }
      return;
    }
    if (partnerAPick === null || partnerBPick === null) return;
    completeReveal(partnerAPick, partnerBPick);
  };

  const handleNext = () => {
    if (currentIdx + 1 < scenarios.length) {
      void runtime.sendEvent('host_prompt_change', {
        promptIndex: currentIdx + 1,
      });
      setPartnerAPick(null);
      setPartnerBPick(null);
      setRevealed(false);
      setHostCommentary(null);
      setTotalRounds((r) => r + 1);
      setBotState('idle');
    } else {
      setActStage('closing');
      sounds.playCelebration();
    }
  };

  const calculateSyncPercent = () => {
    if (sessionHistory.length === 0) return 85;
    const matches = sessionHistory.filter((h) => h.agreement).length;
    return Math.round((matches / sessionHistory.length) * 100);
  };

  const handleSaveDateReceipt = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Date Night Receipt · ${selectedTone.toUpperCase()} Session`,
        activityPath: '/host',
        caption: `Third Wheel Date Host completed with ${totalRounds} dilemmas explored and ${calculateSyncPercent()}% synergy!`,
        metadata: {
          activityType: 'host',
          tone: selectedTone,
          rounds: totalRounds,
          syncPercent: calculateSyncPercent(),
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
      sounds.playCelebration();
    } catch {
      // Handled by writer
    }
  };

  const currentShellStage =
    actStage === 'checkin' ? 'ready' : actStage === 'dilemmas' ? 'play' : 'remember';

  return (
    <ActivityShell
      activityTitle="The Third Wheel Host"
      activitySubtitle="3-Act Guided Date Night · Dynamic Scenarios & Observational Commentary"
      currentStage={currentShellStage}
      keepsakeSummary={{
        kind: 'activity',
        title: `Date Receipt · ${selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)} Night`,
        subtitle: `${totalRounds} Dilemmas · ${calculateSyncPercent()}% Sync`,
        badge: '🧾 RECEIPT READY',
      }}
      guidancePhase={revealed ? 'revealed' : partnerAPick !== null || partnerBPick !== null ? 'locked' : 'ready'}
      guidancePrivacyNote="Both partners lock in their strategies privately. The Host delivers commentary only once both cards turn over."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0 40px' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto 18px' }}>
          <AiConsentToggle />
        </div>

        {/* Mascot Podium */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '190px', height: '190px', margin: '0 auto -12px' }}>
            <Cupidot2D state={botState} size={220} roam />
          </div>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 800,
              margin: '8px 0 6px',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            The <span className="grad">&ldquo;Third Wheel&rdquo;</span> Host
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '52ch', margin: '0 auto' }}>
            Cupidot observes your real choices, tracks your synergy, and delivers witty commentary while adapting every dilemma.
          </p>
        </div>

        {/* Floating Steering Toast */}
        {steeringToast && (
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto 18px',
              background: 'linear-gradient(135deg, #FFF9F5 0%, #FFFFFF 100%)',
              border: '1.5px solid #FF9E7D',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--ink)',
              boxShadow: '0 4px 16px rgba(255, 120, 80, 0.15)',
              textAlign: 'center',
              animation: 'gl-rise 0.25s ease',
            }}
          >
            {steeringToast}
          </div>
        )}

        {/* ACT I: CHECK-IN & TONE SELECTION */}
        {actStage === 'checkin' && (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
              animation: 'gl-rise 0.3s ease',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge hot" style={{ marginBottom: '10px' }}>
                ACT I · EVENING VIBE CHECK
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0' }}>
                What kind of energy do we want tonight?
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: 0 }}>
                Select a tone for your Host. Both of your devices will follow this tailored trajectory.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              {HOST_TONES.map((t) => {
                const isSelected = selectedTone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTone(t.id as 'playful' | 'romantic' | 'deep' | 'spicy')}
                    style={{
                      textAlign: 'left',
                      padding: '18px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid var(--pink)' : '1px solid var(--line)',
                      background: isSelected ? '#FFF5F8' : 'var(--paper)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 14px rgba(255, 77, 128, 0.12)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{t.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: isSelected ? 'var(--pink)' : 'var(--ink)' }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '4px', lineHeight: 1.4 }}>
                      {t.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleStartHostNight}
                className="btn btn-primary"
                style={{ padding: '14px 42px', fontSize: '15px' }}
              >
                Step to Host Podium &amp; Begin ▷
              </button>
            </div>
          </div>
        )}

        {/* ACT II: DILEMMAS & STEERING */}
        {actStage === 'dilemmas' && (
          <div>
            {/* Steering Signal Ribbon */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '18px',
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '12px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-soft)' }}>
                  STEER HOST:
                </span>
                <button
                  type="button"
                  onClick={() => handleSteerSignal('lighter', partnerA)}
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
                >
                  🕊️ Lighter
                </button>
                <button
                  type="button"
                  onClick={() => handleSteerSignal('deeper', partnerA)}
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
                >
                  🌊 Deeper
                </button>
                <button
                  type="button"
                  onClick={() => handleSteerSignal('pause', partnerA)}
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
                >
                  ☕ Pause
                </button>
                <button
                  type="button"
                  onClick={() => handleSteerSignal('spark', partnerA)}
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
                >
                  ✨ Spark
                </button>
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  background: 'var(--paper-raised)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                }}
              >
                Dilemma <b>#{totalRounds}</b> of {scenarios.length}
              </span>
            </div>

            {/* Scenario Card */}
            <div
              style={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '36px 32px',
                boxShadow: 'var(--shadow-lg)',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span className="badge hot">{scenario.category || 'Dilemma'}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  Double-Blind Lock-In
                </span>
              </div>

              <h2
                style={{
                  fontSize: '21px',
                  fontWeight: 800,
                  lineHeight: 1.45,
                  marginBottom: '24px',
                  color: 'var(--ink)',
                }}
              >
                {scenario.question}
              </h2>

              {/* Two-Player Lock-in Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '28px',
                }}
              >
                {/* Player A */}
                <div
                  style={{
                    background: '#FFF5F8',
                    border: '1.5px solid #FFD6E8',
                    borderRadius: '16px',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--pink)' }}>
                      🌸 {partnerA}&apos;s Choice
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: partnerAPick !== null ? '#0A7D4D' : 'var(--ink-soft)',
                        fontWeight: 700,
                      }}
                    >
                      {partnerAPick !== null ? '✓ Locked In' : 'Pick one...'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {scenario.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => !revealed && (!isLivePair || runtime.isHost) && setPartnerAPick(idx)}
                        disabled={revealed || (isLivePair && !runtime.isHost)}
                        style={{
                          textAlign: 'left',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border:
                            partnerAPick === idx ? '2px solid var(--pink)' : '1px solid #FFD6E8',
                          background: partnerAPick === idx ? '#FFF' : 'rgba(255,255,255,0.65)',
                          fontSize: '13.5px',
                          fontWeight: partnerAPick === idx ? 700 : 500,
                          cursor: revealed || (isLivePair && !runtime.isHost) ? 'default' : 'pointer',
                          lineHeight: 1.4,
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player B */}
                <div
                  style={{
                    background: '#F0F7FF',
                    border: '1.5px solid #D6E8FF',
                    borderRadius: '16px',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--blue)' }}>
                      💙 {partnerB}&apos;s Choice
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: partnerBPick !== null ? '#0A7D4D' : 'var(--ink-soft)',
                        fontWeight: 700,
                      }}
                    >
                      {partnerBPick !== null ? '✓ Locked In' : 'Pick one...'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {scenario.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => !revealed && (!isLivePair || !runtime.isHost) && setPartnerBPick(idx)}
                        disabled={revealed || (isLivePair && runtime.isHost)}
                        style={{
                          textAlign: 'left',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border:
                            partnerBPick === idx ? '2px solid var(--blue)' : '1px solid #D6E8FF',
                          background: partnerBPick === idx ? '#FFF' : 'rgba(255,255,255,0.65)',
                          fontSize: '13.5px',
                          fontWeight: partnerBPick === idx ? 700 : 500,
                          cursor: revealed || (isLivePair && runtime.isHost) ? 'default' : 'pointer',
                          lineHeight: 1.4,
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reveal / Next Controls */}
              <div style={{ textAlign: 'center' }}>
                {!revealed ? (
                  <button
                    onClick={handleReveal}
                    disabled={
                      isLivePair
                        ? (runtime.isHost ? partnerAPick : partnerBPick) === null || privateChoices.loading
                        : partnerAPick === null || partnerBPick === null
                    }
                    className="btn btn-primary"
                    style={{
                      padding: '12px 36px',
                      fontSize: '15px',
                      opacity: isLivePair
                        ? (runtime.isHost ? partnerAPick : partnerBPick) !== null ? 1 : 0.5
                        : partnerAPick !== null && partnerBPick !== null ? 1 : 0.5,
                    }}
                  >
                    {isLivePair
                      ? privateChoices.isLocked
                        ? privateChoices.partnerLocked
                          ? 'Reveal Both Strategies 🔍'
                          : 'Waiting for your partner…'
                        : 'Lock My Strategy 🔒'
                      : 'Reveal Both Strategies 🔍'}
                  </button>
                ) : (
                  <div style={{ animation: 'gl-rise 0.25s ease' }}>
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        background: partnerAPick === partnerBPick ? '#E6F9F0' : '#FFF0F5',
                        color: partnerAPick === partnerBPick ? '#0A7D4D' : 'var(--pink)',
                        fontWeight: 800,
                        fontSize: '15.5px',
                      }}
                    >
                      {partnerAPick === partnerBPick
                        ? '✨ Unanimous Frequency! You both picked the exact same adventure!'
                        : `⚡ Different angles! ${partnerA} picked "${scenario.options[partnerAPick!]}" while ${partnerB} chose "${scenario.options[partnerBPick!]}".`}
                    </div>

                    {(hostCommentary || scenario.commentary) && (
                      <div
                        style={{
                          padding: '14px 20px',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #FFF5F8 0%, #FFFFFF 100%)',
                          border: '1.5px solid rgba(255, 77, 128, 0.25)',
                          fontSize: '14px',
                          color: 'var(--ink)',
                          marginBottom: '22px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: '0 4px 16px rgba(255, 77, 128, 0.08)',
                          textAlign: 'left',
                          maxWidth: '580px',
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>ʚ🤖💘ɞ</span>
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              color: '#FF4D80',
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                            }}
                          >
                            HOST CUPIDOT&apos;S COMMENTARY
                          </div>
                          <span style={{ fontStyle: 'italic', fontWeight: 600 }}>
                            &ldquo;{hostCommentary || scenario.commentary}&rdquo;
                          </span>
                        </div>
                      </div>
                    )}
                    <br />

                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        onClick={handleNext}
                        className="btn btn-grad"
                        style={{ padding: '12px 28px', fontSize: '15px' }}
                      >
                        {currentIdx + 1 < scenarios.length ? 'Next Dilemma ▷' : 'Wrap Up Date & Print Receipt 🧾'}
                      </button>
                      <button
                        onClick={() => setActStage('closing')}
                        className="btn btn-ghost"
                        style={{ padding: '12px 20px', fontSize: '14px' }}
                      >
                        Conclude Evening Early
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACT III: CLOSING RITUAL & DATE RECEIPT */}
        {actStage === 'closing' && (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              animation: 'gl-rise 0.3s ease',
            }}
          >
            <span className="badge hot" style={{ marginBottom: '12px' }}>
              ACT III · CLOSING RITUAL
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '10px 0 8px' }}>
              Evening Wrap-Up &amp; Date Receipt
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '50ch', margin: '0 auto 28px' }}>
              You navigated {totalRounds} dilemmas tonight with a shared synergy score of {calculateSyncPercent()}%.
            </p>

            {/* Stats Overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                maxWidth: '600px',
                margin: '0 auto 32px',
              }}
            >
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                  TOTAL DILEMMAS
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>
                  {totalRounds}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                  SYNERGY RATE
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--pink)', marginTop: '4px' }}>
                  {calculateSyncPercent()}%
                </div>
              </div>
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                  CHOSEN VIBE
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '8px' }}>
                  {selectedTone.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '14px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => {
                  sounds.playPop();
                  setReceiptModalData({
                    roomCode: roomCode || 'PRIVATE',
                    date: new Date().toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                    partnerA,
                    partnerB,
                    items: scenarios.slice(0, currentIdx + 1).map((sc, i) => ({
                      number: `0${i + 1}`,
                      topic: sc.question.slice(0, 26),
                      answerA: sc.options[partnerAPick || 0] || 'Voted',
                      answerB: sc.options[partnerBPick || 0] || 'Voted',
                      syncPercent: partnerAPick === partnerBPick ? 100 : 60,
                    })),
                    overallSync: calculateSyncPercent(),
                    hostVerdict:
                      hostCommentary ||
                      `${partnerA} & ${partnerB} navigated the evening with playful devotion and memorable chemistry!`,
                  });
                }}
                className="btn btn-primary"
                style={{ padding: '13px 28px', fontSize: '14.5px' }}
              >
                Inspect &amp; Print Date Receipt 🧾
              </button>

              <button
                onClick={handleSaveDateReceipt}
                disabled={keepsakeSaved || keepsakeSaving}
                className="btn btn-grad"
                style={{ padding: '13px 28px', fontSize: '14.5px' }}
              >
                {keepsakeSaved ? '✓ Saved to Our Space Keepsakes' : keepsakeSaving ? 'Archiving...' : 'Save to Our Space 🏡'}
              </button>

              <Link
                href="/photobooth"
                className="btn btn-ghost"
                style={{ padding: '13px 24px', fontSize: '14px' }}
              >
                Snap Date Milestone 📸
              </Link>
            </div>
          </div>
        )}

        {/* Thermal Receipt Modal */}
        {receiptModalData && (
          <ThermalReceiptModal
            isOpen={Boolean(receiptModalData)}
            onClose={() => setReceiptModalData(null)}
            data={receiptModalData}
          />
        )}
      </div>
    </ActivityShell>
  );
}

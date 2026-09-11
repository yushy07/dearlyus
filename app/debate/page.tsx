'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BotState } from '@/components/bot/CupidotBot';
import { Cupidot2D } from '@/components/bot/Cupidot2D';
import { judgeDebate, DebateVerdict } from '@/lib/cupidot';
import { sounds } from '@/lib/sound';
import { Confetti, CoupleNameBar, ActivityShell } from '@/components/shared';
import { useCoupleProfile } from '@/lib/couple';
import { speakCupidot, stopCupidotSpeech } from '@/lib/voice';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { usePrivateAnswers } from '@/hooks/usePrivateAnswers';

interface DebateTopicItem {
  topic: string;
  category: string;
  pro: (nameA: string, nameB: string) => string;
  con: (nameA: string, nameB: string) => string;
}

const DEBATE_TOPICS: DebateTopicItem[] = [
  {
    topic: 'Is pineapple on pizza an acceptable culinary creation or romantic treason?',
    category: 'Culinary Philosophy',
    pro: (a) =>
      `${a} insists pineapple provides sweet acidity that balances savory cheese and rich tomato!`,
    con: (b) =>
      `${b} argues warm wet fruit on mozzarella is an affront to human civilization.`,
  },
  {
    topic: 'Who is the objectively superior navigator when wandering in a foreign city?',
    category: 'Spatial Sovereignty',
    pro: (a) =>
      `${a} has superior spatial intuition and spots hidden cafes without looking at blue dots.`,
    con: (b) =>
      `${b} actually knows what North means and doesn't lead us down dead-end alleys.`,
  },
  {
    topic: 'Are 6 decorative throw pillows on the bed necessary or excessive psychological warfare?',
    category: 'Bedroom Architecture',
    pro: (a) =>
      `${a} believes pillows create a plush aesthetic cloud sanctuary of comfort and luxury.`,
    con: (b) =>
      `${b} argues they spend 90% of their lifespan being thrown onto the floor before sleep.`,
  },
  {
    topic: 'Is letting your phone reach 2% battery living dangerously or pure laziness?',
    category: 'Digital Adrenaline',
    pro: (a) =>
      `${a} claims living on the edge builds character and electric romantic tension!`,
    con: (b) =>
      `${b} insists it causes unnecessary panic attacks when sending goodnight messages.`,
  },
];

export default function DebatePage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [topicIndex, setTopicIndex] = useState(0);
  const [timer, setTimer] = useState(60);
  const [activeSpeaker, setActiveSpeaker] = useState<string>(partnerA);
  const [debating, setDebating] = useState(false);
  const [argA, setArgA] = useState('');
  const [argB, setArgB] = useState('');
  const [verdict, setVerdict] = useState<DebateVerdict | null>(null);
  const [botState, setBotState] = useState<BotState>('idle');
  const [confettiActive, setConfettiActive] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-debate` : 'local-debate',
    activityType: 'debate',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { topicIndex },
  });
  const livePair = runtime.transportName !== 'mock';
  const privateArguments = usePrivateAnswers({ roundNumber: topicIndex, localRuntime: runtime });

  useEffect(() => {
    setActiveSpeaker(partnerA);
  }, [partnerA]);

  useEffect(() => {
    return () => {
      stopCupidotSpeech();
    };
  }, []);

  const current = DEBATE_TOPICS[topicIndex];

  const finishJudging = (finalA: string, finalB: string) => {
    setBotState('thinking');
    setTimeout(() => {
      const result = judgeDebate(current.topic, finalA, finalB, partnerA, partnerB);
      setVerdict(result);
      void runtime.sendEvent('debate_finish', { winner: result.winner, topicIndex });
      sounds.playCelebration();
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 2500);
      speakCupidot(`Debate Winner: ${result.winner}. ${result.analysis} Joint decree: ${result.penalty}`, {
        mood: 'sassy', onStart: () => setBotState('sassy'), onEnd: () => setBotState('celebration'),
      });
    }, 500);
  };

  useEffect(() => {
    const answers = privateArguments.revealedAnswers;
    if (!answers || answers.length < 2) return;
    const mine = String(answers.find((answer) => answer.userId === runtime.currentUserId)?.answer || '');
    const theirs = String(answers.find((answer) => answer.userId !== runtime.currentUserId)?.answer || '');
    const finalA = runtime.isHost ? mine : theirs;
    const finalB = runtime.isHost ? theirs : mine;
    setArgA(finalA);
    setArgB(finalB);
    finishJudging(finalA || current.pro(partnerA, partnerB), finalB || current.con(partnerA, partnerB));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateArguments.revealedAnswers]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (debating && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 4 && t > 1) sounds.playCountdownBeep(false);
          if (t === 1) {
            sounds.playCountdownBeep(true);
            setDebating(false);
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [debating, timer]);

  const startDebate = (speaker: string) => {
    sounds.playPop();
    setActiveSpeaker(speaker);
    setTimer(60);
    setDebating(true);
    setBotState('talking');
  };

  const handleJudge = async () => {
    sounds.playPop();
    if (livePair) {
      const ownArgument = runtime.isHost ? argA : argB;
      try {
        if (!privateArguments.isLocked) {
          const result = await privateArguments.lock(ownArgument);
          if (!result.bothLocked) return;
        }
        await privateArguments.reveal();
      } catch (error) {
        console.error('Failed to seal debate argument:', error);
      }
      return;
    }
    finishJudging(argA || current.pro(partnerA, partnerB), argB || current.con(partnerA, partnerB));
  };

  const nextTopic = () => {
    stopCupidotSpeech();
    sounds.playPop();
    setTopicIndex((prev) => (prev + 1) % DEBATE_TOPICS.length);
    setDebating(false);
    setTimer(60);
    setArgA('');
    setArgB('');
    setVerdict(null);
    setBotState('idle');
  };

  const handleSaveTreaty = async () => {
    if (!verdict || keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Debate Peace Accord · ${current.category}`,
        activityPath: '/debate',
        caption: `Winner declared: ${verdict.winner}. Joint peace decree: "${verdict.penalty}".`,
        metadata: {
          activityType: 'debate',
          topic: current.topic,
          winner: verdict.winner,
          penalty: verdict.penalty,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save debate keepsake:', err);
    }
  };

  return (
    <ActivityShell
      activityTitle="Friendly Couple Debate"
      activitySubtitle="Playful Philosophical Showdowns · Timed Podium Speeches & Cupidot Verdict"
      currentStage={verdict ? 'remember' : debating ? 'play' : 'ready'}
      keepsakeSummary={
        verdict
          ? {
              kind: 'activity',
              title: `Peace Accord · ${verdict.winner}`,
              subtitle: verdict.penalty.slice(0, 45) + '...',
              badge: '🕊️ ACCORD SIGNED',
            }
          : undefined
      }
      guidancePhase={verdict ? 'revealed' : debating ? 'locked' : 'ready'}
      guidancePrivacyNote="All debates are 100% affectionate play. Zero real arguments allowed."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '16px 0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '180px', height: '180px', margin: '0 auto -12px' }}>
            <Cupidot2D state={botState} size={220} roam />
          </div>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 800,
              margin: '8px 0',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            Friendly <span className="grad">Couple Debate</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '54ch', margin: '0 auto' }}>
            Step up to the podium, take 60 seconds to argue your passionate silly truth, and let Judge Cupidot rule.
          </p>
        </div>

        {/* Debate Arena Card */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge hot">{current.category}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
              Debate <b>#{topicIndex + 1}</b> of {DEBATE_TOPICS.length}
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '24px', lineHeight: 1.4 }}>
            &ldquo;{current.topic}&rdquo;
          </h2>

          {/* Dual Podium Speech Timer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '28px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => startDebate(partnerA)}
              style={{
                padding: '10px 20px',
                borderRadius: '999px',
                border: activeSpeaker === partnerA && debating ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: activeSpeaker === partnerA && debating ? '#FFF5F8' : '#FFF',
                fontWeight: 800,
                fontSize: '13.5px',
                color: 'var(--pink)',
                cursor: 'pointer',
              }}
            >
              🎤 {partnerA}&apos;s Podium (60s)
            </button>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '28px',
                fontWeight: 900,
                padding: '6px 20px',
                borderRadius: '12px',
                background: timer <= 10 && debating ? '#FEE2E2' : 'var(--paper)',
                color: timer <= 10 && debating ? '#DC2626' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              00:{timer < 10 ? `0${timer}` : timer}
            </div>

            <button
              onClick={() => startDebate(partnerB)}
              style={{
                padding: '10px 20px',
                borderRadius: '999px',
                border: activeSpeaker === partnerB && debating ? '2px solid var(--blue)' : '1px solid var(--line)',
                background: activeSpeaker === partnerB && debating ? '#F0F7FF' : '#FFF',
                fontWeight: 800,
                fontSize: '13.5px',
                color: 'var(--blue)',
                cursor: 'pointer',
              }}
            >
              🎤 {partnerB}&apos;s Podium (60s)
            </button>
          </div>

          {/* Testimonies Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '28px',
            }}
          >
            <div style={{ background: '#FFF5F8', padding: '18px', borderRadius: '14px', border: '1px solid #FFD6E8' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', marginBottom: '6px' }}>
                🌸 PRO STANCE ({partnerA})
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#17181C', lineHeight: 1.4 }}>
                {current.pro(partnerA, partnerB)}
              </p>
              <textarea
                rows={2}
                value={argA}
                onChange={(e) => setArgA(e.target.value)}
                disabled={livePair && !runtime.isHost}
                placeholder="Optional extra testimony..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ background: '#F0F7FF', padding: '18px', borderRadius: '14px', border: '1px solid #D6E8FF' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#3B82F6', marginBottom: '6px' }}>
                💙 CON STANCE ({partnerB})
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#17181C', lineHeight: 1.4 }}>
                {current.con(partnerA, partnerB)}
              </p>
              <textarea
                rows={2}
                value={argB}
                onChange={(e) => setArgB(e.target.value)}
                disabled={livePair && runtime.isHost}
                placeholder="Optional extra testimony..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="btn btn-grad"
              onClick={() => void handleJudge()}
              disabled={privateArguments.loading || (livePair && privateArguments.isLocked && !privateArguments.bothLocked)}
              style={{ padding: '12px 36px', fontSize: '15px' }}
            >
              {livePair ? (privateArguments.bothLocked ? 'Open Both Arguments for Verdict ⚖️' : privateArguments.isLocked ? 'Argument Sealed · Waiting…' : 'Seal My Argument') : `Call for Cupidot's Verdict ⚖️`}
            </button>
            <button
              className="btn btn-ghost"
              onClick={nextTopic}
              style={{ marginLeft: '12px', padding: '12px 20px', fontSize: '14px' }}
            >
              Next Topic ▷
            </button>
          </div>

          {/* Rendered Verdict */}
          {verdict && (
            <div
              style={{
                marginTop: '32px',
                padding: '24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FFF9F5 0%, #FFFFFF 100%)',
                border: '1.5px solid rgba(255, 120, 80, 0.25)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                animation: 'gl-rise 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="badge" style={{ background: '#17181C', color: '#FFF', fontWeight: 800, fontSize: '11px' }}>
                  DEBATE DECISION
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FF4D80' }}>
                  WINNER: {verdict.winner} 🏆
                </span>
              </div>

              <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--ink)', marginBottom: '16px' }}>
                {verdict.analysis}
              </p>

              <div style={{ background: '#FFF5F0', border: '1px dashed #FF9E7D', padding: '14px 18px', borderRadius: '12px', marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#E04A18' }}>
                  📜 MANDATORY COUPLE PEACE DECREE:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px', color: '#17181C' }}>
                  {verdict.penalty}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSaveTreaty}
                  disabled={keepsakeSaved || keepsakeSaving}
                  className="btn btn-grad"
                  style={{ padding: '10px 24px', fontSize: '13.5px' }}
                >
                  {keepsakeSaved ? '✓ Peace Accord Preserved' : keepsakeSaving ? 'Archiving...' : 'Sign & Save Peace Accord 📜'}
                </button>
                <button
                  onClick={() => {
                    sounds.playPop();
                    speakCupidot(
                      `Debate Winner: ${verdict.winner}. ${verdict.analysis} Joint decree: ${verdict.penalty}`,
                      { mood: 'sassy' }
                    );
                  }}
                  className="btn btn-ghost"
                  style={{ fontSize: '13px', padding: '10px 16px' }}
                >
                  🔊 Hear Verdict Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ActivityShell>
  );
}

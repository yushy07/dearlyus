'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CupidotBot, BotState } from '@/components/bot/CupidotBot';
import { judgeDebate, DebateVerdict } from '@/lib/cupidot';
import { sounds } from '@/lib/sound';
import { Confetti } from '@/components/shared/Confetti';

const DEBATE_TOPICS = [
  {
    topic: 'Is pineapple on pizza an acceptable culinary creation or romantic treason?',
    pro: 'Pineapple provides sweet acidity that balances savory cheese and tomato!',
    con: 'Warm wet fruit on mozzarella is an affront to human civilization.',
  },
  {
    topic: 'Who is the objectively superior navigator when wandering in a foreign city?',
    pro: 'Mia has superior spatial intuition and spots hidden cafes without looking at blue dots.',
    con: 'Alex actually knows what North means and doesn\'t lead us down dead-end alleys.',
  },
  {
    topic: 'Are 6 decorative throw pillows on the bed necessary or excessive psychological warfare?',
    pro: 'Pillows create a plush aesthetic cloud sanctuary of comfort and luxury.',
    con: 'They spend 90% of their lifespan being thrown onto the floor before sleep.',
  },
  {
    topic: 'Is letting your phone reach 2% battery living dangerously or pure laziness?',
    pro: 'Living on the edge builds character and electric tension!',
    con: 'It causes unnecessary panic attacks when trying to send goodnight messages.',
  },
];

export default function DebatePage() {
  const [topicIndex, setTopicIndex] = useState(0);
  const [timer, setTimer] = useState(60);
  const [activeSpeaker, setActiveSpeaker] = useState<'Mia' | 'Alex'>('Mia');
  const [debating, setDebating] = useState(false);
  const [argA, setArgA] = useState('');
  const [argB, setArgB] = useState('');
  const [verdict, setVerdict] = useState<DebateVerdict | null>(null);
  const [botState, setBotState] = useState<BotState>('idle');
  const [confettiActive, setConfettiActive] = useState(false);

  const current = DEBATE_TOPICS[topicIndex];

  useEffect(() => {
    let interval: any = null;
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
    return () => clearInterval(interval);
  }, [debating, timer]);

  const startDebate = (speaker: 'Mia' | 'Alex') => {
    sounds.playPop();
    setActiveSpeaker(speaker);
    setTimer(60);
    setDebating(true);
    setBotState('talking');
  };

  const handleJudge = () => {
    sounds.playPop();
    setBotState('thinking');

    setTimeout(() => {
      const finalA = argA || current.pro;
      const finalB = argB || current.con;
      const result = judgeDebate(current.topic, finalA, finalB);

      setVerdict(result);
      sounds.playCelebration();
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 2500);

      setBotState(result.winner === 'Dead Heat Draw' ? 'love' : 'celebration');
      setTimeout(() => setBotState('happy'), 2400);
    }, 500);
  };

  const nextTopic = () => {
    sounds.playPop();
    setTopicIndex((prev) => (prev + 1) % DEBATE_TOPICS.length);
    setDebating(false);
    setTimer(60);
    setArgA('');
    setArgB('');
    setVerdict(null);
    setBotState('idle');
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Confetti active={confettiActive} />

      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <Link className="btn btn-ghost" href="/activity">
            Activities ▷
          </Link>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '32px', maxWidth: '780px' }}>
        {/* Arbiter Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '180px', height: '180px', margin: '0 auto -10px' }}>
            <CupidotBot state={botState} scale={2.2} />
          </div>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>🎙️ ʚ🤖💘ɞ</span>
            <span>CUPIDOT · AI DEBATE ARBITER</span>
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, margin: '8px 0 10px' }}>
            Couple <span className="grad">Debate Arena</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '52ch', margin: '0 auto' }}>
            Argue your side, time your speech, and let Cupidot evaluate rhetorical genius, comedic flair, and crowning penalties!
          </p>
        </div>

        {/* Debate Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge hot">Debate #{topicIndex + 1}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
              60s Timed Podium
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '28px', lineHeight: 1.35 }}>
            &ldquo;{current.topic}&rdquo;
          </h2>

          {/* Argument Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {/* Mia (PRO) */}
            <div
              style={{
                background: activeSpeaker === 'Mia' && debating ? '#FFF0F5' : '#FFF9FA',
                border: activeSpeaker === 'Mia' && debating ? '2px solid #FF4D80' : '1px solid rgba(255, 77, 128, 0.25)',
                padding: '20px',
                borderRadius: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '16px', color: '#FF4D80' }}>🌸 Mia (PRO)</span>
                <button
                  onClick={() => startDebate('Mia')}
                  className="btn"
                  style={{ padding: '4px 10px', fontSize: '12px', background: '#FF4D80', color: '#FFF' }}
                >
                  {debating && activeSpeaker === 'Mia' ? `Speaking: ${timer}s` : 'Take Mic 🎙️'}
                </button>
              </div>
              <textarea
                rows={3}
                value={argA}
                onChange={(e) => setArgA(e.target.value)}
                placeholder={`Default: "${current.pro}"`}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13.5px' }}
              />
            </div>

            {/* Alex (CON) */}
            <div
              style={{
                background: activeSpeaker === 'Alex' && debating ? '#F0F6FF' : '#F8FAFC',
                border: activeSpeaker === 'Alex' && debating ? '2px solid #3B82F6' : '1px solid rgba(80, 140, 255, 0.25)',
                padding: '20px',
                borderRadius: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '16px', color: '#3B82F6' }}>💙 Alex (CON)</span>
                <button
                  onClick={() => startDebate('Alex')}
                  className="btn"
                  style={{ padding: '4px 10px', fontSize: '12px', background: '#3B82F6', color: '#FFF' }}
                >
                  {debating && activeSpeaker === 'Alex' ? `Speaking: ${timer}s` : 'Take Mic 🎙️'}
                </button>
              </div>
              <textarea
                rows={3}
                value={argB}
                onChange={(e) => setArgB(e.target.value)}
                placeholder={`Default: "${current.con}"`}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13.5px' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-grad" onClick={handleJudge} style={{ padding: '12px 32px', fontSize: '15px' }}>
              Cupidot, Crown the Winner ⚖️
            </button>
            <button className="btn btn-ghost" onClick={nextTopic}>
              New Debate Topic ▷
            </button>
          </div>

          {/* Verdict Scorecard */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span className="badge" style={{ background: '#17181C', color: '#FFF', fontWeight: 800 }}>
                  ARBITER SCORECARD
                </span>
                <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800 }}>
                  <span style={{ color: '#FF4D80' }}>Mia: {verdict.scoreA}/100</span>
                  <span>·</span>
                  <span style={{ color: '#3B82F6' }}>Alex: {verdict.scoreB}/100</span>
                </div>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', color: '#17181C' }}>
                🏆 Winner: {verdict.winner === 'Dead Heat Draw' ? 'Tie! Both Won Our Hearts' : `${verdict.winner} Takes the Crown!`}
              </h3>

              <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--ink)', marginBottom: '16px' }}>
                {verdict.analysis}
              </p>

              <div
                style={{
                  background: '#FFF5F0',
                  border: '1px dashed #FF9E7D',
                  padding: '14px 18px',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#E04A18', textTransform: 'uppercase', marginBottom: '4px' }}>
                  🌶️ LOSER PENALTY DECREE:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#17181C', lineHeight: 1.4 }}>
                  {verdict.penalty}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

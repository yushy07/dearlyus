'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ribbon, Navbar, Confetti } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { downloadReceiptPNG, DateReceiptData } from '@/lib/receipt-canvas';
import { ThermalReceiptModal } from '@/components/shared/ThermalReceiptModal';
import { CupidotBot, BotState } from '@/components/bot/CupidotBot';

interface HostScenario {
  id: number;
  question: string;
  options: string[];
  commentary?: string;
}

const INITIAL_SCENARIOS: HostScenario[] = [
  {
    id: 1,
    question: "Scenario: We just landed in a dream city for our 2-week reunion trip, but our luggage was delayed by 24 hours. What is our game plan for day one?",
    options: [
      "Check into the hotel, order room service & sleep off jetlag",
      "Buy cheap thrift outfits and start exploring immediately",
      "Go to a 24-hour convenience store and feast on snacks",
      "Hunt down the best local ramen / street food stall on foot",
    ],
    commentary: "Observing your couple spontaneous travel instincts!",
  },
  {
    id: 2,
    question: "Scenario: We enter a couple karaoke tournament at 2 AM in Tokyo. Which duet are we singing to guarantee first place?",
    options: [
      "A dramatic 90s ballad with full arm gestures",
      "An energetic K-Pop song with synchronized hand choreography",
      "A classic Disney duet we secretly both know all the words to",
      "An upbeat rock anthem where we scream the chorus together",
    ],
    commentary: "Assessing karaoke stage chemistry and song repertoire!",
  },
];

export default function DateHostPage() {
  const [scenarios, setScenarios] = useState<HostScenario[]>(INITIAL_SCENARIOS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [partnerAPick, setPartnerAPick] = useState<number | null>(null);
  const [partnerBPick, setPartnerBPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hostCommentary, setHostCommentary] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [receiptModalData, setReceiptModalData] = useState<DateReceiptData | null>(null);
  const [botState, setBotState] = useState<BotState>('idle');

  const scenario = scenarios[currentIdx] || scenarios[0];

  const handleReveal = () => {
    if (partnerAPick === null || partnerBPick === null) return;
    setRevealed(true);

    if (partnerAPick === partnerBPick) {
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

    // Background pre-fetch next tailored dilemma based on both choices
    fetch('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerA: { name: 'Mia', answer: scenario.options[partnerAPick] },
        partnerB: { name: 'Alex', answer: scenario.options[partnerBPick] },
        mode: 'host',
        mood: 'playful',
        history: [{ question: scenario.question, answerA: scenario.options[partnerAPick], answerB: scenario.options[partnerBPick] }],
      }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.question && Array.isArray(data.options)) {
          const nextScenario: HostScenario = {
            id: Date.now(),
            question: data.question,
            options: data.options,
            commentary: data.commentary || 'Observing your couple dynamics!',
          };
          const nextList = [...scenarios];
          nextList.splice(currentIdx + 1, 0, nextScenario);
          setScenarios(nextList);
          if (data.commentary) {
            setHostCommentary(data.commentary);
          }
        }
      })
      .catch(() => {});
  };

  const handleNext = () => {
    if (currentIdx + 1 < scenarios.length) {
      setCurrentIdx(currentIdx + 1);
      setPartnerAPick(null);
      setPartnerBPick(null);
      setRevealed(false);
      setHostCommentary(null);
      setTotalRounds((r) => r + 1);
      setBotState('idle');
    }
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      <Ribbon text={<>🎙️ Third Wheel Date Host · <b>Dynamic Scenarios &amp; Observational Commentary</b></>} />
      <Confetti active={confettiActive} />

      <Navbar
        rightAction={
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
            Scenario <b>#{totalRounds}</b>
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '880px' }}>
        {/* 3D Cupidot Mascot Host */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '190px', height: '190px', margin: '0 auto -12px' }}>
            <CupidotBot state={botState} scale={2.2} />
          </div>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>ʚ🤖💘ɞ</span>
            <span>CUPIDOT · 3D DATE HOST</span>
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, margin: '8px 0 10px' }}>
            The <span className="grad">&ldquo;Third Wheel&rdquo;</span> Host
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '52ch', margin: '0 auto' }}>
            Cupidot observes your real choices, tracks your synergy, and delivers witty commentary while adapting every dilemma.
          </p>
        </div>

        {/* Scenario Card */}
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
            <span className="badge hot">Scenario #{totalRounds}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
              Double-Blind Lock-In
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.4, marginBottom: '24px' }}>
            {scenario.question}
          </h2>

          {/* Two-Player Lock-in Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {/* Player A (Mia) */}
            <div
              style={{
                background: '#FFF5F8',
                border: '1.5px solid #FFD6E8',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--pink)' }}>🌸 Mia&apos;s Strategy</span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: partnerAPick !== null ? '#0A7D4D' : 'var(--ink-soft)', fontWeight: 700 }}>
                  {partnerAPick !== null ? '✓ Locked In' : 'Pick one...'}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {scenario.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => !revealed && setPartnerAPick(idx)}
                    disabled={revealed}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: partnerAPick === idx ? '2px solid var(--pink)' : '1px solid #FFD6E8',
                      background: partnerAPick === idx ? '#FFF' : 'rgba(255,255,255,0.6)',
                      fontSize: '13.5px',
                      fontWeight: partnerAPick === idx ? 700 : 500,
                      cursor: revealed ? 'default' : 'pointer',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Player B (Alex) */}
            <div
              style={{
                background: '#F0F7FF',
                border: '1.5px solid #D6E8FF',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--blue)' }}>💙 Alex&apos;s Strategy</span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: partnerBPick !== null ? '#0A7D4D' : 'var(--ink-soft)', fontWeight: 700 }}>
                  {partnerBPick !== null ? '✓ Locked In' : 'Pick one...'}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {scenario.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => !revealed && setPartnerBPick(idx)}
                    disabled={revealed}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: partnerBPick === idx ? '2px solid var(--blue)' : '1px solid #D6E8FF',
                      background: partnerBPick === idx ? '#FFF' : 'rgba(255,255,255,0.6)',
                      fontSize: '13.5px',
                      fontWeight: partnerBPick === idx ? 700 : 500,
                      cursor: revealed ? 'default' : 'pointer',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reveal / Next Actions */}
          <div style={{ textAlign: 'center' }}>
            {!revealed ? (
              <button
                onClick={handleReveal}
                disabled={partnerAPick === null || partnerBPick === null}
                className="btn btn-primary"
                style={{ padding: '12px 36px', fontSize: '15px', opacity: partnerAPick !== null && partnerBPick !== null ? 1 : 0.5 }}
              >
                Reveal Both Strategies 🔍
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
                    fontSize: '16px',
                  }}
                >
                  {partnerAPick === partnerBPick
                    ? '✨ Unanimous Plan! You both chose the exact same adventure!'
                    : `⚡ Different approaches! Mia voted for "${scenario.options[partnerAPick!]}" while Alex chose "${scenario.options[partnerBPick!]}".`}
                </div>

                {hostCommentary && (
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
                      gap: '10px',
                      boxShadow: '0 4px 16px rgba(255, 77, 128, 0.08)',
                      textAlign: 'left',
                      maxWidth: '560px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>ʚ🤖💘ɞ</span>
                    <div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', textTransform: 'uppercase', marginBottom: '2px' }}>
                        CUPIDOT&apos;S OBSERVATION
                      </div>
                      <span style={{ fontStyle: 'italic', fontWeight: 600 }}>&ldquo;{hostCommentary}&rdquo;</span>
                    </div>
                  </div>
                )}
                <br />

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={handleNext} className="btn btn-grad" style={{ padding: '12px 28px', fontSize: '15px' }}>
                    Next Adaptive Dilemma ▷
                  </button>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setReceiptModalData({
                        roomCode: 'KX7RM',
                        date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
                        partnerA: 'Mia',
                        partnerB: 'Alex',
                        items: scenarios.slice(0, currentIdx + 1).map((sc, i) => ({
                          number: `0${i + 1}`,
                          topic: sc.question.slice(0, 26),
                          answerA: sc.options[partnerAPick || 0],
                          answerB: sc.options[partnerBPick || 0],
                          syncPercent: partnerAPick === partnerBPick ? 100 : 60,
                        })),
                        overallSync: partnerAPick === partnerBPick ? 95 : 75,
                        hostVerdict: hostCommentary || 'Observing spontaneous couple travel instincts!',
                      });
                    }}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px' }}
                  >
                    Print Date Receipt 🧾
                  </button>
                  <Link href="/photobooth" className="btn btn-ghost" style={{ padding: '12px 20px', fontSize: '14px' }}>
                    Snap Milestone 📸
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thermal Receipt Date Lore Modal with Paper Tear Audio */}
        {receiptModalData && (
          <ThermalReceiptModal
            isOpen={Boolean(receiptModalData)}
            onClose={() => setReceiptModalData(null)}
            data={receiptModalData}
          />
        )}
      </main>
    </div>
  );
}

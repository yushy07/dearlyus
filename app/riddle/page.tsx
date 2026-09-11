'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { Confetti, CoupleNameBar, ActivityShell } from '@/components/shared';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

interface RiddleItem {
  id: number;
  question: string;
  hint: string;
  answer: string;
  explanation: string;
  category: string;
}

const RIDDLES: RiddleItem[] = [
  {
    id: 1,
    category: 'Long Distance Geographies',
    question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
    hint: 'Couples across time zones stare at me often to trace the flight paths between them.',
    answer: 'A map',
    explanation: 'A map depicts geography, borders, and oceans without physical people or structures!',
  },
  {
    id: 2,
    category: 'Paper Postal Relics',
    question: 'What can travel around the world while staying in a corner?',
    hint: 'It goes on romantic snail mail postcards and wax-sealed envelopes.',
    answer: 'A postage stamp',
    explanation: 'A postage stamp stays tucked in the top corner of an envelope as it crosses oceans!',
  },
  {
    id: 3,
    category: 'Word Play',
    question: 'What comes once in a minute, twice in a moment, but never in a thousand years?',
    hint: 'Look closely at the individual letters in the words themselves.',
    answer: 'The letter M',
    explanation: 'The letter M appears 1 time in "minute", 2 times in "moment", 0 in "thousand years"!',
  },
  {
    id: 4,
    category: 'Temporal Paradox',
    question: 'I fly without wings, I cry without eyes. Whenever I go, darkness flies. What am I?',
    hint: 'A weather cloud passing over during an afternoon storm.',
    answer: 'A cloud',
    explanation: 'Clouds float on winds and rain down tears from the sky.',
  },
  {
    id: 5,
    category: 'Heart Logic',
    question: 'The more you share me with someone, the larger I grow. What am I?',
    hint: 'It is the very reason Dearly Us exists.',
    answer: 'Love',
    explanation: 'Love and affection multiply the more you express and give them away.',
  },
];

export default function RiddlePage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-riddle` : 'local-riddle',
    activityType: 'riddle',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { riddleIndex: currentIdx },
  });

  const riddle = RIDDLES[currentIdx];

  useEffect(() => {
    if (runtime.transportName === 'mock') return;
    const snapshot = runtime.snapshot as { caseId?: string; hintLevel?: number; solved?: boolean };
    const index = RIDDLES.findIndex((item) => `riddle-${item.id}` === snapshot.caseId);
    if (index >= 0) setCurrentIdx(index);
    if (Number(snapshot.hintLevel || 0) > 0) setShowHint(true);
    if (snapshot.solved) {
      setSolved(true);
      setErrorMsg('');
    }
  }, [runtime.snapshot, runtime.transportName]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (solved) return;

    const cleanUser = userAnswer
      .trim()
      .toLowerCase()
      .replace(/^(a|an|the)\s+/, '');
    const cleanAns = riddle.answer.toLowerCase().replace(/^(a|an|the)\s+/, '');

    const isCorrect =
      cleanUser.length > 0 &&
      (cleanAns.includes(cleanUser) ||
        cleanUser.includes(cleanAns) ||
        (cleanAns.includes('stamp') && cleanUser.includes('stamp')) ||
        (cleanAns.includes('letter m') && (cleanUser === 'm' || cleanUser.includes('m'))) ||
        (cleanAns.includes('cloud') && cleanUser.includes('cloud')) ||
        (cleanAns.includes('love') && cleanUser.includes('love')));

    if (isCorrect) {
      void runtime.sendEvent('riddle_answer_submit', { answer: cleanUser, correct: true, riddleId: riddle.id });
      setSolved(true);
      setErrorMsg('');
      setScore((p) => p + 1);
      sounds.playCelebration();
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 3000);
    } else {
      void runtime.sendEvent('riddle_answer_submit', { answer: cleanUser, correct: false, riddleId: riddle.id });
      setErrorMsg('Not quite! Unlock the gentle hint below and give it another thought 💭');
      setShowHint(true);
      sounds.playCountdownBeep(true);
    }
  };

  const handleNext = () => {
    if (runtime.transportName !== 'mock' && !runtime.isHost) return;
    sounds.playPop();
    const nextIndex = (currentIdx + 1) % RIDDLES.length;
    setCurrentIdx(nextIndex);
    void runtime.sendEvent('riddle_case_select', { caseId: `riddle-${RIDDLES[nextIndex].id}` });
    setShowHint(false);
    setUserAnswer('');
    setErrorMsg('');
    setSolved(false);
  };

  const handleSaveToKeepsakes = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Riddle Master Scroll · ${score}/${RIDDLES.length} Solved`,
        activityPath: '/riddle',
        caption: `Solved by ${partnerA} & ${partnerB} with clever telepathy.`,
        metadata: {
          activityType: 'riddle',
          score,
          totalRiddles: RIDDLES.length,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save riddle keepsake:', err);
    }
  };

  return (
    <ActivityShell
      activityTitle="Riddle Quest"
      activitySubtitle="Clever Couple Brainteasers · Romantic Word Puzzles & Hint Vault"
      currentStage={solved ? 'remember' : 'play'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Riddle Quest · ${score}/${RIDDLES.length} Solved`,
        subtitle: `Current: "${riddle.question.slice(0, 30)}..."`,
        badge: '📜 SCROLL LOGGED',
      }}
      guidancePhase={solved ? 'completed' : 'ready'}
      guidancePrivacyNote="Work together or trade guesses. Riddles solved sync mutual accomplishments in your couple space."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '16px 0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 800,
              margin: '8px 0',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            Two minds, <span className="grad">one solution</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '52ch', margin: '0 auto' }}>
            Decode whimsical romantic and lateral-thinking riddles together.
          </p>
        </div>

        {/* Riddle Card */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '36px 30px',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="badge hot">{riddle.category}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
              Riddle <b>#{currentIdx + 1}</b> of {RIDDLES.length} · Score: <b>{score}</b>
            </span>
          </div>

          <div style={{ fontSize: '38px', marginBottom: '10px' }}>📜</div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              maxWidth: '560px',
              margin: '0 auto 24px',
              lineHeight: 1.45,
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            &ldquo;{riddle.question}&rdquo;
          </h2>

          {!solved ? (
            <form onSubmit={handleCheck} style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your guess here..."
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--line)',
                    fontSize: '14px',
                  }}
                />
                <button type="submit" className="btn btn-grad" style={{ padding: '12px 22px', fontSize: '14px' }}>
                  Solve 🗝️
                </button>
              </div>

              {errorMsg && (
                <div style={{ color: '#DC2626', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                {!showHint ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHint(true);
                      void runtime.sendEvent('riddle_hint_request', { hintLevel: 1, riddleId: riddle.id });
                    }}
                    className="btn btn-ghost"
                    style={{ fontSize: '12px' }}
                  >
                    💡 Need a gentle hint?
                  </button>
                ) : (
                  <div
                    style={{
                      background: '#FFFBEB',
                      border: '1px dashed #F59E0B',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: '#B45309',
                    }}
                  >
                    <b>Gentle Hint:</b> {riddle.hint}
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div style={{ animation: 'gl-rise 0.25s ease', margin: '20px 0' }}>
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1.5px solid #10B981',
                  borderRadius: '14px',
                  padding: '18px 24px',
                  maxWidth: '520px',
                  margin: '0 auto 20px',
                  color: '#065F46',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
                  🎉 Brilliant! Answer: &ldquo;{riddle.answer}&rdquo;
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5 }}>
                  {riddle.explanation}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleNext} className="btn btn-grad" style={{ padding: '10px 24px', fontSize: '14px' }}>
                  Next Riddle ▷
                </button>
                <button
                  onClick={handleSaveToKeepsakes}
                  disabled={keepsakeSaved || keepsakeSaving}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  {keepsakeSaved ? '✓ Saved to Keepsakes!' : keepsakeSaving ? 'Archiving...' : 'Save Quest Progress 💾'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ActivityShell>
  );
}

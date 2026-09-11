'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { Confetti, CoupleNameBar, ActivityShell } from '@/components/shared';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { usePrivateAnswers } from '@/hooks/usePrivateAnswers';

interface IQQuestion {
  title: string;
  category: string;
  pattern: string[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

const IQ_PUZZLES: IQQuestion[] = [
  {
    title: 'Pattern Progression: Which geometric symbol completes the sequence?',
    category: 'Spatial Logic',
    pattern: ['🟢 🔷', '🔷 🔺', '🔺 🟨', '🟨 ❓'],
    options: ['⭐', '🟢', '🔷', '🔺'],
    correctIndex: 1,
    explanation: 'The cycle rotates through Circle → Diamond → Triangle → Square → Circle.',
  },
  {
    title: 'Logical Deduction: What statement must be unequivocally true?',
    category: 'Formal Deduction',
    pattern: [
      '🌹 Premise 1: All Roses are Flowers',
      '🥀 Premise 2: Some Flowers fade quickly in winter',
      '❓ Deduction: Which conclusion follows?',
    ],
    options: [
      'All roses fade quickly',
      'No roses fade quickly',
      'Some roses may fade quickly',
      'Winter causes all flowers to perish',
    ],
    correctIndex: 2,
    explanation: 'Since some flowers fade quickly and roses are flowers, some roses may belong to that subset.',
  },
  {
    title: 'Number Matrix: What is the missing number in the doubling leap?',
    category: 'Numerical Pattern',
    pattern: ['2 → 4 (+2)', '4 → 8 (x2)', '8 → 16 (x2)', '16 → 32 (x2)', '32 → [ ? ] (x2)'],
    options: ['48', '64', '56', '72'],
    correctIndex: 1,
    explanation: 'Each step continuously doubles the preceding value (32 x 2 = 64).',
  },
  {
    title: 'Anagram Puzzle: Unscramble the letters to form a couple sanctuary.',
    category: 'Verbal Telepathy',
    pattern: ['Letters: [ E - M - O - H - T - E - E - W - S ]', 'Hint: A quiet place just for the two of us.'],
    options: ['SWEET HOME', 'THE MEADOW', 'SHOW ME THE', 'SOMEWHERE'],
    correctIndex: 0,
    explanation: 'The letters spell out SWEET HOME perfectly.',
  },
  {
    title: 'Synergy Instinct: What is the golden rule of couple dispute resolution?',
    category: 'Emotional Synergy',
    pattern: [
      'Scenario: Disagreement at 11 PM about weekend plans.',
      'Goal: Maximum intimacy and zero lingering resentment.',
    ],
    options: [
      'Fight until 4 AM to prove absolute factual correctness',
      'Us vs. The Problem (Hold hands and find the third way)',
      'Pretend it never happened and eat in cold silence',
      'Flip a coin and hold a grudge for 3 weeks',
    ],
    correctIndex: 1,
    explanation: 'High emotional IQ couples reframe disputes as "Us vs. The Problem", never partner vs. partner.',
  },
];

export default function IQPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [qIndex, setQIndex] = useState(0);
  const [pickA, setPickA] = useState<number | null>(null);
  const [pickB, setPickB] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [finished, setFinished] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-iq` : 'local-iq',
    activityType: 'iq',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { totalQuestions: IQ_PUZZLES.length },
  });
  const livePair = runtime.transportName !== 'mock';
  const privateAnswers = usePrivateAnswers({ roundNumber: qIndex, localRuntime: runtime });
  const myPick = runtime.isHost ? pickA : pickB;

  useEffect(() => {
    if (!privateAnswers.revealedAnswers) return;
    const mine = Number(privateAnswers.revealedAnswers.find((a) => a.userId === runtime.currentUserId)?.answer);
    const theirs = Number(privateAnswers.revealedAnswers.find((a) => a.userId !== runtime.currentUserId)?.answer);
    if (runtime.isHost) {
      setPickA(mine);
      setPickB(theirs);
    } else {
      setPickB(mine);
      setPickA(theirs);
    }
    revealRound(mine, theirs, runtime.isHost);
  // revealRound is intentionally driven only by a new sealed-answer result.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateAnswers.revealedAnswers]);

  const puzzle = IQ_PUZZLES[qIndex];

  const revealRound = (first: number, second: number, mineIsA = true) => {
    const answerA = mineIsA ? first : second;
    const answerB = mineIsA ? second : first;
    setRevealed(true);

    const isCorrectA = answerA === puzzle.correctIndex;
    const isCorrectB = answerB === puzzle.correctIndex;

    if (isCorrectA) setScoreA((s) => s + 1);
    if (isCorrectB) setScoreB((s) => s + 1);

    if (isCorrectA && isCorrectB) {
      sounds.playCelebration();
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 2500);
    } else {
      sounds.playCountdownBeep(true);
    }
  };

  const handleReveal = async () => {
    if (livePair) {
      if (myPick === null) return;
      try {
        if (!privateAnswers.isLocked) {
          const result = await privateAnswers.lock(myPick);
          if (!result.bothLocked) return;
        }
        await privateAnswers.reveal();
      } catch (error) {
        console.error('Failed to seal IQ answer:', error);
      }
      return;
    }
    if (pickA === null || pickB === null) return;
    revealRound(pickA, pickB);
  };

  const handleNext = () => {
    sounds.playPop();
    if (qIndex + 1 < IQ_PUZZLES.length) {
      setQIndex((prev) => prev + 1);
      setPickA(null);
      setPickB(null);
      setRevealed(false);
    } else {
      setFinished(true);
      sounds.playCelebration();
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 3500);
    }
  };

  const handleSaveCertificate = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      const jointScore = scoreA + scoreB;
      const synergyRating = jointScore >= 8 ? 'Genius Chemistry 🧠✨' : 'Playful Telepathy 💫';
      await saveKeepsake({
        kind: 'activity',
        title: `Couple IQ Certificate · ${synergyRating}`,
        activityPath: '/iq',
        caption: `Completed 5 logic and synergy puzzles with ${jointScore}/10 combined score.`,
        metadata: {
          activityType: 'iq',
          scoreA,
          scoreB,
          jointScore,
          synergyRating,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save IQ keepsake:', err);
    }
  };

  return (
    <ActivityShell
      activityTitle="Couple IQ & Synergy Test"
      activitySubtitle="Head-to-Head Logic Puzzles · Double-Blind Submission & Synergy Scoring"
      currentStage={finished ? 'remember' : 'play'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Synergy Test · Q${qIndex + 1}/${IQ_PUZZLES.length}`,
        subtitle: `${partnerA}: ${scoreA} · ${partnerB}: ${scoreB}`,
        badge: '🧠 IQ LOGGED',
      }}
      guidancePhase={finished ? 'completed' : revealed ? 'revealed' : pickA !== null || pickB !== null ? 'locked' : 'ready'}
      guidancePrivacyNote="Both partners select their deduction privately. Answers and explanations reveal simultaneously."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0 40px' }}>
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
            Couple IQ &amp; <span className="grad">Synergy Test</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '52ch', margin: '0 auto' }}>
            Test your collective logic, spatial deduction, and emotional telepathy through 5 brainteasers.
          </p>
        </div>

        {!finished ? (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header / Category */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span className="badge hot">{puzzle.category}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                Puzzle <b>{qIndex + 1}</b> of {IQ_PUZZLES.length}
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', lineHeight: 1.4 }}>
              {puzzle.title}
            </h2>

            {/* Pattern / Question Canvas */}
            <div
              style={{
                background: 'var(--paper)',
                border: '1px dashed var(--line)',
                borderRadius: '14px',
                padding: '18px 22px',
                marginBottom: '28px',
              }}
            >
              {puzzle.pattern.map((pat, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '15px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    margin: '4px 0',
                    color: '#17181C',
                  }}
                >
                  {pat}
                </div>
              ))}
            </div>

            {/* Two-Player Choice Lock-in Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '28px',
              }}
            >
              {/* Partner A */}
              <div
                style={{
                  background: '#FFF5F8',
                  border: '1.5px solid #FFD6E8',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--pink)' }}>
                    🌸 {livePair ? (runtime.isHost ? partnerA : partnerB) : partnerA}&apos;s Deduction
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: pickA !== null ? '#0A7D4D' : 'var(--ink-soft)' }}>
                    {pickA !== null ? '✓ Locked In' : 'Select one...'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {puzzle.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => !revealed && (livePair && !runtime.isHost ? setPickB(idx) : setPickA(idx))}
                      disabled={revealed}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: myPick === idx ? '2px solid var(--pink)' : '1px solid #FFD6E8',
                        background: myPick === idx ? '#FFF' : 'rgba(255,255,255,0.65)',
                        fontSize: '13px',
                        fontWeight: myPick === idx ? 700 : 500,
                        cursor: revealed ? 'default' : 'pointer',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner B */}
              {!livePair && <div
                style={{
                  background: '#F0F7FF',
                  border: '1.5px solid #D6E8FF',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--blue)' }}>
                    💙 {partnerB}&apos;s Deduction
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: pickB !== null ? '#0A7D4D' : 'var(--ink-soft)' }}>
                    {pickB !== null ? '✓ Locked In' : 'Select one...'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {puzzle.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => !revealed && setPickB(idx)}
                      disabled={revealed}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: pickB === idx ? '2px solid var(--blue)' : '1px solid #D6E8FF',
                        background: pickB === idx ? '#FFF' : 'rgba(255,255,255,0.65)',
                        fontSize: '13px',
                        fontWeight: pickB === idx ? 700 : 500,
                        cursor: revealed ? 'default' : 'pointer',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>}
            </div>

            {/* Action Bar */}
            <div style={{ textAlign: 'center' }}>
              {!revealed ? (
                <button
                  onClick={() => void handleReveal()}
                  disabled={livePair ? myPick === null || privateAnswers.loading || (privateAnswers.isLocked && !privateAnswers.bothLocked) : pickA === null || pickB === null}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 36px',
                    fontSize: '15px',
                    opacity: (livePair ? myPick !== null : pickA !== null && pickB !== null) ? 1 : 0.5,
                  }}
                >
                  {livePair ? (privateAnswers.bothLocked ? 'Reveal Both Deductions 🔍' : privateAnswers.isLocked ? 'Waiting for Partner…' : 'Seal My Deduction') : 'Reveal Deductions & Check Solution 🔍'}
                </button>
              ) : (
                <div style={{ animation: 'gl-rise 0.25s ease' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: pickA === puzzle.correctIndex && pickB === puzzle.correctIndex ? '#E6F9F0' : '#FFF0F5',
                      color: pickA === puzzle.correctIndex && pickB === puzzle.correctIndex ? '#0A7D4D' : '#BE123C',
                      fontWeight: 800,
                      fontSize: '15px',
                      marginBottom: '16px',
                    }}
                  >
                    Correct Answer: &ldquo;{puzzle.options[puzzle.correctIndex]}&rdquo; · {puzzle.explanation}
                  </div>

                  <button
                    onClick={handleNext}
                    className="btn btn-grad"
                    style={{ padding: '12px 32px', fontSize: '15px' }}
                  >
                    {qIndex + 1 < IQ_PUZZLES.length ? 'Next Brainteaser ▷' : 'View Final Synergy Certificate 🏆'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FINAL CERTIFICATE */
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '2px solid var(--line)',
              borderRadius: '24px',
              padding: '44px 32px',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              animation: 'gl-rise 0.3s ease',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🏆✨🧠</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0', fontFamily: 'var(--font-serif, Georgia, serif)' }}>
              Couple IQ &amp; Synergy Certificate
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '48ch', margin: '0 auto 28px' }}>
              Certified synergy score for {partnerA} &amp; {partnerB}.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                maxWidth: '520px',
                margin: '0 auto 32px',
              }}
            >
              <div style={{ background: '#FFF5F8', padding: '18px', borderRadius: '14px', border: '1px solid #FFD6E8' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--pink)' }}>🌸 {partnerA}</div>
                <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '4px' }}>{scoreA} / 5</div>
              </div>
              <div style={{ background: '#F0F7FF', padding: '18px', borderRadius: '14px', border: '1px solid #D6E8FF' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--blue)' }}>💙 {partnerB}</div>
                <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '4px' }}>{scoreB} / 5</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleSaveCertificate}
                disabled={keepsakeSaved || keepsakeSaving}
                className="btn btn-grad"
                style={{ padding: '12px 28px', fontSize: '14.5px' }}
              >
                {keepsakeSaved ? '✓ Saved Certificate to Keepsakes' : keepsakeSaving ? 'Archiving...' : 'Save Certificate to Our Space 📜'}
              </button>
              <Link href="/arcade" className="btn btn-ghost" style={{ padding: '12px 22px', fontSize: '14px' }}>
                Return to Arcade 🕹️
              </Link>
            </div>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}

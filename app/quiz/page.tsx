'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QUIZ_PACKS } from '@/data';
import { QuizPack, QuizQuestion } from '@/types';
import {
  Ribbon,
  Navbar,
  Confetti,
  CoupleNameBar,
  AiConsentToggle,
  SecretAnswerSeal,
  CupidotActivityGuidance,
} from '@/components/shared';
import { sounds } from '@/lib/sound';
import { downloadReceiptPNG, DateReceiptData } from '@/lib/receipt-canvas';
import { ThermalReceiptModal } from '@/components/shared/ThermalReceiptModal';
import { useCoupleProfile } from '@/lib/couple';
import { useAiConsent } from '@/lib/ai-consent';
import { generateAdaptiveQuestion } from '@/lib/gemini';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { usePrivateAnswers } from '@/hooks/usePrivateAnswers';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { quizActivityAdapter } from '@/lib/activity-adapters/quiz';

export default function QuizPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { user } = useSupabaseSession();
  const { hasAiConsent } = useAiConsent();
  const {
    session,
    sessionId,
    sendEvent,
    registerEventHandler,
    completeActivity,
  } = useActivitySession();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();
  const localRuntime = useActivityRuntime({
    sessionId: sessionId || `mock-quiz-${roomCode || 'local'}`,
    activityType: 'quiz',
    userId: user?.id,
    roomId: roomCode || 'local',
    transportMode: 'mock',
    enabled: !sessionId,
    initialOptions: {
      packId: QUIZ_PACKS[0].id,
      packTitle: QUIZ_PACKS[0].name,
      totalRounds: QUIZ_PACKS[0].questions.length,
      questions: QUIZ_PACKS[0].questions,
    },
  });
  const activitySendEvent = sessionId ? sendEvent : localRuntime.sendEvent;

  const [allPacks, setAllPacks] = useState<QuizPack[]>(QUIZ_PACKS);
  const [selectedPack, setSelectedPack] = useState<QuizPack>(QUIZ_PACKS[0]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [myDraftChoice, setMyDraftChoice] = useState<number | null>(null);

  const [matches, setMatches] = useState<number>(0);
  const [finished, setFinished] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [receiptModalData, setReceiptModalData] =
    useState<DateReceiptData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<
    Array<{ question: string; answerA: string; answerB: string }>
  >([]);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  // Custom Lore Quiz Creator Modal State
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState('Our Japan Trip Secrets ⛩️');
  const [newPackDesc, setNewPackDesc] = useState(
    'Inside jokes, missed trains, and favorite meals from our vacation.',
  );
  const [customQuestions, setCustomQuestions] = useState<QuizQuestion[]>([
    {
      q: 'What was the funniest thing that happened on our first night?',
      options: [
        'We got completely lost in Shinjuku 🚶',
        'We ordered 40 dumplings by accident 🥟',
        'The hotel room was the size of a closet 🚪',
        'We slept for 16 straight hours 😴',
      ],
      honestAnswerIndex: 1,
    },
    {
      q: 'Which snack did we buy at 7-Eleven every single day?',
      options: [
        'Egg salad sandwich 🥪',
        'Matcha ice cream cone 🍦',
        'Pork katsu onigiri 🍙',
        'Hot can of milk tea 🧋',
      ],
      honestAnswerIndex: 0,
    },
  ]);

  const [adaptiveQueue, setAdaptiveQueue] = useState<QuizQuestion[]>([]);
  const [hostCommentary, setHostCommentary] = useState<string | null>(null);

  // Load custom packs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dearly_custom_quiz_packs');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAllPacks([...QUIZ_PACKS, ...parsed]);
      }
    } catch {}
  }, []);

  const currentQ =
    selectedPack.questions[currentQIndex] || selectedPack.questions[0];

  // Section 7: Secret Until Together hook for the active round
  const {
    isLocked,
    partnerLocked,
    bothLocked,
    revealed,
    revealedAnswers,
    isSkipped,
    lock,
    reveal,
    skip,
    setPartnerLocked,
    setBothLocked,
  } = usePrivateAnswers({
    roundNumber: currentQIndex,
    onBothLocked: () => {
      sounds.playChime();
    },
    onReveal: (answers) => {
      // Check if answers match
      if (answers.length >= 2) {
        const ans0 = answers[0].answer;
        const ans1 = answers[1].answer;
        if (ans0 !== undefined && ans0 === ans1) {
          setMatches((prev) => prev + 1);
          sounds.playCelebration();
        } else {
          sounds.playCountdownBeep(true);
        }
      }

      // Record history
      const qText = currentQ.q
        .replace(/\{partnerA\}/g, partnerA)
        .replace(/\{partnerB\}/g, partnerB);
      const textA =
        currentQ.options[Number(answers[0]?.answer ?? myDraftChoice)] ||
        String(answers[0]?.answer ?? '');
      const textB =
        currentQ.options[Number(answers[1]?.answer)] ||
        String(answers[1]?.answer ?? '');

      setSessionHistory((prev) => [
        ...prev,
        { question: qText, answerA: textA, answerB: textB },
      ]);

      // AI adaptive question generation if consented
      if (hasAiConsent && myDraftChoice !== null) {
        void generateAdaptiveQuestion({
          sessionId: sessionId || undefined,
          partnerA: { name: partnerA, answer: textA },
          partnerB: { name: partnerB, answer: textB },
          mode: 'quiz',
          aiConsent: true,
          history: [
            ...sessionHistory,
            { question: qText, answerA: textA, answerB: textB },
          ],
        })
          .then((data: any) => {
            if (data?.question && Array.isArray(data.options)) {
              setAdaptiveQueue([
                {
                  q: data.question,
                  options: data.options,
                  honestAnswerIndex: 0,
                },
              ]);
              if (data.commentary) {
                setHostCommentary(data.commentary);
              }
            }
          })
          .catch(() => {});
      }
    },
    onSkip: () => {
      sounds.playPop();
    },
    localRuntime: sessionId
      ? null
      : {
          currentUserId: localRuntime.currentUserId,
          privateVault: localRuntime.privateVault,
          sendEvent: localRuntime.sendEvent,
          lastEvent: localRuntime.lastEvent,
        },
  });

  // Reset local draft choice on new question
  useEffect(() => {
    setMyDraftChoice(null);
  }, [currentQIndex]);

  // Realtime synchronization for next question and quiz events
  useEffect(() => {
    const unregister = registerEventHandler((event) => {
      if (event.type === 'quiz_next') {
        const payload = (event.payload as Record<string, unknown>) || {};
        const nextIdx = Number(payload.nextRound ?? currentQIndex + 1);
        advanceToQuestion(nextIdx, false);
      }
    });
    return () => {
      unregister();
    };
  }, [registerEventHandler, currentQIndex]);

  const advanceToQuestion = useCallback(
    (nextIdx: number, broadcast = true) => {
      if (broadcast) {
        void activitySendEvent('quiz_next', { nextRound: nextIdx });
      }

      if (adaptiveQueue.length > 0) {
        const nextAdaptive = adaptiveQueue[0];
        setAdaptiveQueue((prev) => prev.slice(1));
        const updatedQuestions = [...selectedPack.questions];
        updatedQuestions.splice(nextIdx, 0, nextAdaptive);
        setSelectedPack((prev) => ({ ...prev, questions: updatedQuestions }));
        setCurrentQIndex(nextIdx);
        setHostCommentary(null);
      } else if (nextIdx < selectedPack.questions.length) {
        setCurrentQIndex(nextIdx);
        setHostCommentary(null);
      } else {
        setFinished(true);
        sounds.playCelebration();
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 4000);

        // Complete session
        void completeActivity({
          packId: selectedPack.id,
          packName: selectedPack.name,
          matches,
          total: selectedPack.questions.length,
          history: sessionHistory,
        });
      }
    },
    [
      adaptiveQueue,
      selectedPack,
      currentQIndex,
      matches,
      sessionHistory,
      activitySendEvent,
      completeActivity,
    ],
  );

  const handleNext = () => {
    advanceToQuestion(currentQIndex + 1, true);
  };

  const handleSaveKeepsake = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    try {
      const draft = quizActivityAdapter.buildKeepsake?.({
        activityType: 'quiz',
        completed: true,
        summary: {
          packTitle: selectedPack.name,
          matches,
          totalRounds: selectedPack.questions.length,
          history: sessionHistory.map((h, i) => ({
            roundIndex: i,
            question: { q: h.question, options: [] },
            answers: [],
            isMatch: h.answerA === h.answerB,
          })),
        },
      });

      if (draft) {
        await saveKeepsake({
          kind: 'activity',
          title: draft.title,
          activityPath: '/quiz',
          caption: `${matches} matches on ${selectedPack.name}`,
          metadata: draft.metadata,
        });
        setKeepsakeSaved(true);
        sounds.playCelebration();
      }
    } catch (err) {
      console.error('Failed to save keepsake:', err);
    }
  };

  const restartQuiz = (pack: QuizPack) => {
    setSelectedPack(pack);
    setCurrentQIndex(0);
    setMyDraftChoice(null);
    setMatches(0);
    setFinished(false);
    setAdaptiveQueue([]);
    setHostCommentary(null);
    setSessionHistory([]);
    setKeepsakeSaved(false);
    void activitySendEvent('quiz_start', {
      packId: pack.id,
      packTitle: pack.name,
      totalRounds: pack.questions.length,
    });
  };

  // Single-device simulation helper for local testing
  const simulatePartnerLock = () => {
    setPartnerLocked(true);
    if (isLocked) setBothLocked(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Ribbon />
      <Navbar />
      <CoupleNameBar />
      <Confetti active={confettiActive} />

      <main
        style={{
          flex: 1,
          maxWidth: '860px',
          margin: '0 auto',
          width: '100%',
          padding: '32px 16px 80px',
        }}
      >
        {/* Navigation Breadcrumb */}
        <div
          style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/arcade"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--ink-soft)',
              fontSize: '13.5px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ‹ Back to Date Arcade
          </Link>

          <button
            onClick={() => setCreatorOpen(true)}
            className="btn btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              borderRadius: '8px',
            }}
          >
            ✨ Create Custom Lore Pack
          </button>
        </div>

        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <span className="badge hot">Room-Aware Realtime</span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: sessionId
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
                border: sessionId ? '1px solid #10B981' : '1px solid #F59E0B',
                fontSize: '11px',
                fontWeight: 700,
                color: sessionId ? '#065F46' : '#92400E',
              }}
            >
              <span>
                {sessionId
                  ? '● SERVER-SEALED SESSION'
                  : '○ LOCAL / SOLO SESSION'}
              </span>
            </div>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 4.5vw, 40px)',
              fontWeight: 800,
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}
          >
            Lock in privately, <span className="grad">reveal together</span>.
          </h1>
          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: '15px',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            {partnerA} and {partnerB} seal hidden choices server-side. Neither
            answer is revealed until both are locked in.
          </p>
        </div>

        {/* Pack Selector Chips */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '28px',
          }}
        >
          {allPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => restartQuiz(pack)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border:
                  selectedPack.id === pack.id
                    ? '2px solid var(--pink)'
                    : '1px solid var(--line)',
                background:
                  selectedPack.id === pack.id ? '#FFF' : 'var(--paper-raised)',
                color: 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow:
                  selectedPack.id === pack.id
                    ? '0 4px 12px rgba(225,29,72,0.15)'
                    : 'none',
              }}
            >
              {pack.name}{' '}
              {pack.badge && (
                <span className="badge hot" style={{ marginLeft: '4px' }}>
                  {pack.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {!finished ? (
          <div>
            {/* Progress & Stats Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '0 4px',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--ink-soft)',
                }}
              >
                Question {currentQIndex + 1} of {selectedPack.questions.length}
              </span>
              <span
                style={{ fontSize: '13px', fontWeight: 800, color: '#BE123C' }}
              >
                Matches: {matches} 💖
              </span>
            </div>

            {/* Cupidot Standard Activity Lifecycle Guidance */}
            <CupidotActivityGuidance
              activityName="Couple Lore Quiz"
              phase={
                revealed
                  ? 'revealed'
                  : bothLocked
                    ? 'locked'
                    : isLocked
                      ? 'locked'
                      : 'private'
              }
              partnerName={partnerB || 'Partner'}
              privacyNote={
                !revealed
                  ? 'Your draft choice is completely private and hidden until both of you lock in.'
                  : undefined
              }
            />

            {/* Question Text */}
            <h2
              style={{
                fontSize: 'clamp(20px, 3.2vw, 24px)',
                fontWeight: 800,
                marginBottom: '24px',
                textAlign: 'center',
                color: '#1F2937',
              }}
            >
              {currentQ.q
                .replace(/\{partnerA\}/g, partnerA)
                .replace(/\{partnerB\}/g, partnerB)}
            </h2>

            {/* Section 7: SecretAnswerSeal Component */}
            <SecretAnswerSeal
              roundNumber={currentQIndex + 1}
              isLocked={isLocked}
              partnerLocked={partnerLocked}
              bothLocked={bothLocked}
              revealed={revealed}
              isSkipped={isSkipped}
              myDraftAnswer={
                myDraftChoice !== null ? currentQ.options[myDraftChoice] : null
              }
              revealedAnswers={revealedAnswers}
              partnerName={partnerB || 'Partner'}
              myName={partnerA || 'You'}
              currentUserId={user?.id}
              canLock={myDraftChoice !== null}
              formatAnswer={(ans) => {
                if (typeof ans === 'number' && currentQ.options[ans]) {
                  return currentQ.options[ans];
                }
                return String(ans ?? '');
              }}
              onLock={async () => {
                if (myDraftChoice !== null) {
                  await lock(myDraftChoice);
                }
              }}
              onReveal={async () => {
                await reveal();
              }}
              onSkip={async () => {
                await skip();
              }}
              onReaction={(emoji) => {
                void activitySendEvent('reaction_sent', {
                  emoji,
                  roundNumber: currentQIndex,
                });
              }}
            >
              {/* Child: Drafting Choice List */}
              <div style={{ display: 'grid', gap: '10px' }}>
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMyDraftChoice(idx);
                      sounds.playPop();
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      border:
                        myDraftChoice === idx
                          ? '2px solid #E11D48'
                          : '1px solid rgba(244,114,182,0.3)',
                      background:
                        myDraftChoice === idx
                          ? '#FFF5F8'
                          : 'rgba(255, 255, 255, 0.7)',
                      color: '#1F2937',
                      fontSize: '14px',
                      fontWeight: myDraftChoice === idx ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow:
                        myDraftChoice === idx
                          ? '0 4px 12px rgba(225,29,72,0.12)'
                          : 'none',
                    }}
                  >
                    <span
                      style={{
                        marginRight: '10px',
                        color: myDraftChoice === idx ? '#BE123C' : '#9CA3AF',
                      }}
                    >
                      {myDraftChoice === idx ? '●' : '○'}
                    </span>
                    {opt
                      .replace(/\{partnerA\}/g, partnerA)
                      .replace(/\{partnerB\}/g, partnerB)}
                  </button>
                ))}
              </div>
            </SecretAnswerSeal>

            {/* Next Question Navigation Bar */}
            {(revealed || isSkipped) && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '24px',
                  animation: 'unfoldIn 0.3s ease',
                }}
              >
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 36px',
                    fontSize: '15px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #BE123C, #E11D48)',
                  }}
                >
                  {currentQIndex + 1 < selectedPack.questions.length
                    ? 'Next Question →'
                    : 'See Our Couple Score ✨'}
                </button>
              </div>
            )}

            {/* Local play simulation helper */}
            {!sessionId && !partnerLocked && isLocked && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={simulatePartnerLock}
                  style={{
                    background: 'transparent',
                    border: '1px dashed #F59E0B',
                    color: '#B45309',
                    borderRadius: '999px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  [Solo Testing: Simulate {partnerB} Locking Answer]
                </button>
              </div>
            )}

            {hostCommentary && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: '#FFF9E6',
                  border: '1px solid #FFE58F',
                  color: '#7D5A00',
                  fontSize: '13px',
                }}
              >
                ✨ <strong>AI Host:</strong> {hostCommentary}
              </div>
            )}
          </div>
        ) : (
          /* Finished Screen */
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '24px',
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ fontSize: '54px', marginBottom: '12px' }}>🏆</div>
            <h2
              style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}
            >
              Quiz Finished!
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: 'var(--ink-soft)',
                marginBottom: '24px',
              }}
            >
              You two achieved{' '}
              <strong>
                {matches} out of {selectedPack.questions.length}
              </strong>{' '}
              telepathic matches!
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '24px',
              }}
            >
              <button
                type="button"
                onClick={handleSaveKeepsake}
                disabled={keepsakeSaved || keepsakeSaving}
                className="btn btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '14px',
                  borderRadius: '999px',
                }}
              >
                {keepsakeSaved
                  ? '✨ Saved to Keepsakes Shelf!'
                  : keepsakeSaving
                    ? 'Saving...'
                    : '💾 Save to Our Keepsakes'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setReceiptModalData({
                    roomCode: roomCode || 'LOVE',
                    date: new Date().toLocaleDateString(),
                    partnerA,
                    partnerB,
                    items: sessionHistory.map((h, idx) => ({
                      number: `#${String(idx + 1).padStart(2, '0')}`,
                      topic: h.question.slice(0, 24),
                      answerA: h.answerA,
                      answerB: h.answerB,
                      syncPercent: h.answerA === h.answerB ? 100 : 0,
                    })),
                    overallSync: Math.round(
                      (matches / Math.max(1, selectedPack.questions.length)) *
                        100,
                    ),
                    hostVerdict:
                      matches >= selectedPack.questions.length / 2
                        ? 'Telepathic Soul Resonance 💖'
                        : 'Distinct and Beautiful Minds 🌿',
                  });
                }}
                className="btn btn-outline"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  borderRadius: '999px',
                }}
              >
                🖨️ Thermal Receipt
              </button>

              <button
                type="button"
                onClick={() => restartQuiz(selectedPack)}
                className="btn btn-outline"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  borderRadius: '999px',
                }}
              >
                🔄 Play Again
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <AiConsentToggle />
        </div>
      </main>

      {/* Custom Pack Builder Modal */}
      {creatorOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--paper-raised)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                marginBottom: '12px',
              }}
            >
              Create Lore Pack
            </h3>
            <input
              type="text"
              value={newPackTitle}
              onChange={(e) => setNewPackTitle(e.target.value)}
              placeholder="Pack Title"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                marginBottom: '12px',
              }}
            />
            <textarea
              value={newPackDesc}
              onChange={(e) => setNewPackDesc(e.target.value)}
              placeholder="Pack Description"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                marginBottom: '16px',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setCreatorOpen(false)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const newPack: QuizPack = {
                    id: `custom-${Date.now()}`,
                    name: newPackTitle,
                    badge: 'Custom',
                    description: newPackDesc,
                    questions: customQuestions,
                  };
                  const updated = [...allPacks, newPack];
                  setAllPacks(updated);
                  localStorage.setItem(
                    'dearly_custom_quiz_packs',
                    JSON.stringify(
                      updated.filter((p) => p.id.startsWith('custom-')),
                    ),
                  );
                  setCreatorOpen(false);
                  restartQuiz(newPack);
                }}
                className="btn btn-primary"
              >
                Save &amp; Play
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptModalData && (
        <ThermalReceiptModal
          isOpen={Boolean(receiptModalData)}
          data={receiptModalData}
          onClose={() => setReceiptModalData(null)}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QUIZ_PACKS } from '@/data';
import { QuizPack, QuizQuestion } from '@/types';
import { Ribbon, Navbar, Confetti } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { downloadReceiptPNG } from '@/lib/receipt-canvas';

export default function QuizPage() {
  const [allPacks, setAllPacks] = useState<QuizPack[]>(QUIZ_PACKS);
  const [selectedPack, setSelectedPack] = useState<QuizPack>(QUIZ_PACKS[0]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [miaPick, setMiaPick] = useState<number | null>(null);
  const [alexPick, setAlexPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [matches, setMatches] = useState<number>(0);
  const [finished, setFinished] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Custom Lore Quiz Creator Modal State
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState('Our Japan Trip Secrets ⛩️');
  const [newPackDesc, setNewPackDesc] = useState('Inside jokes, missed trains, and favorite meals from our vacation.');
  const [customQuestions, setCustomQuestions] = useState<QuizQuestion[]>([
    {
      q: 'What was the funniest thing that happened on our first night?',
      options: ['We got completely lost in Shinjuku 🚶', 'We ordered 40 dumplings by accident 🥟', 'The hotel room was the size of a closet 🚪', 'We slept for 16 straight hours 😴'],
      honestAnswerIndex: 1,
    },
    {
      q: 'Which snack did we buy at 7-Eleven every single day?',
      options: ['Egg salad sandwich 🥪', 'Matcha ice cream cone 🍦', 'Pork katsu onigiri 🍙', 'Hot can of milk tea 🧋'],
      honestAnswerIndex: 0,
    },
  ]);

  // Load any saved custom packs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('angie_custom_quiz_packs');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAllPacks([...QUIZ_PACKS, ...parsed]);
      }
    } catch {}
  }, []);

  const currentQ = selectedPack.questions[currentQIndex];

  const [adaptiveQueue, setAdaptiveQueue] = useState<QuizQuestion[]>([]);
  const [hostCommentary, setHostCommentary] = useState<string | null>(null);

  const handleNext = () => {
    if (adaptiveQueue.length > 0) {
      const nextAdaptive = adaptiveQueue[0];
      setAdaptiveQueue(adaptiveQueue.slice(1));
      const updatedQuestions = [...selectedPack.questions];
      updatedQuestions.splice(currentQIndex + 1, 0, nextAdaptive);
      setSelectedPack({ ...selectedPack, questions: updatedQuestions });
      setCurrentQIndex(currentQIndex + 1);
      setMiaPick(null);
      setAlexPick(null);
      setRevealed(false);
      setHostCommentary(null);
    } else if (currentQIndex + 1 < selectedPack.questions.length) {
      setCurrentQIndex(currentQIndex + 1);
      setMiaPick(null);
      setAlexPick(null);
      setRevealed(false);
      setHostCommentary(null);
    } else {
      setFinished(true);
      sounds.playCelebration();
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 4000);
    }
  };

  const handleReveal = () => {
    if (miaPick === null || alexPick === null) return;
    setRevealed(true);
    if (miaPick === alexPick) {
      setMatches((prev) => prev + 1);
      sounds.playCelebration();
    } else {
      sounds.playCountdownBeep(true);
    }

    // Parallel background pre-fetch for next adaptive question
    const currentQ = selectedPack.questions[currentQIndex];
    fetch('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerA: { name: 'Mia', answer: currentQ.options[miaPick] },
        partnerB: { name: 'Alex', answer: currentQ.options[alexPick] },
        mode: 'quiz',
        history: [{ question: currentQ.q, answerA: currentQ.options[miaPick], answerB: currentQ.options[alexPick] }],
      }),
    })
      .then((res) => res.json())
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
  };

  const restartQuiz = (pack: QuizPack) => {
    setSelectedPack(pack);
    setCurrentQIndex(0);
    setMiaPick(null);
    setAlexPick(null);
    setRevealed(false);
    setMatches(0);
    setFinished(false);
    setAdaptiveQueue([]);
    setHostCommentary(null);
  };

  // Add question to custom builder
  const addQuestionDraft = () => {
    setCustomQuestions([
      ...customQuestions,
      {
        q: 'New Question: What was our favorite memory from this trip?',
        options: ['Walking by the river at dusk 🌅', 'Singing karaoke until 3am 🎤', 'The cozy coffee shop we found ☕', 'Just talking in the hotel room 💌'],
        honestAnswerIndex: 0,
      },
    ]);
  };

  // Save custom quiz pack
  const saveCustomPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackTitle.trim() || customQuestions.length === 0) return;

    const newPack: QuizPack = {
      id: `custom-${Date.now()}`,
      name: newPackTitle,
      badge: '★ Custom Lore',
      description: newPackDesc,
      questions: customQuestions,
    };

    const updated = [...allPacks, newPack];
    setAllPacks(updated);
    setSelectedPack(newPack);
    restartQuiz(newPack);
    setCreatorOpen(false);

    try {
      const existingCustom = JSON.parse(localStorage.getItem('angie_custom_quiz_packs') || '[]');
      localStorage.setItem('angie_custom_quiz_packs', JSON.stringify([...existingCustom, newPack]));
    } catch {}
  };

  const matchPercent = Math.round((matches / selectedPack.questions.length) * 100);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      <Ribbon text={<>❓ Know Me Quiz · <b>How Well Do You Know Each Other?</b> · Double-Blind Reveal</>} />
      <Confetti active={confettiActive} />

      <Navbar
        rightAction={
          <button onClick={() => setCreatorOpen(true)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
            + Create &ldquo;Our Lore&rdquo; Quiz
          </button>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '860px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Know Me Quiz · Private Double-Blind Lock-in</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', marginBottom: '10px' }}>
            Lock in privately, <span className="grad">reveal together</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Partner A answers honestly, Partner B guesses what they chose. Answers stay secret until both lock in!
          </p>
        </div>

        {/* Pack Selector Chips */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
          {allPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => restartQuiz(pack)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedPack.id === pack.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: selectedPack.id === pack.id ? '#FFF' : 'var(--paper-raised)',
                color: 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: selectedPack.id === pack.id ? 'var(--shadow)' : 'none',
              }}
            >
              {pack.name} {pack.badge && <span className="badge hot" style={{ marginLeft: '4px' }}>{pack.badge}</span>}
            </button>
          ))}
        </div>

        {!finished ? (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header / Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge" style={{ background: '#F4F5F7', color: 'var(--ink-soft)', fontWeight: 800 }}>
                Question {currentQIndex + 1} of {selectedPack.questions.length}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--pink)', fontWeight: 800 }}>
                Matches: {matches} 💖
              </span>
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
              {currentQ.q}
            </h2>

            {/* Double-Blind Dual Player Pick Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {/* Partner A (Mia) */}
              <div style={{ background: '#FFF5F8', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,123,163,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--pink)' }}>🌸 Partner A (Mia)</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                    {miaPick !== null ? '🔒 Locked in' : 'Thinking...'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {currentQ.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => !revealed && setMiaPick(idx)}
                      disabled={revealed}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: miaPick === idx ? '2px solid var(--pink)' : '1px solid #FFD6E8',
                        background: miaPick === idx ? '#FFF' : 'rgba(255,255,255,0.6)',
                        color: 'var(--ink)',
                        fontSize: '13.5px',
                        fontWeight: miaPick === idx ? 700 : 500,
                        cursor: revealed ? 'default' : 'pointer',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner B (Alex) */}
              <div style={{ background: '#F0F7FF', padding: '20px', borderRadius: '16px', border: '1px solid rgba(95,160,255,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--blue)' }}>💙 Partner B (Alex)</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                    {alexPick !== null ? '🔒 Locked in' : 'Thinking...'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {currentQ.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => !revealed && setAlexPick(idx)}
                      disabled={revealed}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: alexPick === idx ? '2px solid var(--blue)' : '1px solid #D6E8FF',
                        background: alexPick === idx ? '#FFF' : 'rgba(255,255,255,0.6)',
                        color: 'var(--ink)',
                        fontSize: '13.5px',
                        fontWeight: alexPick === idx ? 700 : 500,
                        cursor: revealed ? 'default' : 'pointer',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ textAlign: 'center', paddingTop: '12px' }}>
              {!revealed ? (
                <button
                  onClick={handleReveal}
                  disabled={miaPick === null || alexPick === null}
                  className="btn btn-primary"
                  style={{ padding: '12px 36px', fontSize: '15px', opacity: miaPick !== null && alexPick !== null ? 1 : 0.5 }}
                >
                  Flip &amp; Reveal Answers 🔍
                </button>
              ) : (
                <div style={{ animation: 'gl-rise 0.25s ease' }}>
                  <div
                    style={{
                      padding: '14px 20px',
                      borderRadius: '12px',
                      marginBottom: '16px',
                      background: miaPick === alexPick ? '#E6F9F0' : '#FFF0F0',
                      color: miaPick === alexPick ? '#0A7D4D' : '#D93838',
                      fontWeight: 800,
                      fontSize: '16px',
                    }}
                  >
                    {miaPick === alexPick
                      ? '✨ PERFECT MATCH! You both picked the exact same thing!'
                      : `💔 Clashing picks! Mia chose "${currentQ.options[miaPick!]}" while Alex guessed "${currentQ.options[alexPick!]}".`}
                  </div>
                  {hostCommentary && (
                    <div
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        fontSize: '13px',
                        fontStyle: 'italic',
                        color: 'var(--ink-soft)',
                        marginBottom: '16px',
                        display: 'inline-block',
                      }}
                    >
                      💬 &ldquo;{hostCommentary}&rdquo;
                    </div>
                  )}
                  <br />
                  <button onClick={handleNext} className="btn btn-grad" style={{ padding: '12px 36px', fontSize: '15px' }}>
                    {currentQIndex + 1 < selectedPack.questions.length ? 'Next Question ▷' : 'View Final Results 🏆'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Final Match Scorecard */
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '48px 36px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span style={{ fontSize: '54px', display: 'block', marginBottom: '12px' }}>
              {matchPercent >= 80 ? '💖' : matchPercent >= 50 ? '🥰' : '😜'}
            </span>
            <span className="eyebrow">{selectedPack.name} Complete</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, margin: '8px 0 16px' }}>
              Compatibility Score: <span className="grad">{matchPercent}%</span>
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '48ch', margin: '0 auto 28px' }}>
              You matched on <b>{matches}</b> out of <b>{selectedPack.questions.length}</b> questions!
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  downloadReceiptPNG({
                    roomCode: 'KX7RM',
                    date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
                    partnerA: 'Mia',
                    partnerB: 'Alex',
                    items: selectedPack.questions.map((q, i) => ({
                      number: `0${i + 1}`,
                      topic: q.q,
                      answerA: q.options[0],
                      answerB: q.options[1] || q.options[0],
                      syncPercent: i < matches ? 100 : 50,
                    })),
                    overallSync: matchPercent,
                    hostVerdict: matchPercent >= 80 ? 'Exceptional soulmate-level alignment!' : 'Playful chemistry with great inside jokes.',
                  });
                  sounds.playCelebration();
                }}
                className="btn btn-primary"
                style={{ padding: '12px 28px' }}
              >
                Print Date Lore Receipt 🧾
              </button>
              <button onClick={() => restartQuiz(selectedPack)} className="btn btn-ghost" style={{ padding: '12px 24px' }}>
                Play Again 🔄
              </button>
              <button onClick={() => setCreatorOpen(true)} className="btn btn-ghost" style={{ padding: '12px 24px' }}>
                + Build Lore Pack
              </button>
              <Link href="/photobooth" className="btn btn-grad" style={{ padding: '12px 24px' }}>
                Celebrate in Photobooth 📸
              </Link>
            </div>
          </div>
        )}

        {/* Custom Lore Quiz Creator Modal */}
        {creatorOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(23,24,28,0.5)',
              backdropFilter: 'blur(6px)',
              display: 'grid',
              placeItems: 'center',
              padding: '20px',
            }}
            onClick={() => setCreatorOpen(false)}
          >
            <div
              style={{
                width: 'min(640px, 100%)',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#fff',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--line)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span className="badge hot">Private Question Builder</span>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>Create &ldquo;Our Lore&rdquo; Quiz</h3>
                </div>
                <button
                  onClick={() => setCreatorOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveCustomPack} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Quiz Pack Title:
                  </label>
                  <input
                    type="text"
                    value={newPackTitle}
                    onChange={(e) => setNewPackTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Description / Lore Summary:
                  </label>
                  <input
                    type="text"
                    value={newPackDesc}
                    onChange={(e) => setNewPackDesc(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                  />
                </div>

                {/* Questions List */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>Custom Questions ({customQuestions.length})</span>
                    <button type="button" onClick={addQuestionDraft} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>
                      + Add Question
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {customQuestions.map((q, qIdx) => (
                      <div key={qIdx} style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                        <input
                          type="text"
                          value={q.q}
                          onChange={(e) => {
                            const updated = [...customQuestions];
                            updated[qIdx].q = e.target.value;
                            setCustomQuestions(updated);
                          }}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', marginBottom: '8px', fontWeight: 700, fontSize: '13px' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {q.options.map((opt, optIdx) => (
                            <input
                              key={optIdx}
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...customQuestions];
                                updated[qIdx].options[optIdx] = e.target.value;
                                setCustomQuestions(updated);
                              }}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '14px', marginTop: '10px' }}>
                  Save &amp; Play Custom Pack ▷
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

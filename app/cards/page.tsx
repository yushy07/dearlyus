'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ribbon,
  Navbar,
  CoupleNameBar,
  AiConsentToggle,
  CupidotActivityGuidance,
  ActivityShell,
} from '@/components/shared';
import { sounds } from '@/lib/sound';
import {
  SwipeDeck,
  GlowBadge,
  ScrollProgress,
  ScrollReveal,
} from '@/components/ui';
import { ScratchOffCard } from '@/components/cards/ScratchOffCard';
import { useCoupleProfile } from '@/lib/couple';
import { useAiConsent } from '@/lib/ai-consent';
import { generateAdaptiveQuestion } from '@/lib/gemini';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { usePrivateAnswers } from '@/hooks/usePrivateAnswers';

interface Card {
  tier: string;
  prompt: string;
  category: string;
}

const DECK_COLLECTIONS: Record<string, { name: string; icon: string; cards: Card[] }> = {
  everyday: {
    name: 'Everyday Us',
    icon: '☕',
    cards: [
      { tier: 'Warm Up', category: 'Playful', prompt: 'What is a small detail about me that you noticed recently and never said aloud?' },
      { tier: 'Warm Up', category: 'Habits', prompt: 'What is our funniest inside joke that nobody else in our lives would ever understand?' },
      { tier: 'Warm Up', category: 'Comfort', prompt: 'What ordinary morning or evening routine together do you miss the most?' },
    ],
  },
  appreciation: {
    name: 'Appreciation',
    icon: '🌸',
    cards: [
      { tier: 'Gratitude', category: 'Kindness', prompt: 'When was a moment recently where I made you feel deeply supported?' },
      { tier: 'Gratitude', category: 'Admiration', prompt: 'What is a quality in you that I have learned to love even more over time?' },
      { tier: 'Gratitude', category: 'Presence', prompt: 'What is something I do without thinking that instantly calms your mind?' },
    ],
  },
  repair: {
    name: 'Repair & Safety',
    icon: '🕊️',
    cards: [
      { tier: 'Gentle Repair', category: 'Feelings', prompt: 'Is there a small misunderstanding between us that still lingers and needs a hug?' },
      { tier: 'Gentle Repair', category: 'Safety', prompt: 'How can I best show up for you on days when you feel overwhelmed or quiet?' },
      { tier: 'Gentle Repair', category: 'Reassurance', prompt: 'What reassurance helps your heart most when distance feels heavy?' },
    ],
  },
  distance: {
    name: 'Across the Miles',
    icon: '✈️',
    cards: [
      { tier: 'Distance', category: 'Connection', prompt: 'When is a moment during the distance when you felt closest to me, even miles apart?' },
      { tier: 'Distance', category: 'Longing', prompt: 'What is the very first thing you want us to do the moment we see each other next?' },
      { tier: 'Distance', category: 'Trust', prompt: 'What makes you confident that every single mile of this distance will be worth it?' },
    ],
  },
  dreams: {
    name: 'Someday & Dreams',
    icon: '✨',
    cards: [
      { tier: 'Future', category: 'Adventures', prompt: 'What is one dream trip or quiet hideaway you want us to experience together?' },
      { tier: 'Future', category: 'Home', prompt: 'What does your ideal Sunday morning in our future shared home feel like?' },
      { tier: 'Future', category: 'Growth', prompt: 'How do you hope our relationship evolves over the next five years?' },
    ],
  },
  intimacy: {
    name: 'Deep Intimacy',
    icon: '🤍',
    cards: [
      { tier: 'Vulnerability', category: 'Heart', prompt: 'What is a fear or worry about our future that you haven’t fully voiced yet?' },
      { tier: 'Devotion', category: 'Love', prompt: 'How have you changed as a person since we fell in love?' },
      { tier: 'Tender Truth', category: 'Desire', prompt: 'What is an unspoken romantic gesture you secretly crave from me?' },
    ],
  },
};

export default function CardsPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { hasAiConsent } = useAiConsent();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();
  const [selectedDeckKey, setSelectedDeckKey] = useState<string>('everyday');
  const [deck, setDeck] = useState<Card[]>(DECK_COLLECTIONS.everyday.cards);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scratchMode, setScratchMode] = useState(true);
  const [myAnswer, setMyAnswer] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [reactionChoice, setReactionChoice] = useState<string | null>(null);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);
  const [hostNote, setHostNote] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<
    Array<{ question: string; answerA: string; answerB: string }>
  >([]);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-cards` : 'local-cards',
    activityType: 'cards',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { deckId: selectedDeckKey, totalCards: deck.length },
  });
  const livePair = runtime.transportName !== 'mock';
  const privateAnswers = usePrivateAnswers({
    roundNumber: currentIdx,
    localRuntime: runtime,
  });

  useEffect(() => {
    if (!privateAnswers.revealedAnswers) return;
    const mine = privateAnswers.revealedAnswers.find(
      (answer) => answer.userId === runtime.currentUserId,
    );
    const theirs = privateAnswers.revealedAnswers.find(
      (answer) => answer.userId !== runtime.currentUserId,
    );
    setMyAnswer(String(mine?.answer ?? ''));
    setPartnerAnswer(String(theirs?.answer ?? ''));
    setRevealed(true);
  }, [privateAnswers.revealedAnswers, runtime.currentUserId]);

  const selectDeck = (key: string) => {
    setSelectedDeckKey(key);
    setDeck(DECK_COLLECTIONS[key]?.cards || DECK_COLLECTIONS.everyday.cards);
    setCurrentIdx(0);
    setMyAnswer('');
    setPartnerAnswer('');
    setRevealed(false);
    setReactionChoice(null);
  };

  useEffect(() => {
    const snapshot = runtime.snapshot as {
      cardIndex?: number;
      flipped?: boolean;
    };
    if (typeof snapshot.cardIndex === 'number')
      setCurrentIdx(snapshot.cardIndex % deck.length);
    if (typeof snapshot.flipped === 'boolean') setFlipped(snapshot.flipped);
  }, [runtime.snapshot, deck.length]);

  const card = deck[currentIdx] || deck[0];

  const handleNext = () => {
    sounds.playPop();
    void runtime.sendEvent('cards_next', {});
    setMyAnswer('');
    setPartnerAnswer('');
    setRevealed(false);
    setReactionChoice(null);
    setHostNote(null);
  };

  const handleJustListen = () => {
    setMyAnswer('(Listening to you tenderly 🎧)');
    sounds.playTick();
  };

  const handleSaveKeepsake = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Honest Cards Reflection · ${DECK_COLLECTIONS[selectedDeckKey]?.name || 'Card'}`,
        activityPath: '/cards',
        caption: `Card prompt: "${card.prompt.slice(0, 45)}..."`,
        metadata: {
          activityType: 'cards',
          deckId: selectedDeckKey,
          cardPrompt: card.prompt,
          myAnswer,
          partnerAnswer,
          reaction: reactionChoice,
        },
      });
      setKeepsakeSaved(true);
      sounds.playCelebration();
    } catch (err) {
      console.error('Failed to save reflection keepsake:', err);
    }
  };

  const handleReveal = async () => {
    if (revealed) return;
    if (livePair) {
      try {
        if (!privateAnswers.isLocked) {
          const result = await privateAnswers.lock(myAnswer.trim());
          if (!result.bothLocked) return;
        }
        await privateAnswers.reveal();
      } catch (error) {
        console.error('Failed to seal or reveal private card answers:', error);
      }
      return;
    }
    setRevealed(true);
    sounds.playCelebration();

    const currentRoundData = {
      question: card.prompt,
      answerA: myAnswer.trim(),
      answerB: partnerAnswer.trim(),
    };
    const updatedHistory = [...sessionHistory, currentRoundData];
    setSessionHistory(updatedHistory);

    if (!hasAiConsent || !myAnswer.trim() || !partnerAnswer.trim()) return;

    void generateAdaptiveQuestion({
      partnerA: { name: partnerA, answer: myAnswer.trim() },
      partnerB: { name: partnerB, answer: partnerAnswer.trim() },
      mode: 'cards',
      mood: 'deep',
      aiConsent: true,
      history: updatedHistory,
    })
      .then((data: any) => {
        if (data?.question) {
          const newCard: Card = {
            tier: 'Deep Lore',
            category: 'Adaptive',
            prompt: data.question,
          };
          const nextDeck = [...deck];
          nextDeck.splice(currentIdx + 1, 0, newCard);
          setDeck(nextDeck);
          if (data.commentary) {
            setHostNote(data.commentary);
          }
        }
      })
      .catch(() => {});
  };

  return (
    <ActivityShell
      activityKey="cards"
      title="Honest Cards"
      subtitle="Make room for the conversations you rarely get to have."
      stage={currentIdx === 0 && !revealed ? 'ready' : revealed ? 'remember' : 'play'}
      roomCode={roomCode || undefined}
      isSoloDemo={!roomCode || roomCode === 'local'}
      partnerName={partnerB || 'Partner'}
      partnerPresence={revealed ? 'ready' : partnerAnswer ? 'writing' : 'online'}
      recoveryState={runtime.recoveryState}
      onRetryRecovery={() => runtime.requestRecovery()}
    >
      <main className="wrap" style={{ paddingTop: '24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        {/* Deck Selector Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
          {Object.entries(DECK_COLLECTIONS).map(([key, d]) => (
            <button
              key={key}
              type="button"
              onClick={() => selectDeck(key)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: selectedDeckKey === key ? '2px solid #794c58' : '1px solid rgba(185, 120, 131, 0.25)',
                background: selectedDeckKey === key ? '#fff0f3' : '#ffffff',
                color: '#4a2835',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: selectedDeckKey === key ? '0 2px 8px rgba(121, 76, 88, 0.15)' : 'none',
              }}
            >
              <span>{d.icon}</span>
              <span>{d.name}</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CoupleNameBar />
          <h1
            style={{ fontSize: 'clamp(26px, 3.8vw, 36px)', marginBottom: '8px', fontFamily: 'Georgia, serif', color: '#4a2835' }}
          >
            {DECK_COLLECTIONS[selectedDeckKey]?.name}
          </h1>
          <p style={{ color: '#8c6a75', fontSize: '15px' }}>
            Answer privately on your screens. The card turns once both are locked in.
          </p>
        </div>

        {/* Swipeable Card Stage with Scratch-Off Silver Foil */}
        <div
          style={{
            perspective: '1200px',
            margin: '0 auto 28px',
            maxWidth: '520px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '10px',
            }}
          >
            <button
              onClick={() => {
                sounds.playPop();
                setScratchMode(!scratchMode);
              }}
              style={{
                background: scratchMode
                  ? 'var(--pink-tint)'
                  : 'var(--paper-raised)',
                border: scratchMode
                  ? '1.5px solid var(--pink)'
                  : '1px solid var(--line)',
                color: scratchMode ? 'var(--pink)' : 'var(--ink-soft)',
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🪙</span>
              <span>
                {scratchMode
                  ? '✓ Silver Foil Scratch Mode'
                  : 'Instant Card View'}
              </span>
            </button>
          </div>

          <CupidotActivityGuidance
            activityName="Deep Connection Cards"
            phase={revealed ? 'revealed' : myAnswer ? 'locked' : 'ready'}
            partnerName={partnerB || 'Partner'}
            isDemoMode={true}
            demoNotice="Single-screen preview exploration. In synchronized date nights, each partner responds privately from their own screen."
            privacyNote="No rush, no score, and no pressure to answer what you're not ready to share."
          />

          <SwipeDeck onSwipeRight={handleNext} onSwipeLeft={handleNext}>
            {scratchMode ? (
              <ScratchOffCard resetKey={currentIdx}>
                <div
                  onClick={() => {
                    void runtime.sendEvent('cards_flip', {});
                    sounds.playTick();
                  }}
                  className="card-3d"
                  style={{
                    background: 'linear-gradient(135deg, #FFFDFB, #F6F1EA)',
                    border: '2px solid var(--line)',
                    borderRadius: '20px',
                    padding: '48px 36px',
                    minHeight: '290px',
                    boxShadow:
                      '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(255,123,163,0.06)',
                    cursor: 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <GlowBadge
                        text={`${card.tier} · ${card.category}`}
                        size="sm"
                      />
                    </div>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        marginTop: '16px',
                        color: 'var(--ink)',
                      }}
                    >
                      &ldquo;{card.prompt}&rdquo;
                    </h2>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      fontSize: '12px',
                      color: 'var(--ink-soft)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>👆 Swipe left/right for next</span>
                    <span>{revealed ? '✓ Revealed' : 'Tap to flip'}</span>
                  </div>
                </div>
              </ScratchOffCard>
            ) : (
              <div
                onClick={() => {
                  void runtime.sendEvent('cards_flip', {});
                  sounds.playTick();
                }}
                className="card-3d"
                style={{
                  background: 'linear-gradient(135deg, #FFFDFB, #F6F1EA)',
                  border: '2px solid var(--line)',
                  borderRadius: '20px',
                  padding: '48px 36px',
                  minHeight: '290px',
                  boxShadow:
                    '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(255,123,163,0.06)',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'transform 0.3s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      justifyContent: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <GlowBadge
                      text={`${card.tier} · ${card.category}`}
                      size="sm"
                    />
                  </div>
                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      marginTop: '16px',
                      color: 'var(--ink)',
                    }}
                  >
                    &ldquo;{card.prompt}&rdquo;
                  </h2>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    fontSize: '12px',
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span>👆 Swipe left/right for next</span>
                  <span>{revealed ? '✓ Revealed' : 'Tap to flip'}</span>
                </div>
              </div>
            )}
          </SwipeDeck>
        </div>

        {/* Inputs */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow)',
            marginBottom: '24px',
          }}
        >
          {!revealed ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Your Private Answer ({partnerA}):
                </label>
                <textarea
                  rows={2}
                  value={myAnswer}
                  onChange={(e) => setMyAnswer(e.target.value)}
                  placeholder={`Type your honest thoughts...`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14.5px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleJustListen}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#794c58',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    🎧 Prefer to just listen to your partner on this one?
                  </button>
                </div>
              </div>
              {!livePair && <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  {partnerB}&apos;s Answer (Solo Preview Sandbox):
                </label>
                <textarea
                  rows={2}
                  value={partnerAnswer}
                  onChange={(e) => setPartnerAnswer(e.target.value)}
                  placeholder={`Optional preview: Type ${partnerB}'s answer if testing on one device, or leave blank.`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '14.5px',
                  }}
                />
              </div>}
              {livePair && (
                <p role="status" style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '13px' }}>
                  {privateAnswers.isLocked
                    ? privateAnswers.partnerLocked
                      ? 'Both answers are sealed. Open them together.'
                      : `Your answer is sealed. Waiting for ${runtime.isHost ? partnerB : partnerA}.`
                    : 'Your partner cannot read this until both answers are sealed.'}
                </p>
              )}
              <button
                onClick={() => void handleReveal()}
                disabled={!myAnswer.trim() || privateAnswers.loading || (livePair && privateAnswers.isLocked && !privateAnswers.bothLocked)}
                className="btn btn-primary"
                style={{
                  padding: '12px',
                  fontSize: '15px',
                  justifyContent: 'center',
                }}
              >
                {livePair
                  ? privateAnswers.bothLocked
                    ? 'Open Both Sealed Answers 🔍'
                    : privateAnswers.isLocked
                      ? 'Waiting for Partner…'
                      : 'Seal My Private Answer'
                  : 'Reveal Shared Answers 🔍'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px', animation: 'unfoldIn 0.3s ease' }}>
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--pink)',
                  }}
                >
                  🌸 {partnerA}&apos;s Answer:
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: myAnswer ? 'inherit' : 'var(--ink-soft)',
                    fontStyle: myAnswer ? 'normal' : 'italic',
                  }}
                >
                  {myAnswer || `(No answer entered for ${partnerA})`}
                </p>
              </div>
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--blue)',
                  }}
                >
                  💙 {partnerB}&apos;s Answer:
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: partnerAnswer ? 'inherit' : 'var(--ink-soft)',
                    fontStyle: partnerAnswer ? 'normal' : 'italic',
                  }}
                >
                  {partnerAnswer ||
                    `Awaiting ${partnerB} to share their response.`}
                </p>
              </div>

              {/* Shared Reactions Bar */}
              <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(185,120,131,0.2)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#794c58', marginBottom: '8px' }}>
                  Mutual Reflection Reaction:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {['✨ Tell me more', '🕊️ Hold this gently', '🤍 Keep this memory'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReactionChoice(r)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: reactionChoice === r ? '1.5px solid #794c58' : '1px solid rgba(185,120,131,0.25)',
                        background: reactionChoice === r ? '#fff0f3' : '#fff',
                        color: '#4a2835',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSaveKeepsake}
                  disabled={keepsakeSaved}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: keepsakeSaved ? '#7d917b' : '#794c58',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: keepsakeSaved ? 'default' : 'pointer',
                  }}
                >
                  {keepsakeSaved ? '✓ Saved to Our Space' : '💌 Save to Our Space Keepsakes'}
                </button>
              </div>

              {hostNote && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background:
                      'linear-gradient(135deg, #FFF5F8 0%, #FFFFFF 100%)',
                    border: '1.5px solid rgba(255, 77, 128, 0.25)',
                    fontSize: '13px',
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(255, 77, 128, 0.08)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>ʚ🤖💘ɞ</span>
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: '#FF4D80',
                        textTransform: 'uppercase',
                      }}
                    >
                      CUPIDOT&apos;S CHEEKY NOTE
                    </div>
                    <span style={{ fontStyle: 'italic', fontWeight: 600 }}>
                      &ldquo;{hostNote}&rdquo;
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleNext}
                className="btn btn-grad"
                style={{
                  padding: '12px',
                  fontSize: '15px',
                  justifyContent: 'center',
                }}
              >
                Next Honest Card ▷
              </button>
            </div>
          )}
        </div>
      </main>
    </ActivityShell>
  );
}

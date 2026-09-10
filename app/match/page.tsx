'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

interface ConstellationQuestion {
  dimension: string;
  icon: string;
  question: string;
  options: { text: string; trait: string }[];
}

const CONSTELLATION_QUESTIONS: ConstellationQuestion[] = [
  {
    dimension: 'Affection & Warmth',
    icon: '💖',
    question: 'What represents your ultimate long-distance reassurance ritual?',
    options: [
      { text: 'Falling asleep with the FaceTime call on all night', trait: 'Continuous Presence' },
      { text: 'Waking up to a surprise handwritten note or voice memo', trait: 'Thoughtful Words' },
      { text: 'Sending care packages with hoodies and favorite snacks', trait: 'Physical Tokens' },
      { text: 'Counting down together to the exact hour of airport arrival', trait: 'Milestone Devotion' },
    ],
  },
  {
    dimension: 'Conflict & Repair',
    icon: '🕊️',
    question: 'When you disagree, what is your instinctive repair style?',
    options: [
      { text: 'Talk it out immediately until everything feels calm and clear', trait: 'Direct Resolution' },
      { text: 'Take a short breath to reflect, then discuss gently', trait: 'Measured Reflection' },
      { text: 'Use gentle humor or playful teasing to soften the tension first', trait: 'Humor & Softening' },
      { text: 'Write down thoughts so neither person interrupts', trait: 'Structured Listening' },
    ],
  },
  {
    dimension: 'Weekend Rhythm',
    icon: '✨',
    question: 'How do you prefer to spend a free Saturday evening together remotely?',
    options: [
      { text: 'Deep uninterrupted conversation with candles and dim lighting', trait: 'Intimate Depth' },
      { text: 'Playing games, competing in the arcade, and laughing loud', trait: 'Playful Energy' },
      { text: 'Quiet co-reading or co-working in comforting background presence', trait: 'Parallel Calm' },
      { text: 'Planning future vacations, itineraries, and apartment blueprints', trait: 'Future Architecture' },
    ],
  },
  {
    dimension: 'Communication Style',
    icon: '💌',
    question: 'Throughout a busy workday, how do you like to stay connected?',
    options: [
      { text: 'A steady stream of random memes, photos, and mini thoughts', trait: 'Stream of Life' },
      { text: 'One warm morning voice note and one focused evening call', trait: 'Anchored Cadence' },
      { text: 'Spontaneous 2-minute check-in video pings just to see your smile', trait: 'Micro Moments' },
      { text: 'Leaving thoughtful replies that we can each read when free', trait: 'Asynchronous Care' },
    ],
  },
  {
    dimension: 'Future Horizon',
    icon: '🏡',
    question: 'What is your shared dream aesthetic for your first apartment together?',
    options: [
      { text: 'Warm wood, lots of plants, cozy floor lamps, and an espresso bar', trait: 'Cozy Haven' },
      { text: 'Sunlit windows, clean lines, and an open kitchen for cooking together', trait: 'Modern Light' },
      { text: 'Art prints from our travels, crowded bookshelves, and record player', trait: 'Creative Story' },
      { text: 'A peaceful sanctuary near nature with a balcony for morning coffee', trait: 'Natural Calm' },
    ],
  },
];

export default function MatchPage() {
  const { partnerA, partnerB, cityA, cityB } = useCoupleProfile();
  const [qIndex, setQIndex] = useState(0);
  const [activePartner, setActivePartner] = useState<1 | 2>(1);
  const [partner1Picks, setPartner1Picks] = useState<number[]>([]);
  const [partner2Picks, setPartner2Picks] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState<'ready' | 'play' | 'remember'>('ready');
  const [matchCount, setMatchCount] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { saveKeepsake, isSaving } = useKeepsakeWriter();
  const runtime = useActivityRuntime({
    activityType: 'match',
    transportMode: 'auto',
    initialOptions: { totalPairs: CONSTELLATION_QUESTIONS.length },
  });

  const handleSelectOption = (idx: number) => {
    sounds.playPop();
    if (activePartner === 1) {
      const nextPicks = [...partner1Picks, idx];
      setPartner1Picks(nextPicks);
      if (qIndex + 1 < CONSTELLATION_QUESTIONS.length) {
        setQIndex(qIndex + 1);
      } else {
        // Partner 1 finished, switch to Partner 2
        setActivePartner(2);
        setQIndex(0);
      }
    } else {
      const nextPicks = [...partner2Picks, idx];
      setPartner2Picks(nextPicks);
      if (qIndex + 1 < CONSTELLATION_QUESTIONS.length) {
        setQIndex(qIndex + 1);
      } else {
        // Both finished! Calculate constellation
        sounds.playCelebration();
        let matches = 0;
        for (let i = 0; i < CONSTELLATION_QUESTIONS.length; i++) {
          if (partner1Picks[i] === nextPicks[i]) matches += 1;
        }
        setMatchCount(matches);
        setCurrentStage('remember');
        runtime.dispatch({
          type: 'match_reveal',
          payload: { isMatch: matches > 0, matchCount: matches },
        });
      }
    }
  };

  const currentQ = CONSTELLATION_QUESTIONS[qIndex];

  // Alignments & Complements
  const alignments = CONSTELLATION_QUESTIONS.filter((_, i) => partner1Picks[i] === partner2Picks[i]);
  const complements = CONSTELLATION_QUESTIONS.filter((_, i) => partner1Picks[i] !== partner2Picks[i]);

  const handleSaveConstellation = async () => {
    sounds.playCelebration();
    const success = await saveKeepsake({
      kind: 'activity',
      title: `Love Constellation Map · ${matchCount}/${CONSTELLATION_QUESTIONS.length} Stars Aligned`,
      subtitle: `${partnerA} & ${partnerB} · ${alignments.length} Harmonic Mirrors & ${complements.length} Complementary Bridges`,
      metadata: {
        activityType: 'match',
        alignments: alignments.map((a) => a.dimension),
        complements: complements.map((c) => c.dimension),
        partnerA,
        partnerB,
        cityA,
        cityB,
      },
    });
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  return (
    <ActivityShell
      activityTitle="Love Constellation · Personality Harmony"
      activitySubtitle={`Map shared instincts & complementary dynamics between ${partnerA} & ${partnerB}`}
      currentStage={currentStage}
      partnerPresence={runtime.partnerPresence}
      roomCode={runtime.roomId}
      isHost={runtime.isHost}
      stageIndicator="Private Star Locks → Mutual Constellation Reveal → Celestial Map"
      guidancePhase="answering"
      guidancePrivacyNote="Answers are private until both partners lock in their star coordinates."
      keepsakeSummary={{
        kind: 'activity',
        title: 'Love Constellation Map',
        subtitle: `${alignments.length} alignments · ${complements.length} complements`,
        badge: 'Constellation',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Stage 1 & 2: Star Locks Question Pass */}
        {currentStage !== 'remember' && (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
            }}
          >
            {/* Turn & Dimension Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <span
                className="badge"
                style={{
                  background: activePartner === 1 ? '#FFF0F5' : '#EBF8FF',
                  color: activePartner === 1 ? 'var(--pink)' : '#2B6CB0',
                  fontWeight: 800,
                  fontSize: '12px',
                }}
              >
                {activePartner === 1 ? `🌸 ${partnerA} Locking Star Coordinates` : `💙 ${partnerB} Locking Star Coordinates`}
              </span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                Dimension {qIndex + 1} of {CONSTELLATION_QUESTIONS.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px' }}>{currentQ.icon}</span>
              <div>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {currentQ.dimension}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0 0' }}>
                  {currentQ.question}
                </h2>
              </div>
            </div>

            {/* Options list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="btn btn-ghost"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    textAlign: 'left',
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{opt.text}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--paper-raised)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      color: 'var(--ink-soft)',
                      marginLeft: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opt.trait}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
              🔒 Double-blind protocol: Answers are concealed until both partners have completed the constellation.
            </div>
          </div>
        )}

        {/* Stage 3: Constellation Map Keepsake Screen */}
        {currentStage === 'remember' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>
            
            {/* Celestial Constellation Card */}
            <div
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #12131C 0%, #201526 100%)',
                color: '#FFFFFF',
                borderRadius: '24px',
                padding: '40px 36px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '24px',
              }}
            >
              <div>
                <span className="badge hot" style={{ fontSize: '11.5px', marginBottom: '8px' }}>
                  ʚ 🪐 ɞ Celestial Relationship Constellation
                </span>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 4px', color: '#FFD68A' }}>
                  {alignments.length} Harmonic Mirrors · {complements.length} Dynamic Bridges
                </h2>
                <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: '52ch' }}>
                  Rather than a generic score, your constellation reveals where your hearts reflect each other naturally and where your differences create beautiful balance.
                </p>
              </div>

              {/* Constellation Grid */}
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', textAlign: 'left' }}>
                
                {/* Harmonic Mirrors (Matches) */}
                <div style={{ background: 'rgba(255, 78, 120, 0.1)', border: '1px solid rgba(255, 78, 120, 0.3)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--pink)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
                    ✨ Harmonic Mirrors (Natural Sync)
                  </div>
                  {alignments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {alignments.map((a, i) => (
                        <div key={i} style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{a.icon}</span>
                          <b>{a.dimension}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                      Every dimension brings healthy, complementary differences!
                    </div>
                  )}
                </div>

                {/* Dynamic Bridges (Complements) */}
                <div style={{ background: 'rgba(99, 179, 237, 0.1)', border: '1px solid rgba(99, 179, 237, 0.3)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#63B3ED', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
                    🌉 Complementary Bridges (Growth &amp; Balance)
                  </div>
                  {complements.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {complements.map((c, i) => (
                        <div key={i} style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{c.icon}</span>
                          <b>{c.dimension}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                      Complete synchronicity across all measured horizons!
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Date Idea based on constellation */}
              <div
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <span style={{ fontSize: '28px' }}>🕯️</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#FFD68A' }}>Cupidot Recommended Date:</div>
                  <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {alignments.length >= 3
                      ? 'Late night unscripted FaceTime conversation with tea, celebrating your shared instincts.'
                      : 'Take a collaborative Draw Together challenge or plan a future trip to explore your creative differences!'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={handleSaveConstellation}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 700 }}
                >
                  {isSaving ? 'Saving...' : saveSuccess ? 'Saved to Our Space! 💖' : 'Save Constellation to Our Space'}
                </button>
                <button
                  onClick={() => {
                    setQIndex(0);
                    setActivePartner(1);
                    setPartner1Picks([]);
                    setPartner2Picks([]);
                    setCurrentStage('ready');
                  }}
                  className="btn btn-ghost"
                  style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '12px 20px', fontSize: '13px' }}
                >
                  Retake Constellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}

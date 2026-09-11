'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FASHION_ROUNDS as ROUNDS, FASHION_ITEMS as ITEMS } from '@/data';
import { Confetti, CoupleNameBar, ActivityShell } from '@/components/shared';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { usePrivateAnswers } from '@/hooks/usePrivateAnswers';

export default function FashionShowPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-fashion` : 'local-fashion',
    activityType: 'fashion',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: { round: currentRoundIdx },
  });
  const livePair = runtime.transportName !== 'mock';
  const privateLook = usePrivateAnswers({ roundNumber: currentRoundIdx * 2, localRuntime: runtime });
  const privateRating = usePrivateAnswers({ roundNumber: currentRoundIdx * 2 + 1, localRuntime: runtime });
  const [stage, setStage] = useState<'STYLE' | 'RUNWAY' | 'JUDGE' | 'VERDICT'>(
    'STYLE',
  );

  // Player Outfits
  const [myTop, setMyTop] = useState(ITEMS.tops[0]);
  const [myBottom, setMyBottom] = useState(ITEMS.bottoms[0]);
  const [myShoes, setMyShoes] = useState(ITEMS.shoes[0]);
  const [myAccessory, setMyAccessory] = useState(ITEMS.accessories[0]);
  const [myNote, setMyNote] = useState(
    'An ethereal look blending midnight velvet with molten gold.',
  );

  // Partner Outfits
  const [partnerTop, setPartnerTop] = useState(ITEMS.tops[1]);
  const [partnerBottom, setPartnerBottom] = useState(ITEMS.bottoms[1]);
  const [partnerShoes, setPartnerShoes] = useState(ITEMS.shoes[1]);
  const [partnerAccessory, setPartnerAccessory] = useState(
    ITEMS.accessories[1],
  );

  // Human Peer-to-Peer Ratings
  const [ratingCreativity, setRatingCreativity] = useState(9);
  const [ratingTheme, setRatingTheme] = useState(10);
  const [ratingDrama, setRatingDrama] = useState(9);

  // Scores
  const [myScore, setMyScore] = useState(28);
  const [partnerScore, setPartnerScore] = useState(27);
  const [totalRoundsWon, setTotalRoundsWon] = useState({ me: 0, partner: 0 });
  const [confettiActive, setConfettiActive] = useState(false);

  const currentRound = ROUNDS[currentRoundIdx];

  useEffect(() => {
    const answers = privateLook.revealedAnswers;
    if (!answers || answers.length < 2) return;
    const partnerLook = answers.find((answer) => answer.userId !== runtime.currentUserId)?.answer as {
      top: string; bottom: string; shoes: string; accessory: string;
    };
    setPartnerTop(partnerLook.top);
    setPartnerBottom(partnerLook.bottom);
    setPartnerShoes(partnerLook.shoes);
    setPartnerAccessory(partnerLook.accessory);
    setStage('RUNWAY');
    sounds.playShutter();
    setTimeout(() => setStage('JUDGE'), 2400);
  }, [privateLook.revealedAnswers, runtime.currentUserId]);

  useEffect(() => {
    const answers = privateRating.revealedAnswers;
    if (!answers || answers.length < 2) return;
    const mine = Number(answers.find((answer) => answer.userId === runtime.currentUserId)?.answer || 0);
    const theirs = Number(answers.find((answer) => answer.userId !== runtime.currentUserId)?.answer || 0);
    const scoreA = runtime.isHost ? theirs : mine;
    const scoreB = runtime.isHost ? mine : theirs;
    setMyScore(scoreA);
    setPartnerScore(scoreB);
    setTotalRoundsWon((previous) => scoreA >= scoreB
      ? { ...previous, me: previous.me + 1 }
      : { ...previous, partner: previous.partner + 1 });
    setStage('VERDICT');
    sounds.playCelebration();
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  }, [privateRating.revealedAnswers, runtime.currentUserId, runtime.isHost]);

  const submitLook = async () => {
    if (livePair) {
      try {
        if (!privateLook.isLocked) {
          const result = await privateLook.lock({ top: myTop, bottom: myBottom, shoes: myShoes, accessory: myAccessory, note: myNote });
          if (!result.bothLocked) return;
        }
        await privateLook.reveal();
      } catch (error) {
        console.error('Failed to seal runway look:', error);
      }
      return;
    }
    setStage('RUNWAY');
    sounds.playShutter();

    // Catwalk spotlight animation
    setTimeout(() => {
      setStage('JUDGE');
    }, 2400);
  };

  const submitPeerRating = async (e: React.FormEvent) => {
    e.preventDefault();
    const partnerTotal = ratingCreativity + ratingTheme + ratingDrama;
    if (livePair) {
      try {
        if (!privateRating.isLocked) {
          const result = await privateRating.lock(partnerTotal);
          if (!result.bothLocked) return;
        }
        await privateRating.reveal();
      } catch (error) {
        console.error('Failed to seal runway rating:', error);
      }
      return;
    }
    const myTotal = partnerTotal;

    setMyScore(myTotal);
    setPartnerScore(partnerTotal);

    if (myTotal >= partnerTotal) {
      setTotalRoundsWon((prev) => ({ ...prev, me: prev.me + 1 }));
    } else {
      setTotalRoundsWon((prev) => ({ ...prev, partner: prev.partner + 1 }));
    }

    setStage('VERDICT');
    sounds.playCelebration();
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  const nextRound = () => {
    if (currentRoundIdx < ROUNDS.length - 1) {
      setCurrentRoundIdx((r) => r + 1);
      setStage('STYLE');
    }
  };

  const handleSaveFashionKeepsake = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Fashion Runway Editorial · Round ${currentRoundIdx + 1}`,
        activityPath: '/fashion',
        caption: `${partnerA}: ${myScore} PTS vs ${partnerB}: ${partnerScore} PTS on theme "${currentRound.theme}".`,
        metadata: {
          activityType: 'fashion',
          theme: currentRound.theme,
          round: currentRoundIdx + 1,
          scoreA: myScore,
          scoreB: partnerScore,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch {}
  };

  return (
    <ActivityShell
      activityTitle="Fashion Stylist & Runway Challenge"
      activitySubtitle="Head-to-Head Styling · Secret Wardrobe Curation & Runway Peer Review"
      currentStage={stage === 'VERDICT' ? 'remember' : stage === 'STYLE' ? 'ready' : 'play'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Runway Editorial · ${currentRound.theme.slice(0, 24)}`,
        subtitle: `Round ${currentRoundIdx + 1}/3 · ${myScore} vs ${partnerScore} PTS`,
        badge: '👗 LOOKS RATED',
      }}
      guidancePhase={stage === 'VERDICT' ? 'revealed' : stage === 'STYLE' ? 'private' : 'ready'}
      guidancePrivacyNote="Styling selections are private until both models take the runway for peer ratings."
    >
      <Confetti active={confettiActive} />

      <main className="wrap" style={{ paddingTop: '16px', maxWidth: '980px' }}>
        {/* Stage Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 800,
              margin: '8px 0',
            }}
          >
            Fashion Show for <span className="grad">Two</span>
          </h1>
          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: '16px',
              maxWidth: '54ch',
              margin: '0 auto',
            }}
          >
            Get the same styling brief. Curate your look secretly, walk the
            runway, and rate each other&apos;s outfit!
          </p>
        </div>

        {/* Current Round Brief Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #17181C 0%, #2A2B36 100%)',
            color: '#fff',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--pink)',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                }}
              >
                {currentRound.title}
              </span>
              <h2
                style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}
              >
                {currentRound.theme}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  opacity: 0.7,
                }}
              >
                Palette:
              </span>
              {currentRound.colorPalette.map((col, i) => (
                <span
                  key={i}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: col,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '8px',
              fontSize: '13.5px',
            }}
          >
            ⚡ <b>Twist:</b> {currentRound.twist}
          </div>
        </div>

        {/* STAGE 1: STYLE CURATION */}
        {stage === 'STYLE' && (
          <div className="booth-showcase-grid">
            {/* Wardrobe Controls */}
            <div className="booth-box">
              <span className="eyebrow">Secret Fitting Room</span>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: '6px 0 18px',
                }}
              >
                Build Your Runway Look
              </h3>

              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    1. Top / Outerwear:
                  </label>
                  <select
                    value={myTop}
                    onChange={(e) => setMyTop(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: '#fff',
                      fontSize: '13.5px',
                    }}
                  >
                    {ITEMS.tops.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    2. Bottom / Skirt / Trousers:
                  </label>
                  <select
                    value={myBottom}
                    onChange={(e) => setMyBottom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: '#fff',
                      fontSize: '13.5px',
                    }}
                  >
                    {ITEMS.bottoms.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    3. Footwear:
                  </label>
                  <select
                    value={myShoes}
                    onChange={(e) => setMyShoes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: '#fff',
                      fontSize: '13.5px',
                    }}
                  >
                    {ITEMS.shoes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    4. Statement Accessory:
                  </label>
                  <select
                    value={myAccessory}
                    onChange={(e) => setMyAccessory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: '#fff',
                      fontSize: '13.5px',
                    }}
                  >
                    {ITEMS.accessories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    Designer Runway Pitch:
                  </label>
                  <input
                    type="text"
                    value={myNote}
                    onChange={(e) => setMyNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => void submitLook()}
                disabled={privateLook.loading || (livePair && privateLook.isLocked && !privateLook.bothLocked)}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px',
                  fontSize: '15px',
                }}
              >
                {livePair ? (privateLook.bothLocked ? 'Reveal Both Looks on the Runway' : privateLook.isLocked ? 'Look Sealed · Waiting for Partner…' : 'Seal My Look & Walk the Runway') : 'Walk the Runway 🚶‍♀️▷'}
              </button>
            </div>

            {/* Mannequin Preview */}
            <div
              className="booth-box"
              style={{
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '32px',
              }}
            >
              <span style={{ fontSize: '56px', marginBottom: '16px' }}>👗</span>
              <span className="badge hot" style={{ marginBottom: '8px' }}>
                Your Curated Ensemble
              </span>
              <h4
                style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0' }}
              >
                {myTop}
              </h4>
              <div style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
                paired with {myBottom}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--ink-soft)',
                  marginTop: '4px',
                }}
              >
                Shoes: {myShoes} · Acc: {myAccessory}
              </div>
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: 'var(--paper)',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{myNote}&rdquo;
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: CATWALK SPOTLIGHT */}
        {stage === 'RUNWAY' && (
          <div
            className="booth-box"
            style={{
              padding: '60px 32px',
              textAlign: 'center',
              background: '#17181C',
              color: '#fff',
            }}
          >
            <span
              style={{
                fontSize: '64px',
                animation: 'gl-pulse 0.6s infinite alternate',
                display: 'inline-block',
              }}
            >
              👠
            </span>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 800,
                margin: '16px 0 8px',
              }}
            >
              Walking the Spotlight Runway...
            </h2>
            <p style={{ opacity: 0.8, fontSize: '16px' }}>
              Both players taking the catwalk with flashing cameras and disco
              spotlights!
            </p>
          </div>
        )}

        {/* STAGE 3: HUMAN PEER JUDGING */}
        {stage === 'JUDGE' && (
          <div className="booth-box" style={{ padding: '36px 32px' }}>
            <span className="eyebrow">Player Scorecard</span>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 800,
                margin: '8px 0 20px',
              }}
            >
              Rate Your Partner&apos;s Runway Look
            </h2>

            <form
              onSubmit={submitPeerRating}
              style={{ display: 'grid', gap: '20px' }}
            >
              <div>
                <label
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  <span>1. Theme Accuracy &amp; Twist:</span>
                  <span
                    style={{
                      color: 'var(--pink)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {ratingTheme} / 10
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratingTheme}
                  onChange={(e) => setRatingTheme(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  <span>2. Creativity &amp; Color Synergy:</span>
                  <span
                    style={{
                      color: 'var(--pink)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {ratingCreativity} / 10
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratingCreativity}
                  onChange={(e) => setRatingCreativity(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '6px',
                  }}
                >
                  <span>3. Silhouette Drama &amp; Confidence:</span>
                  <span
                    style={{
                      color: 'var(--pink)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {ratingDrama} / 10
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratingDrama}
                  onChange={(e) => setRatingDrama(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                disabled={privateRating.loading || (livePair && privateRating.isLocked && !privateRating.bothLocked)}
                className="btn btn-primary"
                style={{
                  padding: '14px',
                  fontSize: '15px',
                  justifyContent: 'center',
                }}
              >
                {livePair ? (privateRating.bothLocked ? 'Reveal Both Ratings & Crown 👑' : privateRating.isLocked ? 'Rating Sealed · Waiting…' : 'Seal My Private Rating') : 'Lock In Rating & Reveal Crown 👑'}
              </button>
            </form>
          </div>
        )}

        {/* STAGE 4: VERDICT & CROWN */}
        {stage === 'VERDICT' && (
          <div
            className="booth-box"
            style={{ padding: '40px 32px', textAlign: 'center' }}
          >
            <span
              style={{
                fontSize: '56px',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              👑
            </span>
            <span className="eyebrow">{currentRound.title} Winner</span>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 800,
                margin: '8px 0 16px',
              }}
            >
              {myScore >= partnerScore
                ? `${partnerA} Takes the Crown!`
                : `${partnerB} Takes the Crown!`}
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '32px',
                margin: '24px 0',
              }}
            >
              <div
                style={{
                  background: '#FFF5F8',
                  padding: '18px 24px',
                  borderRadius: '12px',
                  border: '1px solid #FFD6E8',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--pink)',
                  }}
                >
                  🌸 {partnerA}&apos;s Score
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '32px',
                    fontWeight: 900,
                  }}
                >
                  {myScore} / 30
                </div>
              </div>
              <div
                style={{
                  background: '#F0F7FF',
                  padding: '18px 24px',
                  borderRadius: '12px',
                  border: '1px solid #D6E8FF',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--blue)',
                  }}
                >
                  💙 {partnerB}&apos;s Score
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '32px',
                    fontWeight: 900,
                  }}
                >
                  {partnerScore} / 30
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {currentRoundIdx < ROUNDS.length - 1 ? (
                <button
                  onClick={nextRound}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px' }}
                >
                  Next Runway Round ▷
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveFashionKeepsake}
                    disabled={keepsakeSaved || keepsakeSaving}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px' }}
                  >
                    {keepsakeSaved ? '✓ Saved to Keepsakes!' : keepsakeSaving ? 'Archiving...' : 'Save Editorial 💾'}
                  </button>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setCurrentRoundIdx(0);
                      setTotalRoundsWon({ me: 0, partner: 0 });
                      setStage('STYLE');
                    }}
                    className="btn btn-ghost"
                    style={{ padding: '12px 24px' }}
                  >
                    Restart Tour ↺
                  </button>
                  <Link
                    href="/photobooth"
                    className="btn btn-grad"
                    style={{ padding: '12px 28px' }}
                  >
                    Celebrate in Photobooth 📸
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </ActivityShell>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FASHION_ROUNDS as ROUNDS, FASHION_ITEMS as ITEMS } from '@/data';
import { Ribbon, Navbar, Confetti } from '@/components/shared';

export default function FashionShowPage() {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [stage, setStage] = useState<'STYLE' | 'RUNWAY' | 'VERDICT'>('STYLE');

  // Player Outfits
  const [myTop, setMyTop] = useState(ITEMS.tops[0]);
  const [myBottom, setMyBottom] = useState(ITEMS.bottoms[0]);
  const [myShoes, setMyShoes] = useState(ITEMS.shoes[0]);
  const [myAccessory, setMyAccessory] = useState(ITEMS.accessories[0]);
  const [myNote, setMyNote] = useState('An ethereal look blending midnight velvet with molten gold.');

  // Partner Outfits
  const [partnerTop, setPartnerTop] = useState(ITEMS.tops[1]);
  const [partnerBottom, setPartnerBottom] = useState(ITEMS.bottoms[1]);
  const [partnerShoes, setPartnerShoes] = useState(ITEMS.shoes[1]);
  const [partnerAccessory, setPartnerAccessory] = useState(ITEMS.accessories[1]);

  // Scores
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [judgeComment, setJudgeComment] = useState('');
  const [totalRoundsWon, setTotalRoundsWon] = useState({ me: 0, partner: 0 });

  const currentRound = ROUNDS[currentRoundIdx];

  const submitLook = () => {
    setStage('RUNWAY');

    // Simulate AI Fashion Judge Scoring
    setTimeout(() => {
      const p1 = Math.floor(Math.random() * 2) + 8.5; // 8.5 .. 9.5
      const p2 = Math.floor(Math.random() * 2) + 8.2; // 8.2 .. 9.2

      setMyScore(Number(p1.toFixed(1)));
      setPartnerScore(Number(p2.toFixed(1)));

      const comments = [
        `"Mia's choice of ${myTop} with ${myAccessory} was visionary. The silhouette captures the brief with breathtaking charisma. Alex countered brilliantly with ${partnerTop}."`,
        `"Incredible synergy! Both looks commanded the runway. The gold accents in Mia's outfit tipped the crown by a razor-thin margin."`,
        `"A masterclass in proportions and texture layering. Fashion icons in the making!"`,
      ];
      setJudgeComment(comments[currentRoundIdx % comments.length]);

      if (p1 >= p2) {
        setTotalRoundsWon((prev) => ({ ...prev, me: prev.me + 1 }));
      } else {
        setTotalRoundsWon((prev) => ({ ...prev, partner: prev.partner + 1 }));
      }

      setStage('VERDICT');
    }, 2800);
  };

  const nextRound = () => {
    if (currentRoundIdx < ROUNDS.length - 1) {
      setCurrentRoundIdx((r) => r + 1);
      setStage('STYLE');
    }
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      {/* Ribbon */}
      <Ribbon text={<>👗 Fashion Show · <b>A Realtime Styling Game for Two</b> · Free on Angie</>} />

      {/* Top Navbar */}
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
            RUNWAY: <b>ROUND {currentRoundIdx + 1} / 3</b>
          </span>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '980px' }}>
        {/* Stage Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">The Runway Showdown</span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '8px 0' }}>
            Fashion Show for <span className="grad">Two</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '54ch', margin: '0 auto' }}>
            Get the same styling brief and secret twist. Design your outfit, hit the runway, and let AI Stylist Judge Angie crown the best dressed look.
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--pink)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {currentRound.title}
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{currentRound.theme}</h2>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>Palette:</span>
              {currentRound.colorPalette.map((col, i) => (
                <span key={i} style={{ width: '18px', height: '18px', borderRadius: '50%', background: col, border: '1.5px solid #fff' }} />
              ))}
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <b style={{ color: '#FFD166', fontSize: '13px' }}>⚡ Secret Twist: </b>
              <span style={{ fontSize: '13.5px', opacity: 0.9 }}>{currentRound.twist}</span>
            </div>
            <div>
              <b style={{ color: '#06D6A0', fontSize: '13px' }}>💡 Inspiration: </b>
              <span style={{ fontSize: '13.5px', opacity: 0.9 }}>{currentRound.inspiration}</span>
            </div>
          </div>
        </div>

        {/* STAGE 1: DRESSING ROOM (STYLE) */}
        {stage === 'STYLE' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* My Styling Studio */}
            <div className="booth-box" style={{ borderTop: '4px solid var(--pink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Mia&apos;s Atelier (Calgary)</h3>
                <span className="badge hot">Styling Look</span>
              </div>

              {/* Tops */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                  Top Piece:
                </label>
                <select
                  value={myTop}
                  onChange={(e) => setMyTop(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {ITEMS.tops.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Bottoms */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                  Bottom Piece:
                </label>
                <select
                  value={myBottom}
                  onChange={(e) => setMyBottom(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {ITEMS.bottoms.map((b, i) => (
                    <option key={i} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Shoes */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                  Footwear:
                </label>
                <select
                  value={myShoes}
                  onChange={(e) => setMyShoes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {ITEMS.shoes.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Accessories */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                  Signature Accessory:
                </label>
                <select
                  value={myAccessory}
                  onChange={(e) => setMyAccessory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {ITEMS.accessories.map((a, i) => (
                    <option key={i} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Styling Concept Note */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                  Stylist Concept &amp; Story:
                </label>
                <textarea
                  value={myNote}
                  onChange={(e) => setMyNote(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: '13px' }}
                />
              </div>

              <button className="btn btn-grad" onClick={submitLook} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                Lock In Outfit &amp; Walk the Runway ▷
              </button>
            </div>

            {/* Partner's Dressing Room Preview */}
            <div className="booth-box" style={{ borderTop: '4px solid var(--blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Alex&apos;s Atelier (Jakarta)</h3>
                <span className="badge on">Partner Ready</span>
              </div>

              <div style={{ display: 'grid', gap: '12px', background: 'var(--paper)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)', marginBottom: '20px' }}>
                <div>
                  <small style={{ color: 'var(--ink-soft)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Top:</small>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{partnerTop}</div>
                </div>
                <div>
                  <small style={{ color: 'var(--ink-soft)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Bottom:</small>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{partnerBottom}</div>
                </div>
                <div>
                  <small style={{ color: 'var(--ink-soft)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Footwear:</small>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{partnerShoes}</div>
                </div>
                <div>
                  <small style={{ color: 'var(--ink-soft)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Accessory:</small>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{partnerAccessory}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ink-soft)', fontSize: '13px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a7d4d' }}></span>
                <span>Both styling choices will be presented simultaneously to the AI Fashion Judge.</span>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: RUNWAY WALK (ANIMATION) */}
        {stage === 'RUNWAY' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#17181C', color: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontSize: '48px', animation: 'numPop 0.8s infinite' }}>✨ 👠 ✨</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '16px 0 8px' }}>The Models Are Walking the Runway...</h2>
            <p style={{ opacity: 0.8, fontSize: '16px' }}>AI Stylist Judge Angie is evaluating color harmony, silhouette proportions, and twist execution.</p>
          </div>
        )}

        {/* STAGE 3: VERDICT & SCOREBOARD */}
        {stage === 'VERDICT' && (
          <div className="booth-box" style={{ padding: '36px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="eyebrow">Judge Angie Verdict</span>
              <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '8px 0' }}>
                {myScore >= partnerScore ? '👑 Mia Takes the Runway Crown!' : '👑 Alex Wins the Round!'}
              </h2>
              <p style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '60ch', margin: '0 auto' }}>
                {judgeComment}
              </p>
            </div>

            {/* Side by side scorecards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div style={{ background: 'var(--pink-tint)', border: '2px solid var(--pink)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--pink)' }}>MIA (CALGARY)</div>
                <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--ink)', margin: '8px 0' }}>{myScore} / 10</div>
                <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{myTop} · {myAccessory}</div>
              </div>

              <div style={{ background: 'var(--blue-tint)', border: '2px solid var(--blue)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue)' }}>ALEX (JAKARTA)</div>
                <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--ink)', margin: '8px 0' }}>{partnerScore} / 10</div>
                <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{partnerTop} · {partnerAccessory}</div>
              </div>
            </div>

            {/* Score tally */}
            <div style={{ textAlign: 'center', marginBottom: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              OVERALL MATCH STANDING: <b>Mia {totalRoundsWon.me}</b> — <b>{totalRoundsWon.partner} Alex</b>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
              {currentRoundIdx < ROUNDS.length - 1 ? (
                <button className="btn btn-grad" onClick={nextRound} style={{ padding: '12px 28px' }}>
                  Next Runway Brief (Round {currentRoundIdx + 2}) ▷
                </button>
              ) : (
                <Link className="btn btn-grad" href="/photobooth" style={{ padding: '12px 28px' }}>
                  Celebrate in Photobooth 📸 ▷
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

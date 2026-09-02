'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CupidotBot, BotState } from '@/components/bot/CupidotBot';
import { judgeCourtCase, CourtVerdict } from '@/lib/cupidot';
import { sounds } from '@/lib/sound';
import { CoupleNameBar } from '@/components/shared';
import { useCoupleProfile } from '@/lib/couple';

interface CaseExample {
  title: string;
  claim1: (nameA: string, nameB: string) => string;
  claim2: (nameA: string, nameB: string) => string;
}

const PRESET_CASES: CaseExample[] = [
  {
    title: 'The Unanswered FaceTime Mystery',
    claim1: (a, b) => `${a}: "${b} took 2 hours to answer when they said they were just going to the kitchen!"`,
    claim2: (a, b) => `${b}: "I fell asleep on the sofa after 14 hours of work with my phone on silent!"`,
  },
  {
    title: 'The Playlist Monopoly Debate',
    claim1: (a, b) => `${b}: "${a} skips every song I put on after exactly 18 seconds!"`,
    claim2: (a, b) => `${a}: "Because their music sounds like heavy machinery in an elevator!"`,
  },
  {
    title: 'The Oversized Hoodie Territorial War',
    claim1: (a, b) => `${b}: "My favorite vintage sweater mysteriously disappeared into ${a}'s luggage!"`,
    claim2: (a, b) => `${a}: "It smells like ${b} and was legally confiscated under adverse possession!"`,
  },
  {
    title: 'The French Fry Grand Larceny',
    claim1: (a, b) => `${b}: "${a} said they weren't hungry and then ate half my large fries!"`,
    claim2: (a, b) => `${a}: "Couple food is communal property under international maritime law!"`,
  },
];

export default function CourtPage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [caseIdx, setCaseIdx] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [customClaimA, setCustomClaimA] = useState('');
  const [customClaimB, setCustomClaimB] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [verdict, setVerdict] = useState<CourtVerdict | null>(null);
  const [botState, setBotState] = useState<BotState>('idle');
  const [deliberating, setDeliberating] = useState(false);

  const current = PRESET_CASES[caseIdx];

  const handleJudge = () => {
    sounds.playPop();
    setDeliberating(true);
    setBotState('thinking');

    setTimeout(() => {
      let result: CourtVerdict;
      if (useCustom && customTitle) {
        result = judgeCourtCase(
          customTitle,
          customClaimA || `${partnerA} pleads innocent on all counts`,
          customClaimB || `${partnerB} stands by innocence`,
          partnerA,
          partnerB
        );
      } else {
        result = judgeCourtCase(
          current.title,
          current.claim1(partnerA, partnerB),
          current.claim2(partnerA, partnerB),
          partnerA,
          partnerB
        );
      }

      setVerdict(result);
      setDeliberating(false);
      sounds.playCelebration();
      setBotState(result.guiltyParty === 'Both' ? 'celebration' : 'talking');
      setTimeout(() => setBotState('happy'), 2400);
    }, 450);
  };

  const handleNextPreset = () => {
    sounds.playPop();
    setUseCustom(false);
    setCaseIdx((p) => (p + 1) % PRESET_CASES.length);
    setVerdict(null);
    setBotState('idle');
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
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
        {/* Judge Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '180px', height: '180px', margin: '0 auto -10px' }}>
            <CupidotBot state={botState} scale={2.2} />
          </div>
          <CoupleNameBar />
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, margin: '8px 0 10px' }}>
            Romantic <span className="grad">Couples Court</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '52ch', margin: '0 auto' }}>
            Plead your petty crimes, missed calls, and stolen hoodies. Judge Cupidot delivers witty, legally binding romantic justice!
          </p>
        </div>

        {/* Court Case Card */}
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
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              onClick={() => {
                setUseCustom(false);
                setVerdict(null);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                background: !useCustom ? '#17181C' : '#FFFFFF',
                color: !useCustom ? '#FFFFFF' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Preset Docket Cases 📜
            </button>
            <button
              onClick={() => {
                setUseCustom(true);
                setVerdict(null);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                background: useCustom ? '#17181C' : '#FFFFFF',
                color: useCustom ? '#FFFFFF' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Filing Custom Grievance ✍️
            </button>
          </div>

          {!useCustom ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="badge hot">Case #{caseIdx + 1} on Docket</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                  State of Love v. Accused
                </span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '24px' }}>
                &ldquo;{current.title}&rdquo;
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <div style={{ background: '#FFF5F8', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255, 77, 128, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', textTransform: 'uppercase', marginBottom: '6px' }}>
                    🌸 Plaintiff Claim ({partnerA})
                  </div>
                  <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.5, color: '#17181C', fontWeight: 500 }}>
                    {current.claim1(partnerA, partnerB)}
                  </p>
                </div>

                <div style={{ background: '#F0F6FF', padding: '18px', borderRadius: '14px', border: '1px solid rgba(80, 140, 255, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '6px' }}>
                    💙 Defendant Defense ({partnerB})
                  </div>
                  <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.5, color: '#17181C', fontWeight: 500 }}>
                    {current.claim2(partnerA, partnerB)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', textAlign: 'center' }}>
                File a Petty Relationship Crime
              </h2>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Case Title / Charge:
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. The Mysterious Unreturned Sweatpants Incident..."
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FF4D80', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {partnerA}&apos;s Testimony:
                    </label>
                    <textarea
                      rows={3}
                      value={customClaimA}
                      onChange={(e) => setCustomClaimA(e.target.value)}
                      placeholder={`Explain what ${partnerB} did wrong with receipts...`}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '13.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {partnerB}&apos;s Defense:
                    </label>
                    <textarea
                      rows={3}
                      value={customClaimB}
                      onChange={(e) => setCustomClaimB(e.target.value)}
                      placeholder={`${partnerB}'s defense or counter-allegation...`}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '13.5px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-grad"
              onClick={handleJudge}
              disabled={deliberating}
              style={{ padding: '12px 32px', fontSize: '15px' }}
            >
              {deliberating ? 'Judge Cupidot Deliberating... 💭' : 'Bang the Gavel & Rule 🔨'}
            </button>
            {!useCustom && (
              <button className="btn btn-ghost" onClick={handleNextPreset}>
                Next Docket Case ▷
              </button>
            )}
          </div>

          {/* Rendered Court Verdict */}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span className="badge" style={{ background: '#17181C', color: '#FFFFFF', fontWeight: 800, fontSize: '11px' }}>
                  OFFICIAL RULING
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background:
                      verdict.guiltyParty === partnerA
                        ? '#FFF0F5'
                        : verdict.guiltyParty === partnerB
                        ? '#F0F6FF'
                        : '#F3E8FF',
                    color:
                      verdict.guiltyParty === partnerA
                        ? '#E11D48'
                        : verdict.guiltyParty === partnerB
                        ? '#2563EB'
                        : '#7C3AED',
                  }}
                >
                  Guilty Party: {verdict.guiltyParty}
                </span>
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 12px', color: '#17181C' }}>
                {verdict.verdictTitle}
              </h3>

              <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--ink)', marginBottom: '16px' }}>
                {verdict.reasoning}
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
                  📜 MANDATORY ROMANTIC SENTENCE:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#17181C', lineHeight: 1.4 }}>
                  {verdict.sentence}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

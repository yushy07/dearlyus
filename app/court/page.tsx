'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BotState } from '@/components/bot/CupidotBot';
import { Cupidot2D } from '@/components/bot/Cupidot2D';
import { judgeCourtCase, CourtVerdict } from '@/lib/cupidot';
import { sounds } from '@/lib/sound';
import { CoupleNameBar, ActivityShell } from '@/components/shared';
import { useCoupleProfile } from '@/lib/couple';
import { speakCupidot, stopCupidotSpeech } from '@/lib/voice';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';

interface CaseExample {
  title: string;
  category: string;
  claim1: (nameA: string, nameB: string) => string;
  claim2: (nameA: string, nameB: string) => string;
}

const PRESET_CASES: CaseExample[] = [
  {
    title: 'The Oversized Vintage Hoodie Territorial Dispute',
    category: 'Wardrobe Annexation',
    claim1: (a, b) =>
      `${a}: "${b}'s favorite cozy hoodie was legitimately confiscated under couple adverse possession laws. It smells like ${b} and looks 200% better on me!"`,
    claim2: (a, b) =>
      `${b}: "I have not seen that hoodie in four months. I had to freeze during a thunderstorm while ${a} posted selfies wearing it!"`,
  },
  {
    title: 'The French Fry Grand Larceny & Communal Food Conflict',
    category: 'Dining Maritime Law',
    claim1: (a, b) =>
      `${b}: "${a} explicitly said 'I'm not hungry, I'll just have water', and then proceeded to consume 45% of my curly fries!"`,
    claim2: (a, b) =>
      `${a}: "Food ordered by one partner automatically enters joint couple trust custody upon hitting the table. It is science!"`,
  },
  {
    title: 'The 18-Second Playlist Monopoly Incident',
    category: 'Road Trip Sovereignty',
    claim1: (a, b) =>
      `${b}: "${a} demands AUX cord control, plays the first 18 seconds of a song, and skips it right when the bridge starts!"`,
    claim2: (a, b) =>
      `${a}: "I am curating the atmospheric emotional vibe of the drive! You were about to play aggressive techno at 8 AM!"`,
  },
  {
    title: 'The Unanswered FaceTime & Kitchen Detour Mystery',
    category: 'Communication Protocols',
    claim1: (a, b) =>
      `${a}: "${b} texted 'calling you right back, just grabbing a glass of water' and disappeared into the ether for two hours!"`,
    claim2: (a, b) =>
      `${b}: "I sat on the sofa for three seconds, pet the cat, and entered a sudden involuntary 90-minute coma!"`,
  },
];

const OBJECTION_PRESETS = [
  { text: 'Objection: Too Cute! 🌸', icon: '🌸' },
  { text: 'Objection: Slander! 🚨', icon: '🚨' },
  { text: 'Objection: Hearsay from the Cat! 🐱', icon: '🐱' },
  { text: 'Objection: Irresistible Charm! 💖', icon: '💖' },
];

export default function CourtPage() {
  const { partnerA, partnerB, roomCode } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();

  const [courtStage, setCourtStage] = useState<'filing' | 'consent' | 'arguments' | 'verdict' | 'closed'>('filing');
  const [caseIdx, setCaseIdx] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [customClaimA, setCustomClaimA] = useState('');
  const [customClaimB, setCustomClaimB] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const [consentA, setConsentA] = useState(false);
  const [consentB, setConsentB] = useState(false);

  const [verdict, setVerdict] = useState<CourtVerdict | null>(null);
  const [botState, setBotState] = useState<BotState>('idle');
  const [deliberating, setDeliberating] = useState(false);
  const [objections, setObjections] = useState<Array<{ id: number; text: string; sender: string }>>([]);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);

  const runtime = useActivityRuntime({
    sessionId: roomCode ? `room-${roomCode}-court` : 'local-court',
    activityType: 'court',
    roomId: roomCode || 'local',
    transportMode: 'auto',
    initialOptions: {
      caseTitle: PRESET_CASES[0].title,
      plaintiff: partnerA,
      defendant: partnerB,
    },
  });

  useEffect(() => {
    return () => {
      stopCupidotSpeech();
    };
  }, []);

  const currentPreset = PRESET_CASES[caseIdx];

  const handleConsent = (partner: 'A' | 'B') => {
    sounds.playTick();
    if (partner === 'A') setConsentA(true);
    if (partner === 'B') setConsentB(true);

    void runtime.sendEvent('court_consent', { partner });

    const nextA = partner === 'A' ? true : consentA;
    const nextB = partner === 'B' ? true : consentB;
    if (nextA && nextB) {
      sounds.playCelebration();
      setCourtStage('arguments');
      setBotState('talking');
      setTimeout(() => setBotState('idle'), 2000);
    }
  };

  const handleTriggerObjection = (presetText: string, sender: string) => {
    sounds.playPop();
    const newObjection = { id: Date.now(), text: presetText, sender };
    setObjections((prev) => [...prev.slice(-3), newObjection]);
    void runtime.sendEvent('court_objection', { objection: presetText, senderName: sender });
    setBotState('sassy');
    setTimeout(() => setBotState('idle'), 1800);
  };

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
          partnerB,
        );
      } else {
        result = judgeCourtCase(
          currentPreset.title,
          currentPreset.claim1(partnerA, partnerB),
          currentPreset.claim2(partnerA, partnerB),
          partnerA,
          partnerB,
        );
      }

      setVerdict(result);
      setCourtStage('verdict');
      void runtime.sendEvent('court_verdict', {
        verdict: result.verdictTitle,
        penalty: result.sentence,
      });
      setDeliberating(false);
      sounds.playCelebration();

      const courtMood = result.guiltyParty === 'Both' ? 'sassy' : 'angry';
      setBotState(courtMood);

      speakCupidot(
        `Order in the court! ${result.verdictTitle}. The court finds: ${result.guiltyParty} guilty! ${result.reasoning} Mandatory joint sentence: ${result.sentence}`,
        {
          mood: courtMood,
          onStart: () => setBotState(courtMood),
          onEnd: () => setTimeout(() => setBotState('sassy'), 2200),
        },
      );
    }, 600);
  };

  const handleNextPreset = () => {
    stopCupidotSpeech();
    sounds.playPop();
    setUseCustom(false);
    const nextIdx = (caseIdx + 1) % PRESET_CASES.length;
    setCaseIdx(nextIdx);
    setVerdict(null);
    setConsentA(false);
    setConsentB(false);
    setCourtStage('filing');
    setObjections([]);
    setBotState('idle');
    void runtime.sendEvent('court_case_change', {
      caseTitle: PRESET_CASES[nextIdx].title,
      plaintiff: partnerA,
      defendant: partnerB,
    });
  };

  const handleSaveHouseRule = async () => {
    if (!verdict || keepsakeSaved || keepsakeSaving) return;
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Court Ruling & House Rule · ${verdict.verdictTitle}`,
        activityPath: '/court',
        caption: `Agreed joint court repair proposal: "${verdict.sentence}" (Zero real blame, 100% affection).`,
        metadata: {
          activityType: 'court',
          caseTitle: useCustom ? customTitle : currentPreset.title,
          verdictTitle: verdict.verdictTitle,
          ruling: verdict.sentence,
          guiltyParty: verdict.guiltyParty,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
      sounds.playCelebration();
    } catch {
      // Handled by writer
    }
  };

  const currentShellStage =
    courtStage === 'filing' || courtStage === 'consent'
      ? 'ready'
      : courtStage === 'arguments'
        ? 'play'
        : 'remember';

  return (
    <ActivityShell
      activityTitle="Theatrical Couples Court"
      activitySubtitle="Fictional Courtroom Game · Zero Blame & Silly Petitions"
      currentStage={currentShellStage}
      keepsakeSummary={
        verdict
          ? {
              kind: 'activity',
              title: `House Rule · ${verdict.verdictTitle}`,
              subtitle: verdict.sentence.slice(0, 45) + '...',
              badge: '🔨 RULING LOGGED',
            }
          : undefined
      }
      guidancePhase={verdict ? 'revealed' : deliberating ? 'locked' : 'ready'}
      guidancePrivacyNote="100% playful theatrical roleplay. Both partners must confirm mutual consent before trials proceed."
    >
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0 40px' }}>
        {/* Judge Podium */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '180px', height: '180px', margin: '0 auto -10px' }}>
            <Cupidot2D state={botState} size={220} roam />
          </div>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 800,
              margin: '8px 0 8px',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            Theatrical <span className="grad">Couples Court</span>
          </h1>
          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: '15px',
              maxWidth: '54ch',
              margin: '0 auto 12px',
              lineHeight: 1.5,
            }}
          >
            A 100% fictional, lighthearted courtroom game for pretend couple debates (stolen hoodies, playlist monopolies, extra fries). Pure play, zero real blame.
          </p>
        </div>

        {/* Live Objections Stream */}
        {objections.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            {objections.map((obj) => (
              <div
                key={obj.id}
                style={{
                  background: 'linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 100%)',
                  border: '1.5px solid #FF4D80',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#FF4D80',
                  boxShadow: '0 4px 12px rgba(255, 77, 128, 0.15)',
                  animation: 'gl-rise 0.25s ease',
                }}
              >
                {obj.sender}: {obj.text}
              </div>
            ))}
          </div>
        )}

        {/* COURT MAIN CONTAINER */}
        <div
          style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '32px',
          }}
        >
          {/* ACT I: FILING & BOUNDARIES */}
          {courtStage === 'filing' && (
            <div>
              {/* Mode Switcher */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}
              >
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
                  Preset Playful Cases 📜
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
                  Custom Whimsical Charge ✍️
                </button>
              </div>

              {!useCustom ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <span className="badge hot">Case #{caseIdx + 1} on Docket</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      {currentPreset.category}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      textAlign: 'center',
                      marginBottom: '24px',
                    }}
                  >
                    &ldquo;{currentPreset.title}&rdquo;
                  </h2>

                  {/* Claims Grid Preview */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '16px',
                      marginBottom: '28px',
                    }}
                  >
                    <div
                      style={{
                        background: '#FFF5F8',
                        padding: '18px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 77, 128, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: '#FF4D80',
                          textTransform: 'uppercase',
                          marginBottom: '6px',
                        }}
                      >
                        🌸 Plaintiff Claim ({partnerA})
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#17181C' }}>
                        {currentPreset.claim1(partnerA, partnerB)}
                      </p>
                    </div>

                    <div
                      style={{
                        background: '#F0F6FF',
                        padding: '18px',
                        borderRadius: '14px',
                        border: '1px solid rgba(80, 140, 255, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: '#3B82F6',
                          textTransform: 'uppercase',
                          marginBottom: '6px',
                        }}
                      >
                        💙 Defendant Defense ({partnerB})
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#17181C' }}>
                        {currentPreset.claim2(partnerA, partnerB)}
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
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: 'var(--ink-soft)',
                          textTransform: 'uppercase',
                          marginBottom: '6px',
                        }}
                      >
                        Case Title / Silly Allegation:
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. The Mysterious Disappearance of the Fluffy Socks..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid var(--line)',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: '#FF4D80',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                          }}
                        >
                          {partnerA}&apos;s Testimony:
                        </label>
                        <textarea
                          rows={3}
                          value={customClaimA}
                          onChange={(e) => setCustomClaimA(e.target.value)}
                          placeholder={`Explain what ${partnerB} did wrong with receipts...`}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--line)',
                            fontSize: '13.5px',
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: '#3B82F6',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                          }}
                        >
                          {partnerB}&apos;s Defense:
                        </label>
                        <textarea
                          rows={3}
                          value={customClaimB}
                          onChange={(e) => setCustomClaimB(e.target.value)}
                          placeholder={`${partnerB}'s innocent defense or counter-plea...`}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--line)',
                            fontSize: '13.5px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step to Mutual Consent Gate */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    sounds.playPop();
                    setCourtStage('consent');
                  }}
                  style={{ padding: '12px 36px', fontSize: '15px' }}
                >
                  Proceed to Consent Check ⚖️
                </button>
                {!useCustom && (
                  <button
                    className="btn btn-ghost"
                    onClick={handleNextPreset}
                    style={{ marginLeft: '12px', padding: '12px 20px', fontSize: '14px' }}
                  >
                    Next Preset Case ▷
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MUTUAL CONSENT GATE */}
          {courtStage === 'consent' && (
            <div style={{ textAlign: 'center', animation: 'gl-rise 0.25s ease' }}>
              <span className="badge hot" style={{ marginBottom: '10px' }}>
                MUTUAL CONSENT GATE · SAFETY FIRST
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0 12px' }}>
                Confirm Jurisdiction of Play
              </h2>
              <p style={{ fontSize: '14.5px', color: 'var(--ink-soft)', maxWidth: '52ch', margin: '0 auto 24px', lineHeight: 1.5 }}>
                Couples Court is strictly for giggles and pretend crimes. Both of you must accept jurisdiction to confirm you are in good spirits.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  maxWidth: '560px',
                  margin: '0 auto 28px',
                }}
              >
                <div
                  style={{
                    background: '#FFF5F8',
                    padding: '20px',
                    borderRadius: '16px',
                    border: consentA ? '2px solid #16A34A' : '1px solid #FFD6E8',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#FF4D80', marginBottom: '8px' }}>
                    🌸 {partnerA}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleConsent('A')}
                    style={{
                      background: consentA ? '#16A34A' : '#FF4D80',
                      color: '#FFF',
                      fontSize: '13px',
                      padding: '8px 18px',
                    }}
                  >
                    {consentA ? '✓ Jurisdiction Accepted' : 'Confirm Consent ⚖️'}
                  </button>
                </div>

                <div
                  style={{
                    background: '#F0F6FF',
                    padding: '20px',
                    borderRadius: '16px',
                    border: consentB ? '2px solid #16A34A' : '1px solid #D6E8FF',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#3B82F6', marginBottom: '8px' }}>
                    💙 {partnerB}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleConsent('B')}
                    style={{
                      background: consentB ? '#16A34A' : '#3B82F6',
                      color: '#FFF',
                      fontSize: '13px',
                      padding: '8px 18px',
                    }}
                  >
                    {consentB ? '✓ Jurisdiction Accepted' : 'Confirm Consent ⚖️'}
                  </button>
                </div>
              </div>

              <button
                className="btn btn-ghost"
                onClick={() => setCourtStage('filing')}
                style={{ fontSize: '13px' }}
              >
                ← Back to Docket Selection
              </button>
            </div>
          )}

          {/* ACT II: ARGUMENTS & OBJECTIONS */}
          {courtStage === 'arguments' && (
            <div style={{ animation: 'gl-rise 0.25s ease' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span className="badge hot">ACT II · ARGUMENTS IN SESSION</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                  Active Docket Trial
                </span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '20px' }}>
                &ldquo;{useCustom ? customTitle : currentPreset.title}&rdquo;
              </h2>

              {/* Objections Tool Belt */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '12px 18px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--ink-soft)' }}>
                  RAISE PLAYFUL OBJECTION:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {OBJECTION_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleTriggerObjection(p.text, partnerA)}
                      className="btn btn-ghost"
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '999px' }}
                    >
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Deliberate */}
              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <button
                  className="btn btn-grad"
                  onClick={handleJudge}
                  disabled={deliberating}
                  style={{ padding: '13px 36px', fontSize: '15.5px' }}
                >
                  {deliberating ? 'Judge Cupidot Deliberating... 💭' : 'Bang the Gavel & Rule 🔨'}
                </button>
              </div>
            </div>
          )}

          {/* ACT III: RENDERED VERDICT & HOUSE RULE */}
          {courtStage === 'verdict' && verdict && (
            <div
              style={{
                padding: '28px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FFF9F5 0%, #FFFFFF 100%)',
                border: '1.5px solid rgba(255, 120, 80, 0.3)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                animation: 'gl-rise 0.3s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span
                  className="badge"
                  style={{
                    background: '#17181C',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '11px',
                  }}
                >
                  JUDICIAL RULING
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: '#F0FDF4',
                    color: '#16A34A',
                  }}
                >
                  Zero Fault · Mutual Play
                </span>
              </div>

              <h3
                style={{
                  fontSize: '21px',
                  fontWeight: 800,
                  margin: '0 0 12px',
                  color: '#17181C',
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}
              >
                {verdict.verdictTitle}
              </h3>

              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  marginBottom: '20px',
                }}
              >
                {verdict.reasoning}
              </p>

              {/* Repair Proposal / House Rule Card */}
              <div
                style={{
                  background: '#FFF5F0',
                  border: '1.5px dashed #FF9E7D',
                  padding: '18px 22px',
                  borderRadius: '14px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: '#E04A18',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  ✨ BINDING PLAYFUL REPAIR PROPOSAL:
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#17181C',
                    lineHeight: 1.5,
                  }}
                >
                  {verdict.sentence}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSaveHouseRule}
                    disabled={keepsakeSaved || keepsakeSaving}
                    className="btn btn-grad"
                    style={{ padding: '10px 22px', fontSize: '13.5px' }}
                  >
                    {keepsakeSaved ? '✓ Saved House Rule to Keepsakes' : keepsakeSaving ? 'Archiving...' : 'Save as Agreed House Rule 📜'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleNextPreset}
                    style={{ fontSize: '13px', padding: '10px 16px' }}
                  >
                    Next Case on Docket ▷
                  </button>
                </div>

                <button
                  className="btn btn-sm"
                  onClick={() => {
                    sounds.playPop();
                    const courtMood = 'happy';
                    setBotState(courtMood);
                    speakCupidot(
                      `Court is adjourned! ${verdict.verdictTitle}. ${verdict.reasoning} Mandatory suggestion: ${verdict.sentence}`,
                      {
                        mood: courtMood,
                        onStart: () => setBotState(courtMood),
                        onEnd: () => setTimeout(() => setBotState('idle'), 2000),
                      },
                    );
                  }}
                  style={{
                    background: '#FF4D80',
                    color: '#FFF',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    padding: '8px 16px',
                  }}
                >
                  🔊 Hear Judge Cupidot Speak
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ActivityShell>
  );
}

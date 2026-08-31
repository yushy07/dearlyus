'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CaseExample {
  title: string;
  claim1: string;
  claim2: string;
  verdict: string;
}

const CASES: CaseExample[] = [
  {
    title: 'The Unanswered FaceTime Mystery',
    claim1: 'Mia: "He took 2 hours to answer when he said he was just going to the fridge!"',
    claim2: 'Alex: "I fell asleep on the sofa after 14 hours of work with my phone on silent!"',
    verdict: 'Judge Angie Verdict: Defendant Alex is found guilty of accidental couch-coma! Penalty: Alex must send 3 funny selfie voice notes and order Mia her favorite boba milk tea tomorrow.',
  },
  {
    title: 'The Playlist Monopoly Debate',
    claim1: 'Alex: "Mia skips every song I put on after exactly 18 seconds!"',
    claim2: 'Mia: "Because his music sounds like heavy machinery in an elevator!"',
    verdict: 'Judge Angie Verdict: Joint custody of the Bluetooth queue! A strict 1-for-1 song rotation is decreed with no skipping before the chorus.',
  },
];

export default function CourtPage() {
  const [caseIdx, setCaseIdx] = useState(0);
  const [customCase, setCustomCase] = useState('');
  const [verdict, setVerdict] = useState<string | null>(null);

  const current = CASES[caseIdx];

  const judgeCase = () => {
    setVerdict(
      customCase
        ? `Judge Angie Verdict on "${customCase}": After thorough review of the romantic evidence, both parties are sentenced to mandatory 30-minute cuddle time upon the next airport reunion. Court is adjourned with love! 💕`
        : current.verdict
    );
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
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

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="eyebrow">Couples Court · AI Relationship Judge</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '10px' }}>
            Plead your case, <span className="grad">get a verdict</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            Playful dispute resolution with Judge Angie delivering sweet, hilarious verdicts.
          </p>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '10px' }}>⚖️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '20px' }}>
            {current.title}
          </h2>

          <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--pink-tint)', padding: '14px', borderRadius: '10px', fontSize: '14px', color: '#17181C' }}>
              {current.claim1}
            </div>
            <div style={{ background: 'var(--blue-tint)', padding: '14px', borderRadius: '10px', fontSize: '14px', color: '#17181C' }}>
              {current.claim2}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Or Enter Your Own Relationship Case:
            </label>
            <input
              type="text"
              value={customCase}
              onChange={(e) => setCustomCase(e.target.value)}
              placeholder="e.g. Who takes longer to get ready for FaceTime calls..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--line)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-grad" onClick={judgeCase} style={{ padding: '12px 28px' }}>
              Bang the Gavel &amp; Rule 🔨
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setCaseIdx((p) => (p + 1) % CASES.length);
                setVerdict(null);
                setCustomCase('');
              }}
            >
              Next Case ▷
            </button>
          </div>

          {verdict && (
            <div
              style={{
                marginTop: '28px',
                padding: '20px',
                borderRadius: '12px',
                background: '#eafaf1',
                border: '1px solid #bfe6d2',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>📜</div>
              <p style={{ fontSize: '15px', color: '#0a7d4d', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                {verdict}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

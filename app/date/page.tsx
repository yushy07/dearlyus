'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PREMADE_DATE_PLANS } from '@/data';
import { Ribbon, Navbar } from '@/components/shared';
import { sounds } from '@/lib/sound';

interface RecipeStep {
  stepNum: number;
  title: string;
  durationSec: number;
  instruction: string;
}

export default function DateNightPlannerPage() {
  const [selectedMood, setSelectedMood] = useState<'romantic' | 'playful' | 'chill'>('romantic');
  const plan = PREMADE_DATE_PLANS[selectedMood];

  // Ambient Soundscape Mixer State
  const [rainActive, setRainActive] = useState(false);
  const [fireActive, setFireActive] = useState(false);

  // Parallel Cooking Duel State
  const [cookingMode, setCookingMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState('Creamy Garlic Carbonara 🍝');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [stepSecondsLeft, setStepSecondsLeft] = useState(180);

  const recipeSteps: RecipeStep[] = [
    { stepNum: 1, title: 'Prep Ingredients & Boil Water', durationSec: 180, instruction: 'Fill pot with water, add 1 tbsp salt. Mince 3 cloves of garlic on camera together!' },
    { stepNum: 2, title: 'Cook Pasta & Sizzle Garlic', durationSec: 480, instruction: 'Drop pasta in boiling water. Sizzle garlic in olive oil on medium heat until fragrant.' },
    { stepNum: 3, title: 'Whisk Sauce & Combine', durationSec: 180, instruction: 'Whisk 2 egg yolks with parmesan and black pepper. Toss hot drained pasta into the pan with sauce!' },
    { stepNum: 4, title: 'Plate, Pour Drinks & Rate Look', durationSec: 120, instruction: 'Plate your dishes, hold them up to the webcam, and take a 4-cut photobooth victory strip!' },
  ];

  // Cooking Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && stepSecondsLeft > 0) {
      interval = setInterval(() => {
        setStepSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (stepSecondsLeft === 0 && timerRunning) {
      sounds.playCelebration();
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, stepSecondsLeft]);

  const toggleRain = () => {
    const next = !rainActive;
    setRainActive(next);
    sounds.toggleRainSound(next);
  };

  const toggleFire = () => {
    const next = !fireActive;
    setFireActive(next);
    sounds.toggleFireplaceSound(next);
  };

  const nextCookingStep = () => {
    if (currentStepIdx < recipeSteps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      setStepSecondsLeft(recipeSteps[nextIdx].durationSec);
      setTimerRunning(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      {/* Ribbon */}
      <Ribbon text={<>🌙 Date Night Generator · <b>Curated Schedules, Ambient Soundscapes &amp; Cooking Sync</b></>} />

      {/* Top Navbar */}
      <Navbar
        rightAction={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={toggleRain}
              className={`btn ${rainActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              🌧️ Rain: {rainActive ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={toggleFire}
              className={`btn ${fireActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              🔥 Fireplace: {fireActive ? 'ON' : 'OFF'}
            </button>
          </div>
        }
      />

      <main className="wrap" style={{ paddingTop: '36px', maxWidth: '920px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="eyebrow">Date Night Architect &amp; Atmosphere</span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '8px 0' }}>
            Never Ask <span className="grad">&ldquo;What should we do?&rdquo;</span> Again.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '54ch', margin: '0 auto' }}>
            Pick tonight&apos;s mood and time limit. Angie builds a seamless itinerary of synced games, prompts, and photobooth milestones.
          </p>
        </div>

        {/* Mood & Activity Mode Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setCookingMode(false);
              setSelectedMood('romantic');
            }}
            className={`btn ${!cookingMode && selectedMood === 'romantic' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '10px 20px', borderRadius: '10px' }}
          >
            🕯️ Romantic &amp; Deep
          </button>
          <button
            onClick={() => {
              setCookingMode(false);
              setSelectedMood('playful');
            }}
            className={`btn ${!cookingMode && selectedMood === 'playful' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '10px 20px', borderRadius: '10px' }}
          >
            ⚡ Playful &amp; Competitive
          </button>
          <button
            onClick={() => {
              setCookingMode(false);
              setSelectedMood('chill');
            }}
            className={`btn ${!cookingMode && selectedMood === 'chill' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '10px 20px', borderRadius: '10px' }}
          >
            ☕ Chill &amp; Cozy
          </button>
          <button
            onClick={() => setCookingMode(true)}
            className={`btn ${cookingMode ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '10px 20px', borderRadius: '10px', background: cookingMode ? 'var(--pink)' : undefined, color: cookingMode ? '#fff' : undefined }}
          >
            🍳 Parallel Kitchen Duel
          </button>
        </div>

        {!cookingMode ? (
          /* Generated Itinerary Card */
          <div className="booth-box" style={{ padding: '32px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div>
                <span className="badge hot" style={{ marginBottom: '6px' }}>{plan.mood}</span>
                <h2 style={{ fontSize: '26px', fontWeight: 800 }}>{plan.name}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--pink)' }}>{plan.duration}</span>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Total Date Length</div>
              </div>
            </div>

            {/* Activity Sequence Timeline */}
            <div style={{ display: 'grid', gap: '14px', marginBottom: '28px' }}>
              {plan.activities.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--paper)',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '28px' }}>{act.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px' }}>
                        Step {idx + 1}: {act.title}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)' }}>{act.desc}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)' }}>
                      {act.time}
                    </span>
                    <Link className="btn btn-ghost" href={act.href} style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                      Start ▷
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Ambient Atmosphere Bar */}
            <div
              style={{
                background: 'var(--paper)',
                padding: '18px 22px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                  Ambient Soundscape Generator:
                </span>
                <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px' }}>
                  {rainActive || fireActive ? `Active Sound: ${rainActive ? 'Rain on Window 🌧️ ' : ''}${fireActive ? 'Fireplace 🔥' : ''}` : 'No background sound (Click top bar to start)'}
                </div>
              </div>

              <Link className="btn btn-grad" href={plan.activities[0].href} style={{ padding: '10px 24px' }}>
                Launch Full Date Night (Step 1) ▷
              </Link>
            </div>
          </div>
        ) : (
          /* Parallel Cooking Duel Mode */
          <div className="booth-box" style={{ padding: '36px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div>
                <span className="badge hot">Two Kitchens · One Dinner</span>
                <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>{selectedRecipe}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Creamy Garlic Carbonara 🍝', 'Japanese Omurice 🍳', 'Korean Kimchi Rice 🌶️'].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRecipe(r);
                      setCurrentStepIdx(0);
                      setStepSecondsLeft(recipeSteps[0].durationSec);
                      setTimerRunning(false);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: selectedRecipe === r ? '1.5px solid var(--pink)' : '1px solid var(--line)',
                      background: selectedRecipe === r ? 'var(--pink-tint)' : '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {r.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Step Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, #17181C 0%, #2A2B36 100%)',
                color: '#fff',
                borderRadius: '16px',
                padding: '32px',
                marginBottom: '28px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: '.14em' }}>
                Step {recipeSteps[currentStepIdx].stepNum} of {recipeSteps.length}
              </span>
              <h3 style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 16px' }}>
                {recipeSteps[currentStepIdx].title}
              </h3>
              <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '50ch', margin: '0 auto 24px', lineHeight: 1.6 }}>
                {recipeSteps[currentStepIdx].instruction}
              </p>

              {/* Step Timer */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '56px', fontWeight: 900, color: 'var(--pink)', marginBottom: '16px' }}>
                {formatTimer(stepSecondsLeft)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                >
                  {timerRunning ? 'Pause Timer ⏸️' : 'Start Step Timer ⏱️'}
                </button>
                <button
                  onClick={nextCookingStep}
                  disabled={currentStepIdx >= recipeSteps.length - 1}
                  className="btn btn-ghost"
                  style={{ padding: '10px 24px', fontSize: '14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  Next Cooking Step ▷
                </button>
              </div>
            </div>

            {/* Victory Photobooth Link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
                Done cooking? Hold your plates up to the webcam and snap a 4-cut victory strip!
              </span>
              <Link href="/photobooth" className="btn btn-grad" style={{ padding: '10px 24px' }}>
                Snap Dish in Photobooth 📸
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

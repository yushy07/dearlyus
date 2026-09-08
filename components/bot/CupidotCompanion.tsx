'use client';

import { useEffect, useRef, useState } from 'react';
import type { BotState } from './CupidotBot';
import { CupidotDockAvatar } from './CupidotDockAvatar';
import { Cupidot2D } from './Cupidot2D';
import {
  nextCompanionMoment,
  type CompanionMoment,
  type CompanionMood,
} from '@/lib/cupidot-moments';
import {
  speakCupidot,
  stopCupidotSpeech,
  getStoredVoiceMode,
  setStoredVoiceMode,
  replayCupidotSpeech,
  type VoiceMode,
} from '@/lib/voice';
import { useDraggableFixed } from '@/lib/use-draggable-fixed';
import styles from './CupidotCompanion.module.css';

const MOODS = [
  {
    id: 'playful',
    label: 'Playful',
    icon: '✦',
    welcome: 'A little mischief, if you’re in the mood.',
  },
  {
    id: 'tender',
    label: 'Tender',
    icon: '♡',
    welcome: 'Let’s make room for something sweet.',
  },
  {
    id: 'quiet',
    label: 'Quiet',
    icon: '☾',
    welcome: 'We can just be here. That counts too.',
  },
] as const;

export function CupidotCompanion() {
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<CompanionMood>('playful');
  const [moment, setMoment] = useState<CompanionMoment | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [botState, setBotState] = useState<BotState>('idle');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('chirp');
  const [showGreeting, setShowGreeting] = useState(true);
  const seen = useRef<string[]>([]);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const dockDrag = useDraggableFixed<HTMLDivElement>(
    'dearly-us:cupidot-dock-position',
  );
  const currentMood = MOODS.find((item) => item.id === mood)!;

  useEffect(() => {
    setReady(true);
    const updateVoice = () => setVoiceMode(getStoredVoiceMode());
    updateVoice();
    window.addEventListener('dearly_cupidot_voice_mode_changed', updateVoice);
    window.addEventListener('storage', updateVoice);
    const greetingTimer = setTimeout(() => setShowGreeting(false), 10000);
    return () => {
      clearTimeout(greetingTimer);
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      window.removeEventListener(
        'dearly_cupidot_voice_mode_changed',
        updateVoice,
      );
      window.removeEventListener('storage', updateVoice);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], [tabindex="0"]',
        ) ?? [],
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      stopCupidotSpeech();
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      if (previousFocus?.isConnected && previousFocus !== document.body)
        previousFocus.focus();
      else launcher.current?.focus();
    };
  }, [isOpen]);

  function react(line: string, state: BotState = 'love') {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    stopCupidotSpeech();
    setReaction(line);
    setBotState(state);
    if (mood !== 'quiet')
      speakCupidot(line, {
        mood: state === 'celebration' ? 'celebration' : 'love',
      });
    reactionTimer.current = setTimeout(
      () => setBotState(mood === 'quiet' ? 'sleeping' : 'idle'),
      2200,
    );
  }

  function chooseMoment(nextMood = mood) {
    stopCupidotSpeech();
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    const next = nextCompanionMoment(nextMood, seen.current);
    // Start a fresh cycle after all prompts for this mood have been seen.
    if (seen.current.includes(next.id)) seen.current = [];
    seen.current.push(next.id);
    setMoment(next);
    setSelected(null);
    setReaction(null);
    setBotState(nextMood === 'quiet' ? 'sleeping' : 'happy');
  }

  function changeMood(nextMood: CompanionMood) {
    setMood(nextMood);
    chooseMoment(nextMood);
  }

  function toggleVoice() {
    const modes: VoiceMode[] = ['chirp', 'speech', 'mute'];
    const next = modes[(modes.indexOf(voiceMode) + 1) % modes.length];
    stopCupidotSpeech();
    setVoiceMode(next);
    setStoredVoiceMode(next);
  }

  return (
    <>
      <div ref={dockDrag.ref} className={styles.dock} style={dockDrag.style}>
        {ready && !isOpen && showGreeting && (
          <button
            className={styles.greeting}
            onClick={() => {
              setIsOpen(true);
              setShowGreeting(false);
            }}
          >
            A little moment? I have an idea. ♡
          </button>
        )}
        <button
          ref={launcher}
          type="button"
          disabled={!ready}
          {...dockDrag.dragHandleProps}
          className={styles.launcher}
          aria-label="Open Cupidot"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => {
            if (!dockDrag.consumeDrag()) {
              setIsOpen(true);
              setShowGreeting(false);
              setReaction(null);
              setBotState(mood === 'quiet' ? 'sleeping' : 'happy');
            }
          }}
        >
          <CupidotDockAvatar state={isOpen ? botState : 'idle'} />
        </button>
      </div>
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div
            ref={panel}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cupidot-title"
            tabIndex={-1}
          >
            <header className={styles.header}>
              <span className={styles.eyebrow}>YOUR LITTLE CO-CONSPIRATOR</span>
              <button
                className={styles.close}
                aria-label="Close Cupidot"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
              <button
                className={styles.pet}
                aria-label="Give Cupidot a little love"
                onClick={() =>
                  react(
                    mood === 'quiet'
                      ? 'A little nuzzle. No words needed.'
                      : 'A tiny hug? For me? Consider it returned.',
                  )
                }
              >
                <Cupidot2D state={botState} size={146} label="Cupidot" />
              </button>
              <h2 id="cupidot-title">A little time with Cupidot</h2>
              <p>{currentMood.welcome}</p>
            </header>
            <div className={styles.body}>
              <div
                className={styles.moods}
                role="group"
                aria-label="Choose a moment mood"
              >
                {MOODS.map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={mood === item.id}
                    onClick={() => changeMood(item.id)}
                  >
                    <span aria-hidden="true">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
              <section className={styles.moment} aria-label="Your moment">
                <span className={styles.eyebrow}>
                  {moment ? 'ONE SMALL INVITATION' : 'NO BIG PLANS REQUIRED'}
                </span>
                <h3>
                  {moment?.question ??
                    'A tiny adventure, a sweet thought, or a soft place to land?'}
                </h3>
                {moment ? (
                  <div
                    className={styles.options}
                    role="group"
                    aria-label="Your response"
                  >
                    {moment.options.map((option) => (
                      <button
                        key={option}
                        aria-pressed={selected === option}
                        onClick={() => {
                          setSelected(option);
                          react(
                            moment.reply,
                            mood === 'quiet' ? 'sleeping' : 'celebration',
                          );
                        }}
                      >
                        <span>{option}</span>
                        <span aria-hidden="true">
                          {selected === option ? '✓' : '↗'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>
                    Pick a mood or let me start with something playful. Every
                    invitation is optional.
                  </p>
                )}
                <p className={styles.reply} role="status" aria-live="polite">
                  {reaction ??
                    (selected
                      ? moment?.reply
                      : 'Take what fits. You can always skip.')}
                </p>
              </section>
              <button className={styles.primary} onClick={() => chooseMoment()}>
                {moment
                  ? selected
                    ? 'Another little moment'
                    : 'Try a different idea'
                  : 'Find us a little moment'}{' '}
                <span aria-hidden="true">✦</span>
              </button>
              {moment && (
                <p className={styles.privateNote}>
                  Just a conversation starter. Your choice isn’t saved or sent
                  to your partner.
                </p>
              )}
              <footer className={styles.footer}>
                <button
                  onClick={toggleVoice}
                  aria-label={`Cupidot voice: ${voiceMode}. Change voice mode`}
                >
                  {voiceMode === 'chirp'
                    ? '♪ Chirps'
                    : voiceMode === 'speech'
                      ? '♫ Read aloud'
                      : '♪ Muted'}
                </button>
                {voiceMode !== 'mute' && (
                  <button
                    onClick={() => replayCupidotSpeech()}
                    aria-label="Replay last spoken speech or chirp"
                    title="Replay last voice line"
                  >
                    ↻ Replay
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}>
                  That’s enough for now ♡
                </button>
              </footer>
              {mood === 'quiet' && (
                <p className={styles.privateNote}>
                  Quiet moments stay silent, whatever your voice setting.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

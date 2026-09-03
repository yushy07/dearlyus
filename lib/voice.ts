/**
 * Cupidot Voice & Speech Synthesis Engine
 * 
 * Provides:
 * 1. Cute procedural Animal Crossing / Celeste style phoneme audio chirps via Web Audio API.
 * 2. High-pitched, warm, playful Web Speech synthesis for reading court verdicts and debate penalties aloud.
 * 3. Reactive voice settings store (chirp / speech / mute).
 */

'use client';

export type VoiceMode = 'chirp' | 'speech' | 'mute';
export type VoiceMood = 'happy' | 'love' | 'thinking' | 'talking' | 'celebration';

const STORAGE_KEY = 'angie_cupidot_voice_mode';

let audioCtx: AudioContext | null = null;
let activeChirpTimers: NodeJS.Timeout[] = [];
let isSpeaking = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function getStoredVoiceMode(): VoiceMode {
  if (typeof window === 'undefined') return 'chirp';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as VoiceMode;
    if (saved === 'chirp' || saved === 'speech' || saved === 'mute') return saved;
  } catch {}
  return 'chirp';
}

export function setStoredVoiceMode(mode: VoiceMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent('angie_cupidot_voice_mode_changed', { detail: mode }));
  } catch {}
}

/**
 * Procedural Animal Crossing / Celeste style phoneme audio chirp
 */
function playSingleChirp(
  ctx: AudioContext,
  freq: number,
  duration = 0.055,
  mood: VoiceMood = 'talking',
  isEndPunctuation = false
) {
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Waveform: soft rounded triangle or sine with slight harmonics
    osc.type = mood === 'love' ? 'sine' : 'triangle';

    let targetFreq = freq;
    if (isEndPunctuation) {
      targetFreq *= 1.25; // Inflect upwards for questions/exclamations
    }

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(targetFreq, 100), now + duration);

    // Warm volume envelope
    const maxGain = mood === 'love' ? 0.09 : 0.07;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(maxGain, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch {}
}

/**
 * Plays a sequence of cute rhythm chirps matching syllables of text
 */
export function playCupidotChirps(
  text: string,
  mood: VoiceMood = 'talking',
  onComplete?: () => void
): void {
  stopCupidotSpeech();
  const ctx = getAudioContext();
  if (!ctx) {
    onComplete?.();
    return;
  }

  isSpeaking = true;
  const words = text.trim().split(/\s+/).slice(0, 16); // limit chirp count to avoid fatigue
  const baseFreqs: Record<VoiceMood, number> = {
    talking: 620,
    happy: 720,
    love: 680,
    thinking: 540,
    celebration: 800,
  };

  const baseFreq = baseFreqs[mood] || 620;
  let delayMs = 0;

  words.forEach((word, wordIndex) => {
    // Generate 1-2 chirps per word based on length
    const syllables = Math.min(Math.max(Math.floor(word.length / 3), 1), 2);
    for (let s = 0; s < syllables; s++) {
      const isLast = wordIndex === words.length - 1 && s === syllables - 1;
      const charCode = word.charCodeAt(s) || 100;
      // Slight pitch variance per phoneme
      const pitchOffset = ((charCode % 7) - 3) * 35;
      const freq = Math.max(380, baseFreq + pitchOffset);

      const timer = setTimeout(() => {
        if (!isSpeaking) return;
        const isPunctuation = /[?!]$/.test(word);
        playSingleChirp(ctx, freq, 0.05, mood, isPunctuation);
      }, delayMs);

      activeChirpTimers.push(timer);
      delayMs += 65 + (s === syllables - 1 ? 30 : 0);
    }
  });

  const finishTimer = setTimeout(() => {
    isSpeaking = false;
    onComplete?.();
  }, delayMs + 60);

  activeChirpTimers.push(finishTimer);
}

/**
 * Main Voice Coordinator: checks mode and speaks or chirps
 */
export function speakCupidot(
  text: string,
  options?: {
    mood?: VoiceMood;
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  const mode = getStoredVoiceMode();
  if (mode === 'mute') {
    options?.onEnd?.();
    return;
  }

  stopCupidotSpeech();

  if (mode === 'chirp') {
    options?.onStart?.();
    playCupidotChirps(text, options?.mood || 'talking', () => {
      options?.onEnd?.();
    });
    return;
  }

  // mode === 'speech': Web Speech API with cute high-pitch robotic voice
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.55; // Cute higher pitch for Cupidot
      utterance.rate = 1.12;  // Slightly energetic cadence
      utterance.volume = 0.9;

      // Select warm English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen')) && v.lang.startsWith('en')
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        isSpeaking = true;
        options?.onStart?.();
      };

      utterance.onend = () => {
        isSpeaking = false;
        options?.onEnd?.();
      };

      utterance.onerror = () => {
        isSpeaking = false;
        // Fallback to chirps if speech synthesis errors out
        playCupidotChirps(text, options?.mood || 'talking', options?.onEnd);
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // Fallback
    }
  }

  // Fallback to chirps
  options?.onStart?.();
  playCupidotChirps(text, options?.mood || 'talking', options?.onEnd);
}

/**
 * Cancels active speech or chirp trains
 */
export function stopCupidotSpeech(): void {
  isSpeaking = false;
  activeChirpTimers.forEach((t) => clearTimeout(t));
  activeChirpTimers = [];
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Returns whether Cupidot is currently speaking or chirping
 */
export function isCupidotSpeaking(): boolean {
  return isSpeaking;
}

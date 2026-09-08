/**
 * Cupidot Voice & Speech Synthesis Engine
 *
 * Provides:
 * 1. Procedural Animal Crossing / Celeste retro synth chirps with rich emotions:
 *    - Cute happy / love chirps (sweet sine/triangle harmonics)
 *    - Angry robot tantrum (buzzing staccato sawtooth with frustrated growls)
 *    - Sassy / dramatic teasing (octave leaps, cheeky pitch slides)
 *    - Shocked / surprised (instant ascending whistle glissando)
 *    - Pouty / dejected (downward melancholic slide)
 * 2. Emotional Web Speech Synthesis with dynamic pitch, cadence, and inflection.
 * 3. Reactive voice settings store (chirp / speech / mute).
 */

'use client';

export type VoiceMode = 'chirp' | 'speech' | 'mute';
export type VoiceMood =
  | 'happy'
  | 'love'
  | 'thinking'
  | 'talking'
  | 'celebration'
  | 'angry'
  | 'sassy'
  | 'shock'
  | 'pouty'
  | 'tweaking';

export interface CupidotCaption {
  text: string;
  mood: VoiceMood;
  isSpeaking: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'dearly_cupidot_voice_mode';
const QUIET_HOURS_STORAGE_KEY = 'dearly_cupidot_quiet_hours_enabled';

let audioCtx: AudioContext | null = null;
let activeChirpTimers: NodeJS.Timeout[] = [];
let isSpeaking = false;
let isRecordingAudio = false;
let currentCaption: CupidotCaption | null = null;
const captionListeners = new Set<(caption: CupidotCaption) => void>();

let lastSpokenUtterance: {
  text: string;
  options?: {
    mood?: VoiceMood;
    onStart?: () => void;
    onEnd?: () => void;
  };
} | null = null;

export function isAudioRecordingActive(): boolean {
  return isRecordingAudio;
}

export function setAudioRecordingActive(active: boolean): void {
  isRecordingAudio = Boolean(active);
  if (isRecordingAudio && isSpeaking) {
    stopCupidotSpeech();
  }
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

export function getQuietHoursEnabled(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    return storage.getItem(QUIET_HOURS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setQuietHoursEnabled(enabled: boolean): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(QUIET_HOURS_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export const QUIET_HOURS_START_KEY = 'dearly_quiet_hours_start';
export const QUIET_HOURS_END_KEY = 'dearly_quiet_hours_end';

export function getQuietHoursWindow(): { start: string; end: string } {
  const storage = getStorage();
  if (!storage) return { start: '22:00', end: '08:00' };
  try {
    return {
      start: storage.getItem(QUIET_HOURS_START_KEY) || '22:00',
      end: storage.getItem(QUIET_HOURS_END_KEY) || '08:00',
    };
  } catch {
    return { start: '22:00', end: '08:00' };
  }
}

export function setQuietHoursWindow(start: string, end: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(QUIET_HOURS_START_KEY, start);
    storage.setItem(QUIET_HOURS_END_KEY, end);
  } catch {}
}

export function isQuietHoursActive(): boolean {
  if (!getQuietHoursEnabled()) return false;
  const { start, end } = getQuietHoursWindow();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = (start || '22:00').split(':').map(Number);
  const [endH, endM] = (end || '08:00').split(':').map(Number);
  const startMinutes = (isNaN(startH) ? 22 : startH) * 60 + (isNaN(startM) ? 0 : startM);
  const endMinutes = (isNaN(endH) ? 8 : endH) * 60 + (isNaN(endM) ? 0 : endM);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window (e.g. 22:00 to 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

export function getCurrentCupidotCaption(): CupidotCaption | null {
  return currentCaption;
}

function emitCaption(caption: CupidotCaption): void {
  currentCaption = caption;
  captionListeners.forEach((l) => {
    try {
      l(caption);
    } catch (err) {
      console.error('[CupidotVoice] Caption listener error:', err);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dearly_cupidot_caption', { detail: caption }),
    );
  }
}

export function onCupidotCaption(
  listener: (caption: CupidotCaption) => void,
): () => void {
  captionListeners.add(listener);
  if (currentCaption) {
    listener(currentCaption);
  }
  return () => {
    captionListeners.delete(listener);
  };
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
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
    if (saved === 'chirp' || saved === 'speech' || saved === 'mute')
      return saved;
  } catch {}
  return 'chirp';
}

export function setStoredVoiceMode(mode: VoiceMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(
      new CustomEvent('dearly_cupidot_voice_mode_changed', { detail: mode }),
    );
  } catch {}
}

/**
 * Procedural Emotional Audio Chirp Synthesizer
 */
function playSingleChirp(
  ctx: AudioContext,
  freq: number,
  duration = 0.055,
  mood: VoiceMood = 'talking',
  isEndPunctuation = false,
) {
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Waveform & Timbre modulation based on emotion
    if (mood === 'angry') {
      // Grumpy buzzing sawtooth or distorted triangle
      osc.type = 'sawtooth';
    } else if (mood === 'love' || mood === 'pouty') {
      osc.type = 'sine';
    } else if (mood === 'shock' || mood === 'tweaking') {
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
    } else {
      osc.type = 'triangle';
    }

    let targetFreq = freq;

    if (mood === 'angry') {
      // Aggressive downward growl or sharp frustrated bounce
      targetFreq = isEndPunctuation ? freq * 0.75 : freq * 1.15;
    } else if (mood === 'shock') {
      // High-pitched ascending exclamation
      targetFreq = freq * 1.6;
    } else if (mood === 'pouty') {
      // Sad dejected slide down
      targetFreq = freq * 0.82;
    } else if (mood === 'sassy') {
      // Cheeky alternating bounce
      targetFreq = isEndPunctuation ? freq * 1.4 : freq * 0.9;
    } else if (isEndPunctuation) {
      targetFreq = freq * 1.25;
    }

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(targetFreq, 80),
      now + duration,
    );

    // Gain envelope tailored to emotional intensity
    let maxGain = 0.07;
    let attackTime = 0.006;

    if (mood === 'angry') {
      maxGain = 0.09;
      attackTime = 0.002; // instant sharp punch
    } else if (mood === 'love') {
      maxGain = 0.085;
      attackTime = 0.012; // warm gentle swell
    } else if (mood === 'pouty') {
      maxGain = 0.05;
      attackTime = 0.015;
    } else if (mood === 'shock' || mood === 'tweaking') {
      maxGain = 0.1;
      attackTime = 0.002;
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(maxGain, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Filter for softening harsh harmonics
    const filter = ctx.createBiquadFilter();
    filter.type = mood === 'angry' ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(mood === 'angry' ? 2200 : 3200, now);
    filter.Q.setValueAtTime(mood === 'angry' ? 2.5 : 1.2, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch {}
}

/**
 * Plays a sequence of cute emotional chirps matching syllables of text
 */
export function playCupidotChirps(
  text: string,
  mood: VoiceMood = 'talking',
  onComplete?: () => void,
): void {
  stopCupidotSpeech();
  const ctx = getAudioContext();
  if (!ctx) {
    emitCaption({ text, mood, isSpeaking: false, timestamp: Date.now() });
    onComplete?.();
    return;
  }

  isSpeaking = true;
  const words = text.trim().split(/\s+/).slice(0, 18);

  // Emotional base frequencies (in Hz)
  const baseFreqs: Record<VoiceMood, number> = {
    talking: 620,
    happy: 740,
    love: 660,
    thinking: 520,
    celebration: 820,
    angry: 380, // lower, grumbly robot growls
    sassy: 680,
    shock: 920, // squeaky high pitch
    pouty: 460, // dejected low sigh
    tweaking: 780, // hyperactive erratic pitch
  };

  const baseFreq = baseFreqs[mood] || 620;
  let delayMs = 0;

  // Emotional cadence pacing
  const wordPacing: Record<VoiceMood, number> = {
    angry: 48, // rapid, frustrated burst
    tweaking: 42, // hyperactive panic
    shock: 55,
    happy: 65,
    talking: 68,
    sassy: 72,
    love: 85, // warm, lingering
    thinking: 95, // slow, contemplative
    celebration: 60,
    pouty: 100, // slow, sulking
  };

  const pace = wordPacing[mood] || 65;

  words.forEach((word, wordIndex) => {
    const syllables = Math.min(Math.max(Math.floor(word.length / 3), 1), 3);
    for (let s = 0; s < syllables; s++) {
      const isLast = wordIndex === words.length - 1 && s === syllables - 1;
      const charCode = word.charCodeAt(s) || 100;

      let pitchOffset = ((charCode % 7) - 3) * 40;

      // Mood-specific pitch anomalies
      if (mood === 'angry') {
        // Alternates between grumpy low buzz and indignant high squeak
        pitchOffset = s % 2 === 0 ? -90 : 110;
      } else if (mood === 'shock') {
        pitchOffset = 180 + s * 60;
      } else if (mood === 'pouty') {
        pitchOffset = -60 - s * 40;
      } else if (mood === 'tweaking') {
        pitchOffset = (Math.random() - 0.5) * 280;
      }

      const freq = Math.max(220, baseFreq + pitchOffset);
      const chirpDuration =
        mood === 'angry' || mood === 'tweaking' ? 0.042 : 0.058;

      const timer = setTimeout(() => {
        if (!isSpeaking) return;
        const isPunctuation = /[?!]$/.test(word);
        playSingleChirp(ctx, freq, chirpDuration, mood, isPunctuation);
      }, delayMs);

      activeChirpTimers.push(timer);
      delayMs += pace + (s === syllables - 1 ? 25 : 0);
    }
  });

  const finishTimer = setTimeout(() => {
    isSpeaking = false;
    emitCaption({ text, mood, isSpeaking: false, timestamp: Date.now() });
    onComplete?.();
  }, delayMs + 70);

  activeChirpTimers.push(finishTimer);
}

/**
 * Main Voice Coordinator: checks mode and speaks with emotional inflection.
 * Universally dispatches live caption events so text subtitles and bot bubbles
 * remain in sync even if muted, during quiet hours, or when audio recording is active.
 */
export function speakCupidot(
  text: string,
  options?: {
    mood?: VoiceMood;
    onStart?: () => void;
    onEnd?: () => void;
  },
): void {
  const mode = getStoredVoiceMode();
  const mood = options?.mood || 'talking';

  // Cache last utterance for replay
  lastSpokenUtterance = { text, options };

  stopCupidotSpeech();

  // Check audio suppression: mute setting, active letter/audio recording, or quiet hours
  const isSuppressed =
    mode === 'mute' || isRecordingAudio || isQuietHoursActive();

  if (isSuppressed) {
    // Universal live caption dispatch: show captions even without audible playback
    emitCaption({ text, mood, isSpeaking: true, timestamp: Date.now() });
    options?.onStart?.();

    const readingDuration = Math.min(Math.max(text.length * 45, 1200), 4000);
    const captionTimer = setTimeout(() => {
      emitCaption({ text, mood, isSpeaking: false, timestamp: Date.now() });
      options?.onEnd?.();
    }, readingDuration);

    activeChirpTimers.push(captionTimer);
    return;
  }

  emitCaption({ text, mood, isSpeaking: true, timestamp: Date.now() });

  if (mode === 'chirp') {
    options?.onStart?.();
    playCupidotChirps(text, mood, () => {
      options?.onEnd?.();
    });
    return;
  }

  // mode === 'speech': Web Speech API with rich emotional modulation
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Emotion-dependent pitch and cadence profiles
      switch (mood) {
        case 'angry':
          // Feisty chipmunk tantrum: sharp, fast, indignant
          utterance.pitch = 1.75;
          utterance.rate = 1.32;
          utterance.volume = 1.0;
          break;
        case 'sassy':
          // Cheeky, dramatic, confident
          utterance.pitch = 1.62;
          utterance.rate = 1.22;
          utterance.volume = 0.95;
          break;
        case 'shock':
          // Astonished, high-pitched gasp
          utterance.pitch = 1.9;
          utterance.rate = 1.38;
          utterance.volume = 1.0;
          break;
        case 'pouty':
          // Sulking, slower dejected cadence
          utterance.pitch = 1.25;
          utterance.rate = 0.88;
          utterance.volume = 0.8;
          break;
        case 'love':
          // Warm, melodic, tender
          utterance.pitch = 1.42;
          utterance.rate = 1.02;
          utterance.volume = 0.95;
          break;
        case 'celebration':
          utterance.pitch = 1.68;
          utterance.rate = 1.22;
          utterance.volume = 1.0;
          break;
        case 'thinking':
          utterance.pitch = 1.3;
          utterance.rate = 0.95;
          utterance.volume = 0.85;
          break;
        case 'tweaking':
          utterance.pitch = 1.82;
          utterance.rate = 1.4;
          utterance.volume = 1.0;
          break;
        case 'happy':
        case 'talking':
        default:
          utterance.pitch = 1.55;
          utterance.rate = 1.15;
          utterance.volume = 0.9;
          break;
      }

      // Voice selection
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria')) &&
          v.lang.startsWith('en'),
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        isSpeaking = true;
        emitCaption({ text, mood, isSpeaking: true, timestamp: Date.now() });
        options?.onStart?.();
      };

      utterance.onend = () => {
        isSpeaking = false;
        emitCaption({ text, mood, isSpeaking: false, timestamp: Date.now() });
        options?.onEnd?.();
      };

      utterance.onerror = () => {
        isSpeaking = false;
        emitCaption({ text, mood, isSpeaking: false, timestamp: Date.now() });
        playCupidotChirps(text, mood, options?.onEnd);
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // Fallback to chirps
    }
  }

  // Fallback to chirps
  options?.onStart?.();
  playCupidotChirps(text, mood, options?.onEnd);
}

/**
 * Replays the last spoken Cupidot utterance
 */
export function replayCupidotSpeech(): void {
  if (!lastSpokenUtterance) return;
  speakCupidot(lastSpokenUtterance.text, lastSpokenUtterance.options);
}

/**
 * Cancels active speech or chirp trains
 */
export function stopCupidotSpeech(): void {
  if (currentCaption?.isSpeaking) {
    emitCaption({
      ...currentCaption,
      isSpeaking: false,
      timestamp: Date.now(),
    });
  }
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

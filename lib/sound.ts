// Procedural Sound Synthesizer & Multi-Track Ambient Soundscape Mixer using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private ambientNodes: { [key: string]: { source: AudioNode; gain: GainNode } } = {};
  private isLofiPlaying = false;
  private lofiTimer: NodeJS.Timeout | null = null;
  private bgAudio: HTMLAudioElement | null = null;
  public isBgPlaying = false;
  private bgInitialized = false;

  private sleepTimerId: NodeJS.Timeout | null = null;
  private sleepTimerEnd: number | null = null;
  private sleepTimerTicker: NodeJS.Timeout | null = null;
  public sleepTimerMinutes: number | null = null;

  // Background audio (background.mp3) played on page load until radio mixer interaction
  public startBackgroundMusic(volume = 0.3) {
    if (typeof window === 'undefined') return;
    try {
      if (!this.bgAudio) {
        this.bgAudio = new Audio('/audio/background.mp3');
        this.bgAudio.loop = true;
      }
      this.bgAudio.volume = Math.min(Math.max(volume, 0), 1);
      const playPromise = this.bgAudio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            this.isBgPlaying = true;
          })
          .catch(() => {
            this.isBgPlaying = false;
          });
      }
    } catch {}
  }

  public stopBackgroundMusic() {
    this.isBgPlaying = false;
    if (this.bgAudio) {
      try {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
      } catch {}
    }
  }

  public autoStartBackgroundMusic(volume = 0.3) {
    if (typeof window === 'undefined' || this.bgInitialized) return;
    this.bgInitialized = true;

    try {
      if (!this.bgAudio) {
        this.bgAudio = new Audio('/audio/background.mp3');
        this.bgAudio.loop = true;
      }
      this.bgAudio.volume = Math.min(Math.max(volume, 0), 1);
      const playPromise = this.bgAudio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            this.isBgPlaying = true;
          })
          .catch(() => {
            // Autoplay restricted by browser - start immediately on first user touch/click/keypress
            const startOnInteraction = () => {
              if (!this.isBgPlaying && !this.isLofiPlaying && this.bgAudio) {
                this.bgAudio.play().then(() => {
                  this.isBgPlaying = true;
                }).catch(() => {});
              }
              document.removeEventListener('pointerdown', startOnInteraction);
              document.removeEventListener('keydown', startOnInteraction);
              document.removeEventListener('touchstart', startOnInteraction);
            };

            document.addEventListener('pointerdown', startOnInteraction, { once: true });
            document.addEventListener('keydown', startOnInteraction, { once: true });
            document.addEventListener('touchstart', startOnInteraction, { once: true });
          });
      }
    } catch {}
  }

  // Sleep Timer with smooth volume ramp-down in the last 60 seconds
  public setSleepTimer(minutes: number, onTick?: (secondsLeft: number) => void, onComplete?: () => void) {
    this.clearSleepTimer();
    if (minutes <= 0) return;

    this.sleepTimerMinutes = minutes;
    const totalMs = minutes * 60 * 1000;
    this.sleepTimerEnd = Date.now() + totalMs;

    this.sleepTimerTicker = setInterval(() => {
      const remainingSec = this.getSleepTimerRemaining();
      if (onTick) onTick(remainingSec);

      // Smooth gradual fade in the final 60 seconds
      if (remainingSec <= 60 && remainingSec > 0) {
        const factor = Math.max(remainingSec / 60, 0.05);
        if (this.warmAudio) this.warmAudio.volume = Math.min(0.4 * factor, 1);
        if (this.romanticAudio) this.romanticAudio.volume = Math.min(0.35 * factor, 1);
        if (this.pianoAudio) this.pianoAudio.volume = Math.min(0.35 * factor, 1);
        if (this.jazzAudio) this.jazzAudio.volume = Math.min(0.3 * factor, 1);
        if (this.bgAudio) this.bgAudio.volume = Math.min(0.3 * factor, 1);
      }

      if (remainingSec <= 0) {
        this.clearSleepTimer();
        this.stopAllAmbience();
        this.stopBackgroundMusic();
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  public clearSleepTimer() {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    if (this.sleepTimerTicker) {
      clearInterval(this.sleepTimerTicker);
      this.sleepTimerTicker = null;
    }
    this.sleepTimerEnd = null;
    this.sleepTimerMinutes = null;
  }

  public getSleepTimerRemaining(): number {
    if (!this.sleepTimerEnd) return 0;
    const diff = Math.max(0, Math.floor((this.sleepTimerEnd - Date.now()) / 1000));
    return diff;
  }

  // Stamp Thud: Mechanical heavy rubber stamp pressing into paper
  public playStampThud() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.17);

    // High frequency paper tap slap
    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'triangle';
    tapOsc.frequency.setValueAtTime(480, ctx.currentTime);
    tapOsc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);
    tapGain.gain.setValueAtTime(0.2, ctx.currentTime);
    tapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    tapOsc.connect(tapGain);
    tapGain.connect(ctx.destination);
    tapOsc.start();
    tapOsc.stop(ctx.currentTime + 0.06);
  }

  // Reaction Sparkle Pop Chime
  public playSparkleReaction(emoji = '✨') {
    const ctx = this.getContext();
    if (!ctx) return;

    const baseFreq = emoji === '💖' ? 523.25 : emoji === '💋' ? 659.25 : emoji === '☕' ? 392.0 : 783.99;
    [0, 4, 7, 12].forEach((interval, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = baseFreq * Math.pow(2, interval / 12);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.035);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.035 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.035);
      osc.stop(ctx.currentTime + idx * 0.035 + 0.3);
    });
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Camera shutter mechanical snap sound
  public playShutter() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  // 3..2..1 Countdown pitch beep
  public playCountdownBeep(isZero = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = isZero ? 880 : 440;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  // Heartbeat pulse sound effect
  public playHeartbeat() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  // Confetti / win celebration harmonic chord
  public playCelebration() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.45);
    });
  }

  // --- MICRO-HAPTIC SOUND SYNTHESIS ---

  // 1. Soft bubble pop for pills, filters, and light clicks
  public playPop() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // 2. Crisp wooden tick for button presses & switches
  public playTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  }

  // 3. Affirmative two-tone lock-in sound for quiz choices
  public playLock() {
    const ctx = this.getContext();
    if (!ctx) return;

    [440, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + i * 0.04 + 0.14);
    });
  }

  // 4. Harmonic chime sparkle on answer reveal / card match
  public playChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    [587.33, 739.99, 880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.38);
    });
  }

  // 5. Card swipe whoosh
  public playSwipe() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }



  // Procedural Noise Buffer Generator
  private createNoiseBuffer(durationSeconds = 3): AudioBuffer | null {
    const ctx = this.getContext();
    if (!ctx) return null;
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private warmAudio: HTMLAudioElement | null = null;

  // 1. Warm Ambience Track (warm.mp3)
  public startWarm(volume = 0.4) {
    if (typeof window !== 'undefined') {
      try {
        if (!this.warmAudio) {
          this.warmAudio = new Audio('/audio/warm.mp3');
          this.warmAudio.loop = true;
        }
        this.warmAudio.volume = Math.min(Math.max(volume, 0), 1);
        const playPromise = this.warmAudio.play();
        if (playPromise) {
          playPromise.catch(() => {});
        }
        return;
      } catch {}
    }
  }

  public stopWarm() {
    if (this.warmAudio) {
      try {
        this.warmAudio.pause();
        this.warmAudio.currentTime = 0;
      } catch {}
    }
  }

  // Aliases for backward compatibility
  public startRain(volume = 0.4) {
    this.startWarm(volume);
  }

  public stopRain() {
    this.stopWarm();
  }

  public toggleRainSound(active: boolean, volume = 0.4) {
    if (active) {
      this.startWarm(volume);
    } else {
      this.stopWarm();
    }
  }

  public toggleWarmSound(active: boolean, volume = 0.4) {
    if (active) {
      this.startWarm(volume);
    } else {
      this.stopWarm();
    }
  }

  public toggleFireplaceSound(active: boolean, volume = 0.3) {
    if (active) {
      this.startFireplace(volume);
    } else {
      this.stopFireplace();
    }
  }

  private romanticAudio: HTMLAudioElement | null = null;

  // 2. Romantic Serenade Track (romantic.mp3)
  public startRomantic(volume = 0.35) {
    if (typeof window !== 'undefined') {
      try {
        if (!this.romanticAudio) {
          this.romanticAudio = new Audio('/audio/romantic.mp3');
          this.romanticAudio.loop = true;
        }
        this.romanticAudio.volume = Math.min(Math.max(volume, 0), 1);
        const playPromise = this.romanticAudio.play();
        if (playPromise) {
          playPromise.catch(() => {});
        }
        return;
      } catch {}
    }
  }

  public stopRomantic() {
    if (this.romanticAudio) {
      try {
        this.romanticAudio.pause();
        this.romanticAudio.currentTime = 0;
      } catch {}
    }
  }

  // Aliases for backward compatibility
  public startFireplace(volume = 0.35) {
    this.startRomantic(volume);
  }

  public stopFireplace() {
    this.stopRomantic();
  }

  private pianoAudio: HTMLAudioElement | null = null;

  // 3. Cozy Piano Track (piano.mp3)
  public startPiano(volume = 0.35) {
    if (typeof window !== 'undefined') {
      try {
        if (!this.pianoAudio) {
          this.pianoAudio = new Audio('/audio/piano.mp3');
          this.pianoAudio.loop = true;
        }
        this.pianoAudio.volume = Math.min(Math.max(volume, 0), 1);
        const playPromise = this.pianoAudio.play();
        if (playPromise) {
          playPromise.catch(() => {});
        }
        return;
      } catch {}
    }
  }

  public stopPiano() {
    if (this.pianoAudio) {
      try {
        this.pianoAudio.pause();
        this.pianoAudio.currentTime = 0;
      } catch {}
    }
  }

  // --- ANALOG VINYL NEEDLE & GROOVE SYNTHESIS ---
  private vinylCrackleSource: AudioBufferSourceNode | null = null;
  private vinylCrackleGain: GainNode | null = null;
  public isVinylCrackleActive = false;

  // Realistic needle-drop contact sound: mechanical low thump + friction scrape
  public playNeedleDrop() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Stylus contact thump: resonant low-frequency impact
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.14);

    oscGain.gain.setValueAtTime(0.32, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // 2. Micro surface friction scratch (high-pass bandpass noise pulse)
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.2);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const isTransient = Math.random() < 0.05;
        output[i] = (Math.random() * 2 - 1) * (isTransient ? 0.9 : 0.07);
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now + 0.02);
    } catch {}
  }

  // Stylus lift sound: gentle upward pop
  public playNeedleLift() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Continuous subtle analog vinyl crackle & surface noise loop
  public startVinylCrackle(volume = 0.06) {
    const ctx = this.getContext();
    if (!ctx || this.isVinylCrackleActive) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 2.5); // 2.5s loop
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        // Filtered pink noise baseline
        const white = Math.random() * 2 - 1;
        const pink = (lastOut + 0.02 * white) / 1.02;
        lastOut = pink;

        // Occasional microscopic dust pops
        const pop = Math.random() < 0.0006 ? (Math.random() * 2 - 1) * 0.8 : 0;
        data[i] = pink * 0.12 + pop;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1700, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.9, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(Math.min(volume, 0.15), ctx.currentTime + 0.4);

      source.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      this.vinylCrackleSource = source;
      this.vinylCrackleGain = gain;
      this.isVinylCrackleActive = true;
    } catch {}
  }

  public stopVinylCrackle() {
    if (!this.isVinylCrackleActive) return;
    this.isVinylCrackleActive = false;
    if (this.vinylCrackleGain && this.ctx) {
      try {
        this.vinylCrackleGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
        setTimeout(() => {
          if (this.vinylCrackleSource) {
            try { this.vinylCrackleSource.stop(); } catch {}
            this.vinylCrackleSource.disconnect();
            this.vinylCrackleSource = null;
          }
          if (this.vinylCrackleGain) {
            this.vinylCrackleGain.disconnect();
            this.vinylCrackleGain = null;
          }
        }, 220);
      } catch {}
    }
  }

  // Alias for backward compatibility
  public startVinyl(volume = 0.35) {
    this.startPiano(volume);
    this.startVinylCrackle(0.05);
  }

  public stopVinyl() {
    this.stopPiano();
    this.stopVinylCrackle();
  }

  private jazzAudio: HTMLAudioElement | null = null;

  // 4. Tokyo Cafe Jazz Track (jazz.mp3)
  public startTokyoCafe(volume = 0.3) {
    if (this.isLofiPlaying) {
      if (this.jazzAudio) {
        this.jazzAudio.volume = Math.min(Math.max(volume, 0), 1);
      }
      return;
    }
    this.isLofiPlaying = true;

    if (typeof window !== 'undefined') {
      try {
        if (!this.jazzAudio) {
          this.jazzAudio = new Audio('/audio/jazz.mp3');
          this.jazzAudio.loop = true;
        }
        this.jazzAudio.volume = Math.min(Math.max(volume, 0), 1);
        const playPromise = this.jazzAudio.play();
        if (playPromise) {
          playPromise.catch(() => {
            this.startProceduralLofi(volume);
          });
        }
        return;
      } catch {
        this.startProceduralLofi(volume);
        return;
      }
    }
    this.startProceduralLofi(volume);
  }

  public stopTokyoCafe() {
    this.isLofiPlaying = false;
    if (this.jazzAudio) {
      try {
        this.jazzAudio.pause();
        this.jazzAudio.currentTime = 0;
      } catch {}
    }
    if (this.lofiTimer) {
      clearTimeout(this.lofiTimer);
      this.lofiTimer = null;
    }
  }

  // Aliases for backward compatibility
  public startLofiChords(volume = 0.3) {
    this.startTokyoCafe(volume);
  }

  public stopLofiChords() {
    this.stopTokyoCafe();
  }

  public startJazz(volume = 0.3) {
    this.startTokyoCafe(volume);
  }

  public stopJazz() {
    this.stopTokyoCafe();
  }

  // Fallback procedural lo-fi chords synthesizer
  private startProceduralLofi(volume = 0.2) {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (!this.isLofiPlaying) return;
      const curCtx = this.getContext();
      if (!curCtx) return;

      const chord = chords[chordIdx % chords.length];
      chord.forEach((freq) => {
        const osc = curCtx.createOscillator();
        const g = curCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, curCtx.currentTime);

        g.gain.setValueAtTime(volume * 0.2, curCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, curCtx.currentTime + 3.8);

        osc.connect(g);
        g.connect(curCtx.destination);

        osc.start(curCtx.currentTime);
        osc.stop(curCtx.currentTime + 4.0);
      });

      chordIdx++;
      this.lofiTimer = setTimeout(playNextChord, 4000);
    };

    playNextChord();
  }

  // --- PROCEDURAL TACTILE SOUND SYNTHESIS ---

  // Thermal dot-matrix printer stepper burst
  public playThermalPrinter() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 14; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = now + i * 0.04;
        osc.type = i % 2 === 0 ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(1400 + (i % 4) * 250, time);
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.028);
      }
    } catch {}
  }

  // Serrated paper cutter tear sound
  public playPaperTear() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const dur = 0.16;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(750, now + dur);
      filter.Q.setValueAtTime(2.5, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {}
  }

  // 3D Wax seal fracture and snap
  public playWaxCrack() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // High snap
      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'triangle';
      snap.frequency.setValueAtTime(2400, now);
      snap.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      snapGain.gain.setValueAtTime(0.25, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      snap.connect(snapGain);
      snapGain.connect(ctx.destination);
      snap.start(now);
      snap.stop(now + 0.09);

      // Low contact thud
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(140, now);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      thudGain.gain.setValueAtTime(0.3, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      thud.connect(thudGain);
      thudGain.connect(ctx.destination);
      thud.start(now);
      thud.stop(now + 0.14);
    } catch {}
  }

  // Heavy parchment paper unfolding rustle
  public playParchmentUnfold() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const dur = 0.28;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.linearRampToValueAtTime(1800, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(500, now + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {}
  }

  // Coin silver foil scratch texture
  public playCoinScratch() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const dur = 0.09;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3400 + Math.random() * 400, now);
      filter.Q.setValueAtTime(4, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {}
  }

  public stopAllAmbience() {
    this.stopWarm();
    this.stopRain();
    this.stopRomantic();
    this.stopFireplace();
    this.stopPiano();
    this.stopVinyl();
    this.stopLofiChords();
  }
}

export const sounds = new SoundManager();

// Procedural Sound Synthesizer & Multi-Track Ambient Soundscape Mixer using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private ambientNodes: { [key: string]: { source: AudioNode; gain: GainNode } } = {};
  private isLofiPlaying = false;
  private lofiTimer: NodeJS.Timeout | null = null;

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

  // 6. Wax seal fracturing snap
  public playWaxCrack() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
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

  // Alias for backward compatibility
  public startVinyl(volume = 0.35) {
    this.startPiano(volume);
  }

  public stopVinyl() {
    this.stopPiano();
  }

  private lofiAudio: HTMLAudioElement | null = null;

  // 4. Lo-Fi Chords Audio Track (lofi.mp3 with procedural fallback)
  public startLofiChords(volume = 0.3) {
    if (this.isLofiPlaying) {
      if (this.lofiAudio) {
        this.lofiAudio.volume = Math.min(Math.max(volume, 0), 1);
      }
      return;
    }
    this.isLofiPlaying = true;

    if (typeof window !== 'undefined') {
      try {
        if (!this.lofiAudio) {
          this.lofiAudio = new Audio('/audio/lofi.mp3');
          this.lofiAudio.loop = true;
        }
        this.lofiAudio.volume = Math.min(Math.max(volume, 0), 1);
        const playPromise = this.lofiAudio.play();
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

  public stopLofiChords() {
    this.isLofiPlaying = false;
    if (this.lofiAudio) {
      try {
        this.lofiAudio.pause();
        this.lofiAudio.currentTime = 0;
      } catch {}
    }
    if (this.lofiTimer) {
      clearTimeout(this.lofiTimer);
      this.lofiTimer = null;
    }
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

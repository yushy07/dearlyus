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
      this.ctx.resume();
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

  // 1. Rain on Window Synthesizer
  public startRain(volume = 0.4) {
    if (this.ambientNodes['rain']) {
      this.ambientNodes['rain'].gain.gain.setValueAtTime(volume, this.getContext()?.currentTime || 0);
      return;
    }
    const ctx = this.getContext();
    if (!ctx) return;

    const buffer = this.createNoiseBuffer(5);
    if (!buffer) return;

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
    this.ambientNodes['rain'] = { source: whiteNoise, gain };
  }

  public stopRain() {
    if (this.ambientNodes['rain']) {
      (this.ambientNodes['rain'].source as AudioScheduledSourceNode).stop();
      delete this.ambientNodes['rain'];
    }
  }

  // 2. Cozy Fireplace Synthesizer
  public startFireplace(volume = 0.3) {
    if (this.ambientNodes['fireplace']) {
      this.ambientNodes['fireplace'].gain.gain.setValueAtTime(volume, this.getContext()?.currentTime || 0);
      return;
    }
    const ctx = this.getContext();
    if (!ctx) return;

    const buffer = this.createNoiseBuffer(4);
    if (!buffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    this.ambientNodes['fireplace'] = { source: noise, gain };
  }

  public stopFireplace() {
    if (this.ambientNodes['fireplace']) {
      (this.ambientNodes['fireplace'].source as AudioScheduledSourceNode).stop();
      delete this.ambientNodes['fireplace'];
    }
  }

  // 3. 90s Vinyl Needle Crackle Synthesizer
  public startVinyl(volume = 0.25) {
    if (this.ambientNodes['vinyl']) {
      this.ambientNodes['vinyl'].gain.gain.setValueAtTime(volume, this.getContext()?.currentTime || 0);
      return;
    }
    const ctx = this.getContext();
    if (!ctx) return;

    const buffer = this.createNoiseBuffer(2);
    if (!buffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    this.ambientNodes['vinyl'] = { source: noise, gain };
  }

  public stopVinyl() {
    if (this.ambientNodes['vinyl']) {
      (this.ambientNodes['vinyl'].source as AudioScheduledSourceNode).stop();
      delete this.ambientNodes['vinyl'];
    }
  }

  // 4. Procedural Lo-Fi Chords
  public startLofiChords(volume = 0.2) {
    if (this.isLofiPlaying) return;
    this.isLofiPlaying = true;
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

  public stopLofiChords() {
    this.isLofiPlaying = false;
    if (this.lofiTimer) {
      clearTimeout(this.lofiTimer);
      this.lofiTimer = null;
    }
  }

  public stopAllAmbience() {
    this.stopRain();
    this.stopFireplace();
    this.stopVinyl();
    this.stopLofiChords();
  }
}

export const sounds = new SoundManager();

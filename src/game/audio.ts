/**
 * Procedural Web Audio synthesizer for Cubiverse 3D.
 * 100% code-synthesized: zero external mp3/wav files (zero 404 dependencies).
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientTimer: number | null = null;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.startAmbientDrone();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Procedural sound when block rolls and hits ground.
   * Standing has a heavier, deeper thud; flat has a double tap clatter.
   */
  public playRoll(isStanding: boolean) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isStanding ? 280 : 380, t);
    filter.Q.setValueAtTime(3, t);

    osc.type = isStanding ? 'sine' : 'triangle';
    const startFreq = isStanding ? 140 : 180;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + (isStanding ? 0.12 : 0.08));

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(isStanding ? 0.35 : 0.22, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (isStanding ? 0.14 : 0.09));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + (isStanding ? 0.15 : 0.1));

    // For flat roll, add a subtle secondary click for weight distribution
    if (!isStanding) {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(260, t + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(60, t + 0.08);

      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.setValueAtTime(0.001, t + 0.03);
      gain2.gain.linearRampToValueAtTime(0.12, t + 0.035);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t + 0.03);
      osc2.stop(t + 0.09);
    }
  }

  /**
   * Sound for activating a pressure switch.
   */
  public playSwitch(isHeavy: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const baseFreq = isHeavy ? 330 : 523.25; // E4 or C5

    [0, 0.08].forEach((delay, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isHeavy ? 'triangle' : 'sine';
      const freq = baseFreq * (idx === 0 ? 1 : 1.5); // Fifth
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.001, t + delay);
      gain.gain.linearRampToValueAtTime(0.2, t + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.28);
    });
  }

  /**
   * Sound when energy bridges toggle / materialize.
   */
  public playBridge() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.22);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  /**
   * Sound when fragile floor shatters under excessive pressure.
   */
  public playFragileCrack() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Noise buffer for shattering glass / rock
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  /**
   * Falling into cosmic void.
   */
  public playFall() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.7);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.72);
  }

  /**
   * Splitting into 2 cubes.
   */
  public playSplit() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    [440, 660, 880].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.001, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.2);
    });
  }

  /**
   * Re-fusing cubes back together.
   */
  public playFuse() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    [880, 587.33, 440].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.001, t + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.16, t + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.04 + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.25);
    });
  }

  /**
   * Toggling active split cube.
   */
  public playSwitchCube() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(680, t + 0.07);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Level Complete Victory Fanfare.
   */
  public playVictory() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 440.0, delay: 0.0 },     // A4
      { freq: 554.37, delay: 0.12 },   // C#5
      { freq: 659.25, delay: 0.24 },   // E5
      { freq: 880.0, delay: 0.38 },    // A5
      { freq: 1108.73, delay: 0.54 },  // C#6
    ];

    notes.forEach((n, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(n.freq, t + n.delay);

      const dur = i === notes.length - 1 ? 0.9 : 0.3;
      gain.gain.setValueAtTime(0.001, t + n.delay);
      gain.gain.linearRampToValueAtTime(0.2, t + n.delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.delay + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + n.delay);
      osc.stop(t + n.delay + dur + 0.05);
    });
  }

  /**
   * Undo move sound.
   */
  public playUndo() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(420, t + 0.06);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * UI Click sound.
   */
  public playClick() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Ethereal generative ambient chords that breathe in the background.
   */
  private startAmbientDrone() {
    if (this.ambientTimer) return;

    const chordProgression = [
      [130.81, 196.0, 261.63], // C3, G3, C4
      [146.83, 220.0, 329.63], // D3, A3, E4
      [110.0, 164.81, 220.0],  // A2, E3, A3
      [174.61, 261.63, 329.63] // F3, C4, E4
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.ctx || !this.musicGain || this.isMuted) {
        this.ambientTimer = window.setTimeout(playChord, 6000);
        return;
      }

      const t = this.ctx.currentTime;
      const notes = chordProgression[chordIdx % chordProgression.length];
      chordIdx++;

      notes.forEach((freq) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 2.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 6.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 7.0);
      });

      this.ambientTimer = window.setTimeout(playChord, 5800);
    };

    playChord();
  }

  public dispose() {
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundFx = new SoundSystem();

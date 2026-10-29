/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Toybox Trouble Audio Engine
 * High-performance procedural Web Audio Chiptune Synthesizer.
 * Creates retro 8-bit toy sounds, spring boings, wooden thuds, and dynamic music
 * without needing external audio files that could fail to load.
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private masterVol: number = 0.8;
  private musicVol: number = 0.5;
  private sfxVol: number = 0.7;

  private bgmInterval: number | null = null;
  private currentBgmTrack: 'lobby' | 'race' | 'victory' | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Lazy init on first user gesture
  }

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVol;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch {
      // Graceful fallback if Web Audio is unsupported
    }
  }

  public setMasterVolume(val: number) {
    this.masterVol = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
  }

  public setMusicVolume(val: number) {
    this.musicVol = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVol = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getSettings() {
    return {
      isMuted: this.isMuted,
      masterVolume: this.masterVol,
      musicVolume: this.musicVol,
      sfxVolume: this.sfxVol,
    };
  }

  // --- Sound Effects ---

  public playJump() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    // Frequency sweep upwards for bouncy cartoon spring
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playLand() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playBouncePad() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.22);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playTrapSpring() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Vibrato spring effect
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.1);
    osc.frequency.linearRampToValueAtTime(500, t + 0.2);
    osc.frequency.linearRampToValueAtTime(750, t + 0.3);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playSlimeSplat() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playFakeFloorCrumble() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // White noise burst for crumble
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.linearRampToValueAtTime(150, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.26);
  }

  public playChomp() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Rapid cartoon chomp/snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);

    // Second snap click
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(440, t + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(100, t + 0.16);
    gain2.gain.setValueAtTime(0.4, t + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.17);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.07);
    osc2.stop(t + 0.18);
  }

  public playBubbleTrap() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Watery ascending bloop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.2);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playBubblePop() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.05);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playSlipSlide() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Slide whistle downwards
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.28);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playCheckpoint() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playTrainWhistle() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Dual tone steam whistle
    [587.33, 739.99].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playCountdownBeep(isGo: boolean = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (isGo ? 0.35 : 0.12));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + (isGo ? 0.36 : 0.15));
  }

  public playFinishHorn() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const chords = [
      { f: [392, 523, 659], d: 0.15 },
      { f: [440, 587, 698], d: 0.15 },
      { f: [523, 659, 783, 1046], d: 0.5 },
    ];

    let delay = 0;
    chords.forEach((chord) => {
      chord.f.forEach((freq) => {
        if (!this.ctx || !this.sfxGain) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + chord.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + chord.d + 0.05);
      });
      delay += chord.d + 0.05;
    });
  }

  public playButtonClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playTrapPlace() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(560, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // --- Background Music Chiptune Synthesizer ---

  public playBgm(track: 'lobby' | 'race' | 'victory') {
    if (this.currentBgmTrack === track) return;
    this.stopBgm();
    this.currentBgmTrack = track;
    this.init();

    if (!this.ctx) return;

    if (track === 'lobby') {
      this.startLobbyBgm();
    } else if (track === 'race') {
      this.startRaceBgm();
    } else if (track === 'victory') {
      this.startVictoryBgm();
    }
  }

  public stopBgm() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBgmTrack = null;
  }

  private startLobbyBgm() {
    if (!this.ctx || !this.musicGain) return;

    // Upbeat gentle toybox chiptune melody
    const notes = [
      261.63, 329.63, 392.0, 523.25, 392.0, 329.63,
      293.66, 349.23, 440.0, 587.33, 440.0, 349.23,
      329.63, 392.0, 493.88, 659.25, 493.88, 392.0,
      392.0, 440.0, 493.88, 523.25
    ];
    let noteIdx = 0;

    const tempoMs = 220;
    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const freq = notes[noteIdx % notes.length];
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.18);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.2);

      noteIdx++;
    }, tempoMs);
  }

  private startRaceBgm() {
    if (!this.ctx || !this.musicGain) return;

    // High energy 8-bit racing bassline and arpeggios
    const bassline = [130.81, 130.81, 164.81, 196.0, 146.83, 146.83, 174.61, 220.0];
    const lead = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 880.0, 1046.5];
    let step = 0;

    const tempoMs = 135; // fast racing tempo
    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const t = this.ctx.currentTime;

      // Bass note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassline[step % bassline.length], t);
      bassGain.gain.setValueAtTime(0.07, t);
      bassGain.gain.exponentialRampToValueAtTime(0.005, t + 0.11);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.12);

      // Lead note
      if (step % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(lead[(step / 2) % lead.length], t);
        leadGain.gain.setValueAtTime(0.05, t);
        leadGain.gain.exponentialRampToValueAtTime(0.002, t + 0.22);
        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(t);
        leadOsc.stop(t + 0.23);
      }

      step++;
    }, tempoMs);
  }

  private startVictoryBgm() {
    if (!this.ctx || !this.musicGain) return;

    const fanfare = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    let step = 0;

    const tempoMs = 280;
    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(fanfare[step % fanfare.length], t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.25);

      step++;
      if (step >= fanfare.length * 4) {
        // Stop after looping fanfare a few times
        this.stopBgm();
      }
    }, tempoMs);
  }
}

export const audio = new AudioManager();

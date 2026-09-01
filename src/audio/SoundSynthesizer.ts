export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isInitialized = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  public init(): void {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master drone gain (whisper quiet ambient background)
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      // Lowpass resonant filter for deep warm space tone
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      // Dual detuned oscillators for atmospheric chorus
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55.0, this.ctx.currentTime); // A1 note

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(55.6, this.ctx.currentTime); // Slight detune

      this.droneOsc1.connect(this.filter);
      this.droneOsc2.connect(this.filter);
      this.filter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.isInitialized = true;
    } catch {
      // Graceful fallback if Web Audio is unsupported or blocked
    }
  }

  public playTargetSelect(screenXNormalized = 0): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      // Spatial stereo panning if supported
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, screenXNormalized)), now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(this.ctx.destination);
      }

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Audio playback failed silently
    }
  }

  public updateDronePitch(distToCore: number): void {
    if (!this.ctx || !this.droneOsc1 || !this.filter) return;

    // Pitch shifts deeper when nearing the supermassive black hole Sgr A*
    const clampedDist = Math.max(5, Math.min(250, distToCore));
    const targetFreq = 45.0 + (clampedDist / 250.0) * 25.0;
    const filterFreq = 110.0 + (clampedDist / 250.0) * 80.0;

    const now = this.ctx.currentTime;
    this.droneOsc1.frequency.setTargetAtTime(targetFreq, now, 0.4);
    this.filter.frequency.setTargetAtTime(filterFreq, now, 0.4);
  }

  public setTransitModulation(isTransiting: boolean): void {
    if (!this.ctx || !this.droneGain) return;
    const now = this.ctx.currentTime;
    const targetGain = isTransiting ? 0.065 : 0.04;
    this.droneGain.gain.setTargetAtTime(targetGain, now, 0.3);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const soundSynth = new SoundSynthesizer();

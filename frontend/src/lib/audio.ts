// Retro Web Audio Synthesizer for 8-bit / Chiptune effects

class SoundEffects {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tuxfall_mute');
      if (saved) {
        this.isMuted = saved === 'true';
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tuxfall_mute', String(this.isMuted));
    }
    return this.isMuted;
  }

  public playCatch(rarity: string = 'common') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    osc.type = rarity === 'legendary' ? 'triangle' : 'square';

    if (rarity === 'legendary') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  }

  public playSmash(rarity: string = 'common') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Punchy hit transient (smash impact punch)
    const punchOsc = this.ctx.createOscillator();
    const punchGain = this.ctx.createGain();
    punchOsc.type = 'triangle';
    punchOsc.connect(punchGain);
    punchGain.connect(this.ctx.destination);

    punchOsc.frequency.setValueAtTime(140, now);
    punchOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    punchGain.gain.setValueAtTime(0.35, now);
    punchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    punchOsc.start(now);
    punchOsc.stop(now + 0.14);

    // 2. Musical collect chime (high chiptune chime)
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chimeOsc.type = rarity === 'legendary' ? 'triangle' : 'square';
    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);

    const startFreq = rarity === 'legendary' ? 587.33 : 523.25;
    const endFreq = rarity === 'legendary' ? 1174.66 : 783.99;
    chimeOsc.frequency.setValueAtTime(startFreq, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

    chimeGain.gain.setValueAtTime(0.22, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    chimeOsc.start(now);
    chimeOsc.stop(now + 0.22);
  }

  public playHazard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playCombo() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      const noteTime = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.15);

      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    });
  }

  public playEmp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBoot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25]; // C major
    chord.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  public playFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 }, // C
      { f: 587.33, d: 0.12 }, // D
      { f: 659.25, d: 0.12 }, // E
      { f: 783.99, d: 0.25 }, // G
      { f: 659.25, d: 0.12 }, // E
      { f: 1046.50, d: 0.45 }, // C (high)
    ];

    let t = this.ctx.currentTime;
    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.frequency.setValueAtTime(n.f, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.d);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d;
    });
  }
}

export const sound = new SoundEffects();

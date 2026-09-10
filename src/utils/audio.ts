/**
 * Web Audio API synthesizer for retro-arcade Stickwar sound effects.
 * Synthesizes punchy, crisp sound effects without external audio assets.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private bgmEnabled: boolean = true;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.7;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateSettings(sfx: boolean, bgm: boolean, sfxVol: number, bgmVol: number) {
    this.sfxEnabled = sfx;
    this.bgmEnabled = bgm;
    this.sfxVolume = sfxVol / 100;
    this.bgmVolume = bgmVol / 100;
  }

  // Haptic feedback
  public vibrate(pattern: number | number[] = 25) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore if not supported or blocked
      }
    }
  }

  // Button Click / Tap
  public playClick() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
    this.vibrate(10);
  }

  // Coin Collection Chime
  public playCoin() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.07); // E6

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
    this.vibrate(20);
  }

  // Attack Slash
  public playSlash(combo = 1) {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const baseFreq = 220 + combo * 80;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
    this.vibrate(15 + combo * 5);
  }

  // Hit impact
  public playHit() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
    this.vibrate([25, 10, 25]);
  }

  // Upgrade Success Fanfare
  public playUpgrade() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + index * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
    this.vibrate([30, 40, 50]);
  }

  // Player hurt crunch
  public playPlayerHurt() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(0.45 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
    this.vibrate([40, 20, 60]);
  }

  // Bow Shoot / Arrow Twang
  public playBowShoot() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Shield Block Clang
  public playShieldBlock() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.15);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
    this.vibrate(30);
  }

  // Boss Roar / Earth Slam
  public playBossRoar() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.45);

    gain.gain.setValueAtTime(0.6 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.55);
    this.vibrate([60, 30, 80]);
  }

  // Game Over Sad Tones
  public playGameOver() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [330, 311, 293, 277, 246]; // E4, Eb4, D4, Db4, B3
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    });
    this.vibrate([100, 50, 150]);
  }
}

export const sound = new SoundManager();

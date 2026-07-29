export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initOnInteraction();
  }

  initOnInteraction() {
    const initCtx = () => {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', initCtx);
      window.removeEventListener('keydown', initCtx);
    };

    window.addEventListener('click', initCtx);
    window.addEventListener('keydown', initCtx);
  }

  playShootSound(pitchFactor = 1.0, isHeavy = false) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isHeavy ? 'sawtooth' : 'triangle';
      
      const startFreq = (isHeavy ? 140 : 280) * pitchFactor;
      const endFreq = (isHeavy ? 40 : 80) * pitchFactor;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + (isHeavy ? 0.2 : 0.1));

      gain.gain.setValueAtTime(isHeavy ? 0.3 : 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (isHeavy ? 0.2 : 0.1));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + (isHeavy ? 0.2 : 0.1));
    } catch (e) {}
  }

  playHitSound(isShape = true) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isShape ? 350 + Math.random() * 100 : 180 + Math.random() * 50;

      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playExplosionSound(scale = 1.0) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const dur = 0.3 * scale;

      // Noise buffer for explosion rumble
      const bufferSize = this.ctx.sampleRate * dur;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 * scale, now);
      filter.frequency.exponentialRampToValueAtTime(30, now + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3 * scale, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + dur);
    } catch (e) {}
  }

  playLevelUpSound() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.15);
      });
    } catch (e) {}
  }

  playAbilitySound() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }
}

class SoundNotifier {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playAlertSiren() {
    try {
      this.initAudio();
      if (!this.audioCtx || this.isPlaying) return;

      this.isPlaying = true;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      
      // Siren frequency sweep from 600Hz to 1200Hz
      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.3);
      osc.frequency.linearRampToValueAtTime(600, now + 0.6);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.7);

      setTimeout(() => {
        this.isPlaying = false;
      }, 700);
    } catch (e) {
      console.warn("Audio playback error:", e);
      this.isPlaying = false;
    }
  }
}

export const soundNotifier = new SoundNotifier();

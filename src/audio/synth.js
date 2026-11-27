/**
 * @fileoverview A tiny Web Audio synthesizer. It plays square and sawtooth
 * notes and filtered noise bursts, so the game needs no sound files.
 */

/** Master volume while the sound is on. */
const VOLUME = 0.5;

/** Level every envelope fades to; exponential ramps cannot reach zero. */
const SILENCE = 0.001;

/** Extra seconds a sound keeps running after its envelope ends. */
const TAIL = 0.02;

/** Synthesizes sounds through one shared AudioContext. */
export class Synth {
  /** @param {boolean} muted Whether to start with the sound off. */
  constructor(muted) {
    /**
     * Created on the first user gesture, because browsers block audio until
     * the page has been interacted with.
     * @private {?AudioContext}
     */
    this.context_ = null;

    /** @private {?GainNode} */
    this.master_ = null;

    /**
     * One second of white noise, created on first use.
     * @private {?AudioBuffer}
     */
    this.noise_ = null;

    /** @private {boolean} */
    this.muted_ = muted;
  }

  /**
   * Creates the audio context, or resumes it if the browser suspended it. Call
   * this from a user gesture such as a key press.
   */
  unlock() {
    if (!this.context_) {
      if (typeof AudioContext === 'undefined') return;  // No Web Audio.
      this.context_ = new AudioContext();
      this.master_ = this.context_.createGain();
      this.master_.gain.value = this.muted_ ? 0 : VOLUME;
      this.master_.connect(this.context_.destination);
    }
    if (this.context_.state === 'suspended') this.context_.resume();
  }

  /** @return {boolean} Whether the sound is off. */
  isMuted() {
    return this.muted_;
  }

  /** @param {boolean} muted Whether to turn the sound off. */
  setMuted(muted) {
    this.muted_ = muted;
    if (this.master_) this.master_.gain.value = muted ? 0 : VOLUME;
  }

  /**
   * Plays a square-wave note at a fixed pitch.
   * @param {number} frequency Pitch in Hz.
   * @param {number} duration Length in seconds.
   * @param {number} volume Starting level; the note fades out from here.
   * @param {number=} delay Seconds to wait before the note starts.
   */
  tone(frequency, duration, volume, delay = 0) {
    this.play_('square', frequency, null, duration, volume, delay);
  }

  /**
   * Plays a note that glides from one pitch to another.
   * @param {number} from Starting pitch in Hz.
   * @param {number} to Final pitch in Hz.
   * @param {number} duration Length in seconds.
   * @param {number} volume Starting level; the note fades out from here.
   * @param {!OscillatorType=} waveform Shape of the wave.
   */
  sweep(from, to, duration, volume, waveform = 'square') {
    this.play_(waveform, from, to, duration, volume, 0);
  }

  /**
   * Plays a burst of white noise through a low-pass filter.
   * @param {number} duration Length in seconds.
   * @param {number} volume Starting level; the noise fades out from here.
   * @param {number} cutoff Filter cutoff in Hz; lower sounds deeper.
   */
  noise(duration, volume, cutoff) {
    if (!this.context_) return;
    const start = this.context_.currentTime;
    const source = this.context_.createBufferSource();
    source.buffer = this.getNoiseBuffer_();
    const filter = this.context_.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    source.connect(filter);
    filter.connect(this.createEnvelope_(volume, start, duration));
    source.start(start);
    source.stop(start + duration + TAIL);
  }

  /**
   * @param {!OscillatorType} waveform Shape of the wave.
   * @param {number} from Starting pitch in Hz.
   * @param {?number} to Final pitch in Hz, or null to hold the pitch.
   * @param {number} duration Length in seconds.
   * @param {number} volume Starting level.
   * @param {number} delay Seconds to wait before the note starts.
   * @private
   */
  play_(waveform, from, to, duration, volume, delay) {
    if (!this.context_) return;
    const start = this.context_.currentTime + delay;
    const oscillator = this.context_.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(from, start);
    if (to !== null) {
      oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(1, to), start + duration);
    }
    oscillator.connect(this.createEnvelope_(volume, start, duration));
    oscillator.start(start);
    oscillator.stop(start + duration + TAIL);
  }

  /**
   * Creates a gain node that fades from the given volume to silence and feeds
   * the master output.
   * @param {number} volume Starting level.
   * @param {number} start Audio-clock time when the fade starts.
   * @param {number} duration Length of the fade in seconds.
   * @return {!GainNode}
   * @private
   */
  createEnvelope_(volume, start, duration) {
    const envelope = this.context_.createGain();
    envelope.gain.setValueAtTime(volume, start);
    envelope.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
    envelope.connect(this.master_);
    return envelope;
  }

  /**
   * @return {!AudioBuffer} One second of white noise.
   * @private
   */
  getNoiseBuffer_() {
    if (!this.noise_) {
      const length = this.context_.sampleRate;
      this.noise_ =
          this.context_.createBuffer(1, length, this.context_.sampleRate);
      const samples = this.noise_.getChannelData(0);
      for (let i = 0; i < length; i++) {
        samples[i] = Math.random() * 2 - 1;
      }
    }
    return this.noise_;
  }
}

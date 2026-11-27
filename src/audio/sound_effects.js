/**
 * @fileoverview The game's sound effects, built from synthesized notes and
 * noise. Also remembers whether the player muted the sound.
 */

import {loadMuted, saveMuted} from '../storage.js';

import {Synth} from './synth.js';

/** Pitches of the fleet's four-step march, in Hz. */
const MARCH_NOTES = Object.freeze([523, 440, 392, 330]);

/** Rising notes played when a wave is cleared, in Hz. */
const WAVE_CLEARED_NOTES = Object.freeze([392, 494, 587, 784]);

/** Falling notes played when the game ends, in Hz. */
const GAME_OVER_NOTES = Object.freeze([440, 392, 330, 262, 196]);

/** Plays the sound for each game event. */
export class SoundEffects {
  /** Restores the mute setting from the last visit. */
  constructor() {
    /** @private @const {!Synth} */
    this.synth_ = new Synth(loadMuted());
  }

  /** Starts audio. Browsers allow this only from a user gesture. */
  unlock() {
    this.synth_.unlock();
  }

  /** @return {boolean} Whether the sound is off. */
  isMuted() {
    return this.synth_.isMuted();
  }

  /** Turns the sound off or on, saves the choice, and chirps when it is on. */
  toggleMute() {
    const muted = !this.synth_.isMuted();
    this.synth_.setMuted(muted);
    saveMuted(muted);
    if (!muted) this.synth_.tone(660, 0.06, 0.08);
  }

  /** The ship fires. */
  shoot() {
    this.synth_.sweep(880, 220, 0.09, 0.1);
  }

  /** An invader is destroyed. */
  invaderKilled() {
    this.synth_.noise(0.12, 0.16, 1400);
  }

  /**
   * One beat of the fleet's march.
   * @param {number} step Beat counter; the four notes repeat in turn.
   */
  march(step) {
    this.synth_.tone(MARCH_NOTES[step % MARCH_NOTES.length], 0.055, 0.04);
  }

  /** The ship explodes. */
  explosion() {
    this.synth_.noise(0.7, 0.35, 400);
    this.synth_.sweep(120, 30, 0.7, 0.18, 'sawtooth');
  }

  /** An invader fires. */
  invaderShoot() {
    this.synth_.sweep(300, 150, 0.08, 0.04, 'sawtooth');
  }

  /** The saucer's warble while it flies. */
  ufoBlip() {
    this.synth_.sweep(620, 500, 0.08, 0.045);
  }

  /** The saucer is shot down. */
  ufoHit() {
    this.synth_.noise(0.25, 0.2, 900);
    this.synth_.sweep(700, 200, 0.25, 0.08);
  }

  /** A wave is cleared. */
  waveCleared() {
    for (const [i, note] of WAVE_CLEARED_NOTES.entries()) {
      this.synth_.tone(note, 0.1, 0.1, i * 0.09);
    }
  }

  /** The game ends. */
  gameOver() {
    for (const [i, note] of GAME_OVER_NOTES.entries()) {
      this.synth_.tone(note, 0.16, 0.1, i * 0.15);
    }
  }
}

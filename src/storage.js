/**
 * @fileoverview Saves the high score and the mute setting in localStorage.
 * Storage can be unavailable (private browsing, blocked site data); every
 * helper then falls back quietly and the game carries on without it.
 */

/** Storage key for the high score. */
const HIGH_SCORE_KEY = 'si-hiscore';

/** Storage key for the mute setting. */
const MUTED_KEY = 'si-muted';

/** @return {number} The saved high score, or 0 if there is none. */
export function loadHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY) || 0) || 0;
  } catch (e) {
    // Storage is unavailable, so there is no saved score.
    return 0;
  }
}

/** @param {number} score The new high score. */
export function saveHighScore(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch (e) {
    // Storage is unavailable; the score only lasts until the page closes.
  }
}

/** @return {boolean} Whether the player muted the sound last time. */
export function loadMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch (e) {
    // Storage is unavailable, so start with sound on.
    return false;
  }
}

/** @param {boolean} muted Whether the sound is now muted. */
export function saveMuted(muted) {
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch (e) {
    // Storage is unavailable; the setting only lasts until the page closes.
  }
}

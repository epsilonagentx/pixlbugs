/**
 * @fileoverview Timing for things that blink on and off, such as prompts and
 * a newly spawned ship.
 */

/**
 * @param {number} time Seconds on the game clock.
 * @param {number} rate Times per second the state flips between on and off.
 * @return {boolean} Whether a blinking thing is in its "on" half.
 */
export function isBlinkOn(time, rate) {
  return Math.floor(time * rate) % 2 === 0;
}

/**
 * @fileoverview Score numbers that float up from whatever was just destroyed.
 */

/** A score number that rises and disappears. */
export class ScorePopup {
  /**
   * @param {number} x Horizontal center.
   * @param {number} y Starting Y position.
   * @param {number} points Points to show.
   * @param {number} lifetime Seconds before it disappears.
   */
  constructor(x, y, points, lifetime) {
    /** @const {number} */
    this.x = x;

    /** @const {number} */
    this.y = y;

    /** @const {string} */
    this.text = String(points);

    /** @private @const {number} */
    this.lifetime_ = lifetime;

    /** @private {number} */
    this.remaining_ = lifetime;
  }

  /** @param {number} dt Seconds since the last frame. */
  update(dt) {
    this.remaining_ -= dt;
  }

  /** @return {boolean} Whether the popup has run its course. */
  isExpired() {
    return this.remaining_ <= 0;
  }

  /** @return {number} How far through its life the popup is, from 0 to 1. */
  getProgress() {
    return 1 - this.remaining_ / this.lifetime_;
  }
}

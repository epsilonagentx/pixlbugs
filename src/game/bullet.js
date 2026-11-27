/**
 * @fileoverview Bullets fired by the player and by the invaders.
 */

import {artHeight, artWidth, INVADER_BULLET_FRAMES, PLAYER_BULLET_ART} from '../pixel_art.js';

import {rectsOverlap} from './geometry.js';

/** Speed of player bullets, in pixels per second. */
const PLAYER_BULLET_SPEED = 700;

/**
 * Base speed of invader bullets, in pixels per second, before the per-wave
 * speedup is added.
 */
const INVADER_BULLET_SPEED = 170;

/** Extra invader bullet speed for each wave, in pixels per second. */
const INVADER_BULLET_SPEEDUP = 10;

/** A bullet that flies straight up or straight down. */
export class Bullet {
  /**
   * @param {number} x Left edge.
   * @param {number} y Top edge.
   * @param {number} width
   * @param {number} height
   * @param {number} velocity Vertical speed in pixels per second. Negative
   *     values move up.
   */
  constructor(x, y, width, height, velocity) {
    /** @const {number} */
    this.x = x;

    /** @type {number} */
    this.y = y;

    /** @const {number} */
    this.width = width;

    /** @const {number} */
    this.height = height;

    /** @private @const {number} */
    this.velocity_ = velocity;

    /**
     * Set when the bullet hits something. Spent bullets are removed at the end
     * of the frame.
     * @type {boolean}
     */
    this.spent = false;
  }

  /**
   * Creates a bullet fired upward by the ship.
   * @param {number} centerX Horizontal center of the bullet.
   * @param {number} bottom Y position of the bullet's bottom edge.
   * @return {!Bullet}
   */
  static fromPlayer(centerX, bottom) {
    const width = artWidth(PLAYER_BULLET_ART);
    const height = artHeight(PLAYER_BULLET_ART);
    return new Bullet(
        centerX - width / 2, bottom - height, width, height,
        -PLAYER_BULLET_SPEED);
  }

  /**
   * Creates a bullet dropped by an invader. It falls faster in later waves.
   * @param {number} centerX Horizontal center of the bullet.
   * @param {number} top Y position of the bullet's top edge.
   * @param {number} wave The current wave number.
   * @return {!Bullet}
   */
  static fromInvader(centerX, top, wave) {
    const width = artWidth(INVADER_BULLET_FRAMES[0]);
    const height = artHeight(INVADER_BULLET_FRAMES[0]);
    return new Bullet(
        centerX - width / 2, top, width, height,
        INVADER_BULLET_SPEED + wave * INVADER_BULLET_SPEEDUP);
  }

  /** @param {number} dt Seconds since the last frame. */
  move(dt) {
    this.y += this.velocity_ * dt;
  }

  /** @return {number} Y position of the edge facing the way it flies. */
  getLeadingEdge() {
    return this.velocity_ < 0 ? this.y : this.y + this.height;
  }

  /**
   * @param {number} x Left edge of the rectangle.
   * @param {number} y Top edge of the rectangle.
   * @param {number} width
   * @param {number} height
   * @return {boolean} Whether the bullet overlaps the rectangle.
   */
  overlaps(x, y, width, height) {
    return rectsOverlap(
        this.x, this.y, this.width, this.height, x, y, width, height);
  }
}

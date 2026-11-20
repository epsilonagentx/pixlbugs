/**
 * @fileoverview The player's ship: steering, the twin cannon, spawn protection
 * and the death explosion.
 */

import {PLAYFIELD_WIDTH, SIDE_MARGIN} from '../config.js';
import {artHeight, artWidth, PLAYER_ART} from '../pixel_art.js';

import {Bullet} from './bullet.js';
import {rectsOverlap} from './geometry.js';

/** Y position of the ship's top edge. */
const TOP = 506;

/** Steering speed, in pixels per second. */
const SPEED = 330;

/** Seconds between volleys. */
const RELOAD_TIME = 0.32;

/** Each volley fires one bullet at each of these offsets from the center. */
const VOLLEY_OFFSETS = Object.freeze([-8, 8]);

/** Most player bullets allowed on screen at once. */
const MAX_BULLETS = 4;

/** Seconds the explosion lasts before the ship respawns. */
const EXPLOSION_TIME = 1.7;

/** Seconds a new ship cannot be hit. */
const SPAWN_PROTECTION_TIME = 1.5;

/** The player's ship. */
export class Player {
  /** Places a new ship in the middle, briefly protected from hits. */
  constructor() {
    /** @const {number} */
    this.width = artWidth(PLAYER_ART);

    /** @const {number} */
    this.height = artHeight(PLAYER_ART);

    /**
     * Left edge.
     * @type {number}
     */
    this.x = PLAYFIELD_WIDTH / 2 - this.width / 2;

    /**
     * Top edge.
     * @const {number}
     */
    this.y = TOP;

    /**
     * Seconds until the cannon can fire again.
     * @private {number}
     */
    this.reloadTimer_ = 0;

    /**
     * Seconds of spawn protection left.
     * @private {number}
     */
    this.protectionTimer_ = SPAWN_PROTECTION_TIME;

    /** @private {boolean} */
    this.exploding_ = false;

    /**
     * Seconds of explosion left.
     * @private {number}
     */
    this.explosionTimer_ = 0;
  }

  /** @return {boolean} Whether the ship has been hit and is exploding. */
  isExploding() {
    return this.exploding_;
  }

  /** @return {boolean} Whether spawn protection is still on. */
  isProtected() {
    return this.protectionTimer_ > 0;
  }

  /** @return {boolean} Whether a bullet or an invader can destroy the ship. */
  isVulnerable() {
    return !this.exploding_ && !this.isProtected();
  }

  /** @return {number} Seconds since the ship was hit. */
  getExplosionAge() {
    return EXPLOSION_TIME - this.explosionTimer_;
  }

  /**
   * @param {number} x Left edge of the rectangle.
   * @param {number} y Top edge of the rectangle.
   * @param {number} width
   * @param {number} height
   * @return {boolean} Whether the ship overlaps the rectangle.
   */
  overlaps(x, y, width, height) {
    return rectsOverlap(
        this.x, this.y, this.width, this.height, x, y, width, height);
  }

  /**
   * Steers the ship and runs down the reload and protection timers.
   * @param {number} dt Seconds since the last frame.
   * @param {number} direction -1 to steer left, 1 to steer right, 0 to hold.
   */
  update(dt, direction) {
    const rightmost = PLAYFIELD_WIDTH - SIDE_MARGIN - this.width;
    this.x += direction * SPEED * dt;
    this.x = Math.max(SIDE_MARGIN, Math.min(rightmost, this.x));
    if (this.protectionTimer_ > 0) this.protectionTimer_ -= dt;
    this.reloadTimer_ -= dt;
  }

  /**
   * @param {number} bulletsInFlight Player bullets already on screen.
   * @return {boolean} Whether the cannon has reloaded and a whole volley fits
   *     under the bullet limit.
   */
  canFire(bulletsInFlight) {
    return this.reloadTimer_ <= 0 &&
        bulletsInFlight + VOLLEY_OFFSETS.length <= MAX_BULLETS;
  }

  /**
   * Fires a volley and starts reloading.
   * @return {!Array<!Bullet>} The new bullets.
   */
  fire() {
    this.reloadTimer_ = RELOAD_TIME;
    const centerX = this.x + this.width / 2;
    return VOLLEY_OFFSETS.map(
        (offset) => Bullet.fromPlayer(centerX + offset, this.y));
  }

  /** Blows the ship up. */
  explode() {
    this.exploding_ = true;
    this.explosionTimer_ = EXPLOSION_TIME;
  }

  /**
   * Runs the explosion.
   * @param {number} dt Seconds since the last frame.
   * @return {boolean} Whether the explosion has finished.
   */
  updateExplosion(dt) {
    this.explosionTimer_ -= dt;
    return this.explosionTimer_ <= 0;
  }
}

/**
 * @fileoverview The mystery saucer that crosses the top of the screen now and
 * then, and the timer that sends it.
 */

import {PLAYFIELD_WIDTH} from '../config.js';
import {artHeight, artWidth, UFO_ART} from '../pixel_art.js';

import {rectsOverlap} from './geometry.js';
import {randomBetween, randomItem} from './random.js';

/** Points the saucer can be worth; one is picked at random when it is hit. */
export const UFO_POINTS = Object.freeze([50, 100, 150, 300]);

/** Y position of the saucer's top edge. */
const TOP = 74;

/** Flying speed, in pixels per second. */
const SPEED = 95;

/** Gap between the left wall and a saucer entering from the left. */
const LEFT_ENTRY_GAP = 11;

/** Gap between the right wall and a saucer entering from the right. */
const RIGHT_ENTRY_GAP = 4;

/** How far past either wall the saucer flies before it is removed. */
const EXIT_DISTANCE = 50;

/** Seconds between blips of the saucer's warble. */
const BLIP_INTERVAL = 0.28;

/** Range of the delay before the first pass of a wave, in seconds. */
const FIRST_PASS_DELAY_MIN = 12;
const FIRST_PASS_DELAY_MAX = 22;

/** Range of the delay between later passes, in seconds. */
const NEXT_PASS_DELAY_MIN = 18;
const NEXT_PASS_DELAY_MAX = 32;

/**
 * @param {function(): number=} random Returns a number in [0, 1].
 * @return {number} Points for shooting down the saucer.
 */
export function pickUfoPoints(random = Math.random) {
  return randomItem(UFO_POINTS, random);
}

/** The mystery saucer. */
export class Ufo {
  /** @param {boolean} fromLeft Whether the saucer enters from the left. */
  constructor(fromLeft) {
    /** @const {number} */
    this.width = artWidth(UFO_ART);

    /** @const {number} */
    this.height = artHeight(UFO_ART);

    /**
     * Left edge.
     * @type {number}
     */
    this.x = fromLeft ? -(this.width + LEFT_ENTRY_GAP) :
                        PLAYFIELD_WIDTH + RIGHT_ENTRY_GAP;

    /**
     * Top edge.
     * @const {number}
     */
    this.y = TOP;

    /**
     * 1 when flying right, -1 when flying left.
     * @private @const {number}
     */
    this.direction_ = fromLeft ? 1 : -1;

    /**
     * Seconds until the next blip.
     * @private {number}
     */
    this.blipTimer_ = 0;
  }

  /**
   * Flies the saucer onward.
   * @param {number} dt Seconds since the last frame.
   * @return {boolean} Whether it is time to play the next blip.
   */
  move(dt) {
    this.x += SPEED * this.direction_ * dt;
    this.blipTimer_ -= dt;
    if (this.blipTimer_ > 0) return false;
    this.blipTimer_ = BLIP_INTERVAL;
    return true;
  }

  /** @return {boolean} Whether the saucer has left the playfield. */
  isGone() {
    return this.x > PLAYFIELD_WIDTH + EXIT_DISTANCE || this.x < -EXIT_DISTANCE;
  }

  /**
   * @param {number} x Left edge of the rectangle.
   * @param {number} y Top edge of the rectangle.
   * @param {number} width
   * @param {number} height
   * @return {boolean} Whether the saucer overlaps the rectangle.
   */
  overlaps(x, y, width, height) {
    return rectsOverlap(
        this.x, this.y, this.width, this.height, x, y, width, height);
  }
}

/** Sends a saucer across the screen at random intervals. */
export class UfoSpawner {
  /** Schedules the first pass of a wave. */
  constructor() {
    /**
     * The saucer on screen, if any.
     * @type {?Ufo}
     */
    this.ufo = null;

    /**
     * Seconds until the next pass.
     * @private {number}
     */
    this.timer_ = randomBetween(FIRST_PASS_DELAY_MIN, FIRST_PASS_DELAY_MAX);
  }

  /**
   * Launches the saucer when its time comes, flies it, and removes it once it
   * leaves the playfield.
   * @param {number} dt Seconds since the last frame.
   * @return {boolean} Whether the saucer blipped this frame.
   */
  update(dt) {
    this.timer_ -= dt;
    if (!this.ufo && this.timer_ <= 0) this.ufo = new Ufo(Math.random() < 0.5);
    if (!this.ufo) return false;
    const blipped = this.ufo.move(dt);
    if (this.ufo.isGone()) this.remove();
    return blipped;
  }

  /** Takes the saucer off the screen and schedules the next pass. */
  remove() {
    this.ufo = null;
    this.timer_ = randomBetween(NEXT_PASS_DELAY_MIN, NEXT_PASS_DELAY_MAX);
  }
}

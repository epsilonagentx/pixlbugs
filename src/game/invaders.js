/**
 * @fileoverview The invader fleet: its formation, how it marches and drops
 * toward the ground, and how it picks who shoots.
 */

import {PLAYFIELD_WIDTH, SIDE_MARGIN} from '../config.js';
import {artHeight, artWidth, CRAB_FRAMES, OCTOPUS_FRAMES, SQUID_FRAMES} from '../pixel_art.js';

import {rectsOverlap} from './geometry.js';
import {randomBetween, randomItem} from './random.js';

/**
 * The three kinds of invader, from the top of the formation down.
 * @enum {string}
 */
export const InvaderType = {
  SQUID: 'squid',
  CRAB: 'crab',
  OCTOPUS: 'octopus',
};

/** Points scored for destroying each kind of invader. */
export const INVADER_POINTS = Object.freeze({
  [InvaderType.SQUID]: 30,
  [InvaderType.CRAB]: 20,
  [InvaderType.OCTOPUS]: 10,
});

/** Invaders in each row of the formation. */
export const INVADER_COLUMNS = 11;

/** Rows in the formation. */
export const INVADER_ROWS = 5;

/** Width of every invader, in canvas pixels. */
export const INVADER_WIDTH = artWidth(CRAB_FRAMES[0]);

/** Height of every invader, in canvas pixels. */
export const INVADER_HEIGHT = artHeight(CRAB_FRAMES[0]);

/** Horizontal gap between invaders in the formation. */
export const INVADER_GAP_X = 20;

/** Vertical gap between invaders in the formation. */
export const INVADER_GAP_Y = 16;

if ([...SQUID_FRAMES, ...CRAB_FRAMES, ...OCTOPUS_FRAMES].some(
        (frame) => artWidth(frame) !== INVADER_WIDTH ||
            artHeight(frame) !== INVADER_HEIGHT)) {
  throw new Error('Every invader frame must be the same size');
}

/** Fleet speed with the whole formation alive, in pixels per second. */
const BASE_SPEED = 20;

/**
 * How much faster the fleet gets as it thins out, as a multiple of
 * BASE_SPEED. The last invader moves at 1 + SPEEDUP times the base speed.
 */
const SPEEDUP = 4;

/** How far the fleet drops each time it reaches a wall. */
const DROP_DISTANCE = 12;

/** Distance the fleet marches between beats of the march sound. */
const MARCH_BEAT_DISTANCE = 22;

/** Seconds before the first invader shot of a wave. */
const FIRST_SHOT_DELAY = 1.6;

/** Range of the delay between shots, in seconds, before fleet scaling. */
const SHOT_DELAY_MIN = 0.55;
const SHOT_DELAY_MAX = 1.65;

/** Most invader bullets allowed on screen at once. */
const MAX_BULLETS = 3;

/**
 * @param {number} row Formation row, counted from the top.
 * @return {!InvaderType}
 */
export function invaderTypeForRow(row) {
  if (row === 0) return InvaderType.SQUID;
  return row <= 2 ? InvaderType.CRAB : InvaderType.OCTOPUS;
}

/**
 * @param {number} row Formation row, counted from the top.
 * @return {number} Points scored for an invader in that row.
 */
export function pointsForRow(row) {
  return INVADER_POINTS[invaderTypeForRow(row)];
}

/** One invader in the formation. */
export class Invader {
  /**
   * @param {number} row Formation row, counted from the top.
   * @param {number} column Formation column, counted from the left.
   * @param {number} x Left edge.
   * @param {number} y Top edge.
   */
  constructor(row, column, x, y) {
    /** @const {number} */
    this.row = row;

    /** @const {number} */
    this.column = column;

    /** @const {!InvaderType} */
    this.type = invaderTypeForRow(row);

    /** @const {number} */
    this.points = pointsForRow(row);

    /** @type {number} */
    this.x = x;

    /** @type {number} */
    this.y = y;

    /** @type {boolean} */
    this.alive = true;
  }

  /**
   * @param {number} x Left edge of the rectangle.
   * @param {number} y Top edge of the rectangle.
   * @param {number} width
   * @param {number} height
   * @return {boolean} Whether the invader overlaps the rectangle.
   */
  overlaps(x, y, width, height) {
    return rectsOverlap(
        this.x, this.y, INVADER_WIDTH, INVADER_HEIGHT, x, y, width, height);
  }
}

/**
 * Lays out a full formation, centered across the playfield.
 * @param {number} playfieldWidth Width to center the formation in.
 * @param {number} top Y position of the top row.
 * @return {!Array<!Invader>} Invaders in reading order, row by row.
 */
export function createInvaders(playfieldWidth, top) {
  const formationWidth =
      INVADER_COLUMNS * INVADER_WIDTH + (INVADER_COLUMNS - 1) * INVADER_GAP_X;
  const left = (playfieldWidth - formationWidth) / 2;
  const invaders = [];
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let column = 0; column < INVADER_COLUMNS; column++) {
      invaders.push(new Invader(
          row, column, left + column * (INVADER_WIDTH + INVADER_GAP_X),
          top + row * (INVADER_HEIGHT + INVADER_GAP_Y)));
    }
  }
  return invaders;
}

/** The whole formation, moving and shooting as one. */
export class Fleet {
  /** @param {number} top Y position of the top row. */
  constructor(top) {
    /** @const {!Array<!Invader>} */
    this.invaders = createInvaders(PLAYFIELD_WIDTH, top);

    /**
     * 1 while marching right, -1 while marching left.
     * @private {number}
     */
    this.direction_ = 1;

    /**
     * Distance marched since the last beat of the march sound.
     * @private {number}
     */
    this.marchDistance_ = 0;

    /**
     * Counts march beats; restarts each time the fleet drops.
     * @private {number}
     */
    this.marchStep_ = 0;

    /**
     * Seconds until the next shot.
     * @private {number}
     */
    this.shotTimer_ = FIRST_SHOT_DELAY;
  }

  /** @return {!Array<!Invader>} The invaders still alive. */
  getAlive() {
    return this.invaders.filter((invader) => invader.alive);
  }

  /**
   * @param {!Array<!Invader>} alive The invaders still alive.
   * @return {number} Y position of the lowest invader's bottom edge.
   */
  getBottom(alive) {
    let bottom = -Infinity;
    for (const invader of alive) {
      bottom = Math.max(bottom, invader.y + INVADER_HEIGHT);
    }
    return bottom;
  }

  /**
   * Marches the fleet sideways. At a wall it drops instead and turns around.
   * The fewer invaders are left, the faster it goes.
   * @param {number} dt Seconds since the last frame.
   * @param {!Array<!Invader>} alive The invaders still alive.
   * @return {!Array<number>} March beats to play this frame, in order.
   */
  march(dt, alive) {
    const speed = BASE_SPEED * (1 + SPEEDUP * (1 - this.getStrength_(alive)));
    const step = speed * dt * this.direction_;
    let left = Infinity;
    let right = -Infinity;
    for (const invader of alive) {
      left = Math.min(left, invader.x);
      right = Math.max(right, invader.x + INVADER_WIDTH);
    }

    const hitsWall = this.direction_ > 0 ?
        right + step > PLAYFIELD_WIDTH - SIDE_MARGIN :
        left + step < SIDE_MARGIN;
    if (hitsWall) {
      this.direction_ = -this.direction_;
      for (const invader of alive) {
        invader.y += DROP_DISTANCE;
      }
      this.marchStep_ = 0;
    } else {
      for (const invader of alive) {
        invader.x += step;
      }
    }

    const beats = [];
    this.marchDistance_ += Math.abs(step);
    while (this.marchDistance_ >= MARCH_BEAT_DISTANCE) {
      this.marchDistance_ -= MARCH_BEAT_DISTANCE;
      beats.push(this.marchStep_++);
    }
    return beats;
  }

  /**
   * Counts down to the next shot and picks who fires it: the lowest invader
   * in a random column. Thinner fleets shoot more often.
   * @param {number} dt Seconds since the last frame.
   * @param {!Array<!Invader>} alive The invaders still alive.
   * @param {number} bulletsInFlight Invader bullets already on screen.
   * @param {boolean} holdFire Whether to skip shooting, for example while the
   *     ship is exploding.
   * @return {?Invader} The invader that shoots this frame, if any.
   */
  updateShooting(dt, alive, bulletsInFlight, holdFire) {
    this.shotTimer_ -= dt;
    if (bulletsInFlight >= MAX_BULLETS || this.shotTimer_ > 0 || holdFire) {
      return null;
    }

    this.shotTimer_ = randomBetween(SHOT_DELAY_MIN, SHOT_DELAY_MAX) *
        (0.35 + 0.85 * this.getStrength_(alive));

    const columns = [...new Set(alive.map((invader) => invader.column))];
    const column = randomItem(columns);
    let shooter = null;
    for (const invader of alive) {
      if (invader.column === column && (!shooter || invader.y > shooter.y)) {
        shooter = invader;
      }
    }
    return shooter;
  }

  /**
   * @param {!Array<!Invader>} alive The invaders still alive.
   * @return {number} Fraction of the formation still alive, from 0 to 1.
   * @private
   */
  getStrength_(alive) {
    return alive.length / this.invaders.length;
  }
}

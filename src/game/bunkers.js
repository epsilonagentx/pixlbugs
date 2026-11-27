/**
 * @fileoverview Destructible bunkers. Each bunker is a grid of cells that
 * bullets chip away and invaders grind down.
 */

import {PIXEL_SCALE} from '../config.js';

/** Shape of a fresh bunker: '#' is a solid cell and '.' is empty. */
export const BUNKER_SHAPE = Object.freeze([
  '.......########.......',
  '.....############.....',
  '...################...',
  '..##################..',
  '.####################.',
  '######################',
  '######################',
  '######################',
  '######################',
  '########......########',
  '########......########',
  '########......########',
  '########......########',
  '########......########',
]);

/** Size of one bunker cell, in canvas pixels. */
export const BUNKER_CELL_SIZE = PIXEL_SCALE;

/** Cells across a bunker. */
export const BUNKER_COLUMNS = BUNKER_SHAPE[0].length;

/** Cells down a bunker. */
export const BUNKER_ROWS = BUNKER_SHAPE.length;

if (BUNKER_SHAPE.some((row) => row.length !== BUNKER_COLUMNS)) {
  throw new Error('BUNKER_SHAPE rows must all have the same width');
}

/** Chance that a cell inside a blast breaks. */
const BREAK_CHANCE = 0.85;

/** A destructible bunker. */
export class Bunker {
  /**
   * @param {number} x Left edge.
   * @param {number} y Top edge.
   */
  constructor(x, y) {
    /** @const {number} */
    this.x = x;

    /** @const {number} */
    this.y = y;

    /** @const {number} */
    this.width = BUNKER_COLUMNS * BUNKER_CELL_SIZE;

    /** @const {number} */
    this.height = BUNKER_ROWS * BUNKER_CELL_SIZE;

    /**
     * Whether each cell is still standing, indexed by row and then column.
     * @const {!Array<!Array<boolean>>}
     */
    this.cells =
        BUNKER_SHAPE.map((row) => Array.from(row, (cell) => cell === '#'));
  }

  /**
   * Breaks cells around an impact. Each cell within the radius breaks by
   * chance, which leaves ragged holes.
   * @param {number} x Horizontal position of the impact.
   * @param {number} y Vertical position of the impact.
   * @param {number} radius Blast radius, in cells.
   * @param {function(): number=} random Returns a number in [0, 1).
   */
  damage(x, y, radius, random = Math.random) {
    const centerRow = Math.round((y - this.y) / BUNKER_CELL_SIZE);
    const centerColumn = Math.round((x - this.x) / BUNKER_CELL_SIZE);
    for (let dRow = -radius; dRow <= radius; dRow++) {
      for (let dColumn = -radius; dColumn <= radius; dColumn++) {
        if (dRow * dRow + dColumn * dColumn > radius * radius + 0.5) continue;
        const row = centerRow + dRow;
        const column = centerColumn + dColumn;
        if (row < 0 || row >= BUNKER_ROWS) continue;
        if (column < 0 || column >= BUNKER_COLUMNS) continue;
        if (random() < BREAK_CHANCE) this.cells[row][column] = false;
      }
    }
  }

  /**
   * Clears every cell under a rectangle. This is how invaders grind bunkers
   * away.
   * @param {number} x Left edge of the rectangle.
   * @param {number} y Top edge of the rectangle.
   * @param {number} width
   * @param {number} height
   */
  erase(x, y, width, height) {
    const range = this.getCellRange_(x, y, width, height);
    if (!range) return;
    for (let row = range.top; row <= range.bottom; row++) {
      for (let column = range.left; column <= range.right; column++) {
        this.cells[row][column] = false;
      }
    }
  }

  /**
   * Tells whether a rectangle touches a standing cell. Bullets pass through
   * the empty arch and through holes.
   * @param {number} x Left edge of the rectangle.
   * @param {number} y Top edge of the rectangle.
   * @param {number} width
   * @param {number} height
   * @return {boolean}
   */
  overlaps(x, y, width, height) {
    const range = this.getCellRange_(x, y, width, height);
    if (!range) return false;
    for (let row = range.top; row <= range.bottom; row++) {
      for (let column = range.left; column <= range.right; column++) {
        if (this.cells[row][column]) return true;
      }
    }
    return false;
  }

  /**
   * Finds the cells under a rectangle, clipped to the bunker.
   * @param {number} x Left edge of the rectangle.
   * @param {number} y Top edge of the rectangle.
   * @param {number} width
   * @param {number} height
   * @return {?{top: number, bottom: number, left: number, right: number}}
   *     Inclusive cell bounds, or null if the rectangle misses the bunker.
   * @private
   */
  getCellRange_(x, y, width, height) {
    const toColumn = (px) => Math.floor((px - this.x) / BUNKER_CELL_SIZE);
    const toRow = (py) => Math.floor((py - this.y) / BUNKER_CELL_SIZE);
    const left = Math.max(0, toColumn(x));
    const right = Math.min(BUNKER_COLUMNS - 1, toColumn(x + width - 1));
    const top = Math.max(0, toRow(y));
    const bottom = Math.min(BUNKER_ROWS - 1, toRow(y + height - 1));
    if (top > bottom || left > right) return null;
    return {top, bottom, left, right};
  }
}

/**
 * Builds a row of fresh bunkers.
 * @param {number} top Y position of every bunker's top edge.
 * @param {!ReadonlyArray<number>} lefts X position of each bunker's left
 *     edge.
 * @return {!Array<!Bunker>}
 */
export function createBunkers(top, lefts) {
  return lefts.map((left) => new Bunker(left, top));
}

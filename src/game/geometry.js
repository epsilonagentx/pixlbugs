/**
 * @fileoverview Rectangle math used for collision checks.
 */

/**
 * Tells whether two axis-aligned rectangles overlap. Edges that only touch do
 * not count.
 * @param {number} ax Left edge of the first rectangle.
 * @param {number} ay Top edge of the first rectangle.
 * @param {number} aw Width of the first rectangle.
 * @param {number} ah Height of the first rectangle.
 * @param {number} bx Left edge of the second rectangle.
 * @param {number} by Top edge of the second rectangle.
 * @param {number} bw Width of the second rectangle.
 * @param {number} bh Height of the second rectangle.
 * @return {boolean}
 */
export function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

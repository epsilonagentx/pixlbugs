/**
 * @fileoverview The faint, still starfield behind everything.
 */

/** Number of stars. */
const STAR_COUNT = 70;

/** Width and height of each star, in canvas pixels. */
const STAR_SIZE = 2;

/** Opacity of the faintest star. */
const MIN_ALPHA = 0.08;

/** Extra opacity the brightest star can have. */
const ALPHA_RANGE = 0.25;

/**
 * Paints stars at random positions and brightness.
 * @param {number} width
 * @param {number} height
 * @return {!HTMLCanvasElement}
 */
export function createStarfield(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  for (let i = 0; i < STAR_COUNT; i++) {
    const alpha = (MIN_ALPHA + Math.random() * ALPHA_RANGE).toFixed(2);
    context.fillStyle = `rgba(255,255,255,${alpha})`;
    context.fillRect(
        Math.floor(Math.random() * width), Math.floor(Math.random() * height),
        STAR_SIZE, STAR_SIZE);
  }
  return canvas;
}

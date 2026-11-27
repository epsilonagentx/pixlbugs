/**
 * @fileoverview Paints the pixel art onto canvases once, so each frame only has
 * to copy them.
 */

import {PIXEL_SCALE} from '../config.js';
import {InvaderType} from '../game/invaders.js';
import {artHeight, artWidth, BEETLE_FRAMES, FLY_FRAMES, INVADER_BULLET_FRAMES, MANTIS_FRAMES, MOTH_ART, PLAYER_ART, PLAYER_BULLET_ART} from '../pixel_art.js';

import {Color} from './palette.js';

/** Color of each kind of invader. */
export const INVADER_COLORS = Object.freeze({
  [InvaderType.MANTIS]: Color.AMBER,
  [InvaderType.BEETLE]: Color.MAGENTA,
  [InvaderType.FLY]: Color.TEAL,
});

/**
 * Paints pixel art onto a new canvas.
 * @param {!ReadonlyArray<string>} art
 * @param {!Color} color
 * @return {!HTMLCanvasElement}
 */
function paint(art, color) {
  const canvas = document.createElement('canvas');
  canvas.width = artWidth(art);
  canvas.height = artHeight(art);
  const context = canvas.getContext('2d');
  context.fillStyle = color;
  for (let y = 0; y < art.length; y++) {
    for (let x = 0; x < art[y].length; x++) {
      if (art[y][x] === '#') {
        context.fillRect(
            x * PIXEL_SCALE, y * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
      }
    }
  }
  return canvas;
}

/**
 * @param {!ReadonlyArray<!ReadonlyArray<string>>} frames
 * @param {!Color} color
 * @return {!Array<!HTMLCanvasElement>}
 */
function paintFrames(frames, color) {
  return frames.map((frame) => paint(frame, color));
}

/** Every sprite, painted and ready to draw. */
export class Sprites {
  /** Paints all the sprites. Needs a DOM. */
  constructor() {
    /** @const {!HTMLCanvasElement} */
    this.player = paint(PLAYER_ART, Color.PLAYER);

    /** @const {!HTMLCanvasElement} */
    this.ufo = paint(MOTH_ART, Color.RED);

    /** @const {!HTMLCanvasElement} */
    this.playerBullet = paint(PLAYER_BULLET_ART, Color.BULLET);

    /**
     * Animation frames.
     * @const {!Array<!HTMLCanvasElement>}
     */
    this.invaderBullet = paintFrames(INVADER_BULLET_FRAMES, Color.BULLET);

    /**
     * Animation frames for each kind of invader.
     * @const {!Object<!InvaderType, !Array<!HTMLCanvasElement>>}
     */
    this.invaders = {
      [InvaderType.MANTIS]:
          paintFrames(MANTIS_FRAMES, INVADER_COLORS[InvaderType.MANTIS]),
      [InvaderType.BEETLE]:
          paintFrames(BEETLE_FRAMES, INVADER_COLORS[InvaderType.BEETLE]),
      [InvaderType.FLY]:
          paintFrames(FLY_FRAMES, INVADER_COLORS[InvaderType.FLY]),
    };
  }
}

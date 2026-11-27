/**
 * @fileoverview The heads-up display: scores and wave along the top, the
 * ground line and spare ships along the bottom.
 */

import {GROUND_Y, PLAYFIELD_WIDTH} from '../config.js';
import {Game} from '../game/game.js';

import {Align, drawText} from './font.js';
import {Color} from './palette.js';
import {Sprites} from './sprites.js';

/** Distance of the HUD text from the left and right edges. */
const EDGE_INSET = 16;

/** Y position of the labels in the top bar. */
const LABEL_Y = 12;

/** Y position of the values under the labels. */
const VALUE_Y = 30;

/** Canvas pixels per font pixel for all HUD text. */
const TEXT_SCALE = 2;

/** Thickness of the ground line. */
const GROUND_THICKNESS = 2;

/** Size of each spare-ship icon. */
const LIFE_ICON_WIDTH = 26;
const LIFE_ICON_HEIGHT = 16;

/** Distance from one spare-ship icon to the next. */
const LIFE_ICON_SPACING = 44;

/** Y position of the spare-ship icons. */
const LIFE_ICON_Y = GROUND_Y + 10;

/** Position of the lives count, just right of where a third icon ends. */
const LIVES_LABEL_X = EDGE_INSET + 3 * LIFE_ICON_SPACING + 6;
const LIVES_LABEL_Y = GROUND_Y + 12;

/**
 * @param {number} score
 * @return {string} The score padded to six digits, arcade style.
 */
export function formatScore(score) {
  return String(score).padStart(6, '0');
}

/**
 * Draws the high score, the score, the wave and the mute indicator.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Game} game
 * @param {boolean} muted
 */
export function drawTopBar(context, game, muted) {
  const center = PLAYFIELD_WIDTH / 2;
  const right = PLAYFIELD_WIDTH - EDGE_INSET;
  drawText(context, 'HI-SCORE', EDGE_INSET, LABEL_Y, TEXT_SCALE, Color.RED);
  drawText(
      context, formatScore(game.highScore), EDGE_INSET, VALUE_Y, TEXT_SCALE);
  drawText(
      context, 'SCORE', center, LABEL_Y, TEXT_SCALE, Color.RED, Align.CENTER);
  drawText(
      context, formatScore(game.score), center, VALUE_Y, TEXT_SCALE,
      Color.WHITE, Align.CENTER);
  drawText(
      context, `WAVE ${game.wave}`, right, LABEL_Y, TEXT_SCALE, Color.GREEN,
      Align.RIGHT);
  if (muted) {
    drawText(
        context, 'MUTED', right, VALUE_Y, TEXT_SCALE, Color.DIM, Align.RIGHT);
  }
}

/**
 * Draws the ground line, a ship icon for each life left, and the count.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Game} game
 * @param {!Sprites} sprites
 */
export function drawBottomBar(context, game, sprites) {
  context.fillStyle = Color.BUNKER;
  context.fillRect(0, GROUND_Y, PLAYFIELD_WIDTH, GROUND_THICKNESS);
  for (let i = 0; i < game.lives; i++) {
    context.drawImage(
        sprites.player, EDGE_INSET + i * LIFE_ICON_SPACING, LIFE_ICON_Y,
        LIFE_ICON_WIDTH, LIFE_ICON_HEIGHT);
  }
  drawText(
      context, `X ${game.lives}`, LIVES_LABEL_X, LIVES_LABEL_Y, TEXT_SCALE);
}

/**
 * @fileoverview Messages drawn over the playfield: wave cleared, game over and
 * paused.
 */

import {GROUND_Y, PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH} from '../config.js';
import {Game, Phase} from '../game/game.js';

import {isBlinkOn} from './blink.js';
import {Align, drawText} from './font.js';
import {formatScore} from './hud.js';
import {Color} from './palette.js';

/** Horizontal center of the playfield, where every overlay is centered. */
const CENTER_X = PLAYFIELD_WIDTH / 2;

/** Times per second the "press enter" prompt blinks on or off. */
const PROMPT_BLINK_RATE = 2;

/**
 * Draws the overlay for the current phase, if it has one.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Game} game
 */
export function drawOverlay(context, game) {
  switch (game.phase) {
    case Phase.WAVE_CLEARED:
      drawWaveCleared(context, game.wave);
      break;
    case Phase.GAME_OVER:
      drawGameOver(context, game);
      break;
    case Phase.PAUSED:
      drawPaused(context);
      break;
    default:
      // Nothing covers the playfield during play.
      break;
  }
}

/**
 * @param {!CanvasRenderingContext2D} context
 * @param {number} wave The wave just cleared.
 */
function drawWaveCleared(context, wave) {
  drawText(
      context, `WAVE ${wave} CLEARED`, CENTER_X, 270, 4, Color.GREEN,
      Align.CENTER);
  drawText(
      context, `GET READY FOR WAVE ${wave + 1}`, CENTER_X, 320, 2, Color.SKY,
      Align.CENTER);
}

/**
 * Draws the game-over message just above the ground line, and the final score
 * and a blinking prompt below it.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Game} game
 */
function drawGameOver(context, game) {
  drawText(
      context, game.gameOverMessage, CENTER_X, GROUND_Y - 20, 4, Color.RED,
      Align.CENTER);
  drawText(
      context, `FINAL SCORE ${formatScore(game.score)}`, CENTER_X,
      GROUND_Y + 22, 2, Color.WHITE, Align.CENTER);
  if (isBlinkOn(game.time, PROMPT_BLINK_RATE)) {
    drawText(
        context, 'PRESS ENTER', CENTER_X, GROUND_Y + 38, 2, Color.GREEN,
        Align.CENTER);
  }
}

/**
 * Dims the playfield and shows how to resume.
 * @param {!CanvasRenderingContext2D} context
 */
function drawPaused(context) {
  context.fillStyle = Color.SHADE;
  context.fillRect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
  drawText(context, 'PAUSED', CENTER_X, 270, 5, Color.WHITE, Align.CENTER);
  drawText(
      context, 'PRESS P TO RESUME', CENTER_X, 330, 2, Color.GREEN,
      Align.CENTER);
}

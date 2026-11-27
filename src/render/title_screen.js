/**
 * @fileoverview The title screen: the game's name, what each target is worth,
 * and the controls.
 */

import {PLAYFIELD_WIDTH} from '../config.js';
import {INVADER_POINTS, InvaderType} from '../game/invaders.js';

import {isBlinkOn} from './blink.js';
import {Align, drawText} from './font.js';
import {Color} from './palette.js';
import {INVADER_COLORS, Sprites} from './sprites.js';

/** Y position and scale of the game's name. */
const NAME_Y = 92;
const NAME_SCALE = 6;

/** Invaders listed in the points table, from the top. */
const LEGEND_INVADERS =
    Object.freeze([InvaderType.MANTIS, InvaderType.BEETLE, InvaderType.FLY]);

/** Y position of the points table's first row. */
const LEGEND_TOP = 180;

/** Distance from one row of the points table to the next. */
const LEGEND_ROW_HEIGHT = 52;

/**
 * Height of the slot each icon is centered in. Invader icons fill it; it is
 * also their width.
 */
const ICON_SLOT = 48;

/** Size of the saucer icon. */
const UFO_ICON_WIDTH = 66;
const UFO_ICON_HEIGHT = 30;

/** X position of the icons' left edges. */
const ICON_X = 300;

/** X position of the point labels' left edges. */
const LABEL_X = 380;

/** Distance from the top of a row to the top of its label. */
const LABEL_OFFSET_Y = 14;

/** Y position of the blinking start prompt. */
const START_PROMPT_Y = 448;

/** Y position of the controls line. */
const CONTROLS_Y = 508;

/** Times per second the start prompt blinks on or off. */
const PROMPT_BLINK_RATE = 2;

/**
 * Draws the title screen.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Sprites} sprites
 * @param {number} time Seconds on the game clock.
 */
export function drawTitleScreen(context, sprites, time) {
  const center = PLAYFIELD_WIDTH / 2;
  drawText(
      context, 'SPACE INVADERS', center, NAME_Y, NAME_SCALE, Color.WHITE,
      Align.CENTER);

  let top = LEGEND_TOP;
  for (const type of LEGEND_INVADERS) {
    drawLegendRow(
        context, top, sprites.invaders[type][0], ICON_SLOT, ICON_SLOT,
        `${INVADER_POINTS[type]} POINTS`, INVADER_COLORS[type]);
    top += LEGEND_ROW_HEIGHT;
  }
  drawLegendRow(
      context, top, sprites.ufo, UFO_ICON_WIDTH, UFO_ICON_HEIGHT, '??? POINTS',
      Color.RED);

  if (isBlinkOn(time, PROMPT_BLINK_RATE)) {
    drawText(
        context, 'PRESS ENTER TO START', center, START_PROMPT_Y, 3, Color.GREEN,
        Align.CENTER);
  }
  drawText(
      context, 'ARROWS MOVE   SPACE FIRE   P PAUSE   M MUTE', center,
      CONTROLS_Y, 2, Color.DIM, Align.CENTER);
}

/**
 * Draws one row of the points table: an icon and its label.
 * @param {!CanvasRenderingContext2D} context
 * @param {number} top Y position of the row.
 * @param {!HTMLCanvasElement} icon
 * @param {number} width Width to draw the icon at.
 * @param {number} height Height to draw the icon at.
 * @param {string} label
 * @param {!Color} color Color of the label.
 */
function drawLegendRow(context, top, icon, width, height, label, color) {
  context.drawImage(
      icon, ICON_X, top + (ICON_SLOT - height) / 2, width, height);
  drawText(context, label, LABEL_X, top + LABEL_OFFSET_Y, 2, color);
}

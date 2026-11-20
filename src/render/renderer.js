/**
 * @fileoverview Draws a whole frame: background, HUD, the title screen or the
 * playfield, and any overlay.
 */

import {PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH} from '../config.js';
import {Game, Phase} from '../game/game.js';

import {drawBottomBar, drawTopBar} from './hud.js';
import {drawOverlay} from './overlays.js';
import {Color} from './palette.js';
import {drawPlayfield} from './playfield.js';
import {Sprites} from './sprites.js';
import {createStarfield} from './starfield.js';
import {drawTitleScreen} from './title_screen.js';

/** Draws the game onto a canvas. */
export class Renderer {
  /** @param {!CanvasRenderingContext2D} context The canvas to draw on. */
  constructor(context) {
    /** @private @const {!CanvasRenderingContext2D} */
    this.context_ = context;

    /** @private @const {!Sprites} */
    this.sprites_ = new Sprites();

    /** @private @const {!HTMLCanvasElement} */
    this.starfield_ = createStarfield(PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
  }

  /**
   * Draws one frame.
   * @param {!Game} game
   * @param {boolean} muted Whether to show the mute indicator.
   */
  render(game, muted) {
    const context = this.context_;
    context.fillStyle = Color.BACKGROUND;
    context.fillRect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
    context.drawImage(this.starfield_, 0, 0);
    drawTopBar(context, game, muted);

    if (game.phase === Phase.TITLE) {
      drawTitleScreen(context, this.sprites_, game.time);
      return;
    }

    drawPlayfield(context, game, this.sprites_);
    drawBottomBar(context, game, this.sprites_);
    drawOverlay(context, game);
  }
}

/**
 * @fileoverview Entry point. Wires the canvas, game, renderer, sound and input
 * together and runs the frame loop.
 */

import {SoundEffects} from './audio/sound_effects.js';
import {PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH} from './config.js';
import {Game} from './game/game.js';
import {attachControls} from './input/controls.js';
import {Keyboard} from './input/keyboard.js';
import {Renderer} from './render/renderer.js';

/**
 * Longest time step the game takes in one frame, in seconds. After a stall,
 * such as a background tab, the game slows down instead of jumping ahead.
 */
const MAX_FRAME_TIME = 1 / 30;

/** Sets up the game on the page's canvas and starts the frame loop. */
function main() {
  const canvas =
      /** @type {!HTMLCanvasElement} */ (document.getElementById('game'));
  canvas.width = PLAYFIELD_WIDTH;
  canvas.height = PLAYFIELD_HEIGHT;

  const sounds = new SoundEffects();
  const keyboard = new Keyboard();
  const game = new Game(sounds);
  const renderer = new Renderer(canvas.getContext('2d'));
  attachControls(canvas, game, keyboard, sounds);

  let lastTime = performance.now();

  /** @param {number} now Timestamp from requestAnimationFrame. */
  const frame = (now) => {
    const dt = Math.max(0, Math.min(MAX_FRAME_TIME, (now - lastTime) / 1000));
    lastTime = now;
    game.update(dt, keyboard);
    renderer.render(game, sounds.isMuted());
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();

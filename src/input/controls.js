/**
 * @fileoverview Connects keyboard, focus and visibility events to the game.
 */

import {SoundEffects} from '../audio/sound_effects.js';
import {Game, Phase} from '../game/game.js';

import {Keyboard} from './keyboard.js';

/** Keys that would scroll the page if the browser handled them. */
const SCROLL_KEYS =
    Object.freeze([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown']);

/**
 * Starts listening for input.
 * @param {!HTMLCanvasElement} canvas The game's canvas; a click unlocks audio.
 * @param {!Game} game The game that commands are sent to.
 * @param {!Keyboard} keyboard Receives every key press and release.
 * @param {!SoundEffects} sounds Unlocked by the first gesture; M mutes it.
 */
export function attachControls(canvas, game, keyboard, sounds) {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (SCROLL_KEYS.includes(key)) event.preventDefault();
    if (!event.repeat) sounds.unlock();
    keyboard.press(key);
    if (!event.repeat) runCommand(key, game, sounds);
  });

  window.addEventListener('keyup', (event) => {
    keyboard.release(event.key.toLowerCase());
  });

  const releaseAndPause = () => {
    keyboard.releaseAll();
    game.pause();
  };
  window.addEventListener('blur', releaseAndPause);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAndPause();
  });

  canvas.addEventListener('pointerdown', () => {
    sounds.unlock();
  });
}

/**
 * Acts on a key that triggers a one-off command rather than being held.
 * @param {string} key Lowercase key that went down.
 * @param {!Game} game
 * @param {!SoundEffects} sounds
 */
function runCommand(key, game, sounds) {
  switch (key) {
    case 'enter':
      if (game.phase === Phase.TITLE) {
        game.start();
      } else if (game.phase === Phase.GAME_OVER) {
        game.showTitle();
      }
      break;
    case ' ':
      if (game.phase === Phase.TITLE) game.start();
      break;
    case 'p':
      game.togglePause();
      break;
    case 'm':
      sounds.toggleMute();
      break;
    default:
      // Other keys only matter while held; see Keyboard.
      break;
  }
}

/**
 * @fileoverview Draws the action: bunkers, saucer, fleet, bullets, the ship or
 * its explosion, and the floating scores.
 */

import {Bunker, BUNKER_CELL_SIZE} from '../game/bunkers.js';
import {Game, Phase} from '../game/game.js';
import {Player} from '../game/player.js';

import {isBlinkOn} from './blink.js';
import {Align, drawText} from './font.js';
import {Color} from './palette.js';
import {Sprites} from './sprites.js';

/** Seconds each frame of the fleet's animation shows. */
const INVADER_FRAME_TIME = 0.4;

/** Frames per second of the invader bullets' animation. */
const INVADER_BULLET_FRAME_RATE = 10;

/** Times per second a protected ship blinks on or off. */
const PROTECTED_BLINK_RATE = 12;

/** How far a score popup rises over its life, in canvas pixels. */
const POPUP_RISE = 20;

/** Canvas pixels per font pixel for score popups. */
const POPUP_SCALE = 2;

/** Rays in the ship's explosion. */
const EXPLOSION_RAYS = 8;

/** Colors the explosion rays cycle through. */
const EXPLOSION_COLORS = Object.freeze([Color.BULLET, Color.GOLD, Color.RED]);

/** Length of the explosion rays when the ship is hit. */
const EXPLOSION_START_RADIUS = 6;

/** How fast the explosion grows, in canvas pixels per second. */
const EXPLOSION_GROWTH = 34;

/** Where each ray starts, as a fraction of its outer end. */
const EXPLOSION_INNER_RATIO = 0.3;

/** Rotation of the ray pattern, in radians, so no ray is axis-aligned. */
const EXPLOSION_ANGLE_OFFSET = 0.3;

/** Line width of the explosion rays. */
const EXPLOSION_LINE_WIDTH = 3;

/**
 * Draws everything in the playfield.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Game} game
 * @param {!Sprites} sprites
 */
export function drawPlayfield(context, game, sprites) {
  for (const bunker of game.bunkers) {
    drawBunker(context, bunker);
  }

  const ufo = game.ufoSpawner.ufo;
  if (ufo) context.drawImage(sprites.ufo, ufo.x, ufo.y);

  const invaderStep = Math.floor(game.time / INVADER_FRAME_TIME);
  for (const invader of game.fleet.invaders) {
    if (!invader.alive) continue;
    const frames = sprites.invaders[invader.type];
    context.drawImage(
        frames[invaderStep % frames.length], invader.x, invader.y);
  }

  for (const bullet of game.playerBullets) {
    context.drawImage(sprites.playerBullet, bullet.x, bullet.y);
  }
  const bulletFrames = sprites.invaderBullet;
  const bulletFrame =
      bulletFrames[Math.floor(game.time * INVADER_BULLET_FRAME_RATE) %
                   bulletFrames.length];
  for (const bullet of game.invaderBullets) {
    context.drawImage(bulletFrame, bullet.x, bullet.y);
  }

  if (game.phase === Phase.PLAYING || game.phase === Phase.WAVE_CLEARED) {
    drawPlayer(context, game.player, sprites, game.time);
  }

  for (const popup of game.popups) {
    drawText(
        context, popup.text, popup.x,
        popup.y - popup.getProgress() * POPUP_RISE, POPUP_SCALE, Color.GOLD,
        Align.CENTER);
  }
}

/**
 * Draws a bunker's standing cells.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Bunker} bunker
 */
function drawBunker(context, bunker) {
  context.fillStyle = Color.BUNKER;
  for (let row = 0; row < bunker.cells.length; row++) {
    for (let column = 0; column < bunker.cells[row].length; column++) {
      if (bunker.cells[row][column]) {
        context.fillRect(
            bunker.x + column * BUNKER_CELL_SIZE,
            bunker.y + row * BUNKER_CELL_SIZE, BUNKER_CELL_SIZE,
            BUNKER_CELL_SIZE);
      }
    }
  }
}

/**
 * Draws the ship, blinking while it is protected, or its explosion.
 * @param {!CanvasRenderingContext2D} context
 * @param {!Player} player
 * @param {!Sprites} sprites
 * @param {number} time Seconds on the game clock.
 */
function drawPlayer(context, player, sprites, time) {
  if (player.isExploding()) {
    drawExplosion(
        context, player.x + player.width / 2, player.y + player.height / 2,
        player.getExplosionAge());
    return;
  }
  if (player.isProtected() && isBlinkOn(time, PROTECTED_BLINK_RATE)) return;
  context.drawImage(sprites.player, player.x, player.y);
}

/**
 * Draws a burst of rays that grows with age.
 * @param {!CanvasRenderingContext2D} context
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} age Seconds since the explosion started.
 */
function drawExplosion(context, centerX, centerY, age) {
  const radius = EXPLOSION_START_RADIUS + age * EXPLOSION_GROWTH;
  const innerRadius = radius * EXPLOSION_INNER_RATIO;
  context.save();
  context.translate(centerX, centerY);
  context.lineWidth = EXPLOSION_LINE_WIDTH;
  for (let i = 0; i < EXPLOSION_RAYS; i++) {
    const angle = (i / EXPLOSION_RAYS) * Math.PI * 2 + EXPLOSION_ANGLE_OFFSET;
    context.strokeStyle = EXPLOSION_COLORS[i % EXPLOSION_COLORS.length];
    context.beginPath();
    context.moveTo(
        Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    context.stroke();
  }
  context.restore();
}

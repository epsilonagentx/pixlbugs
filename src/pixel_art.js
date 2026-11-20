/**
 * @fileoverview Pixel art for every sprite. In each row '#' is a lit pixel and
 * '.' is empty. The game logic derives hitbox sizes from this art and the
 * renderer paints it, so the pictures and the hitboxes cannot drift apart.
 */

import {PIXEL_SCALE} from './config.js';

/** The player's ship. */
export const PLAYER_ART = Object.freeze([
  '......#......',
  '.....###.....',
  '.....###.....',
  '.############',
  '#############',
  '#############',
  '#############',
  '#############',
]);

/** The mystery saucer. */
export const UFO_ART = Object.freeze([
  '...#####...',
  '..#######..',
  '.#########.',
  '##.##.##.##',
  '..########.',
]);

/** Squid, the top row of the fleet: two animation frames. */
export const SQUID_FRAMES = Object.freeze([
  Object.freeze([
    '...##...',
    '..####..',
    '.######.',
    '##.##.##',
    '########',
    '..####..',
    '.##..##.',
    '.#....#.',
  ]),
  Object.freeze([
    '...##...',
    '..####..',
    '.######.',
    '##.##.##',
    '########',
    '.#.##.#.',
    '..#..#..',
    '.#....#.',
  ]),
]);

/** Crab, the middle rows of the fleet: two animation frames. */
export const CRAB_FRAMES = Object.freeze([
  Object.freeze([
    '...##...',
    '..####..',
    '########',
    '##.##.##',
    '########',
    '..#..#..',
    '#.#..#.#',
    '##....##',
  ]),
  Object.freeze([
    '...##...',
    '..####..',
    '########',
    '##.##.##',
    '########',
    '.#.##.#.',
    '..#..#..',
    '.#....#.',
  ]),
]);

/** Octopus, the bottom rows of the fleet: two animation frames. */
export const OCTOPUS_FRAMES = Object.freeze([
  Object.freeze([
    '..####..',
    '.######.',
    '########',
    '########',
    '.##..##.',
    '.##..##.',
    '.#.##.#.',
    '..#.##..',
  ]),
  Object.freeze([
    '..####..',
    '.######.',
    '########',
    '########',
    '.##..##.',
    '.#.##.#.',
    '..#..#..',
    '.#....#.',
  ]),
]);

/** Invader bullet: two frames that alternate as it falls. */
export const INVADER_BULLET_FRAMES = Object.freeze([
  Object.freeze([
    '..##',
    '.##.',
    '##..',
    '....',
    '.#..',
    '.##.',
  ]),
  Object.freeze([
    '.##.',
    '..#.',
    '....',
    '....',
    '##..',
    '.##.',
  ]),
]);

/** Player bullet. */
export const PLAYER_BULLET_ART = Object.freeze([
  '##',
  '##',
  '##',
  '##',
  '##',
  '##',
  '##',
  '##',
]);

/**
 * @param {!ReadonlyArray<string>} art
 * @return {number} Width of the art on screen, in canvas pixels.
 */
export function artWidth(art) {
  return art[0].length * PIXEL_SCALE;
}

/**
 * @param {!ReadonlyArray<string>} art
 * @return {number} Height of the art on screen, in canvas pixels.
 */
export function artHeight(art) {
  return art.length * PIXEL_SCALE;
}

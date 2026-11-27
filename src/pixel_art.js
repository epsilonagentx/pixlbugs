/**
 * @fileoverview Pixel art for every sprite. In each row '#' is a lit pixel and
 * '.' is empty. The game logic derives hitbox sizes from this art and the
 * renderer paints it, so the pictures and the hitboxes cannot drift apart.
 */

import {PIXEL_SCALE} from './config.js';

/** The player's turret: twin barrels over a split base. */
export const PLAYER_ART = Object.freeze([
  '...#.....#...',
  '...#.....#...',
  '....#####....',
  '..#########..',
  '.###########.',
  '#############',
  '###.#####.###',
  '#...........#',
]);

/** The mystery saucer, a moth in flight. */
export const MOTH_ART = Object.freeze([
  '#.#.....#.#',
  '###.#.#.###',
  '###########',
  '.#########.',
  '..#.#.#.#..',
]);

/** Mantis, the top row of the fleet: two animation frames. */
export const MANTIS_FRAMES = Object.freeze([
  Object.freeze([
    '#.#..#.#',
    '.#.##.#.',
    '..####..',
    '...##...',
    '..####..',
    '..#..#..',
    '.#....#.',
    '#......#',
  ]),
  Object.freeze([
    '.#....#.',
    '#.####.#',
    '..####..',
    '...##...',
    '..####..',
    '..#..#..',
    '#......#',
    '.#....#.',
  ]),
]);

/** Beetle, the middle rows of the fleet: two animation frames. */
export const BEETLE_FRAMES = Object.freeze([
  Object.freeze([
    '#......#',
    '.#.##.#.',
    '..#..#..',
    '..####..',
    '########',
    '#.#..#.#',
    '.######.',
    '#......#',
  ]),
  Object.freeze([
    '#......#',
    '.#.##.#.',
    '..#..#..',
    '..####..',
    '########',
    '.#.##.#.',
    '.######.',
    '.#....#.',
  ]),
]);

/** Fly, the bottom rows of the fleet: two animation frames. */
export const FLY_FRAMES = Object.freeze([
  Object.freeze([
    '#......#',
    '########',
    '##.##.##',
    '########',
    '.#.##.#.',
    '.######.',
    '#......#',
    '.#....#.',
  ]),
  Object.freeze([
    '.#....#.',
    '########',
    '##.##.##',
    '########',
    '.#.##.#.',
    '.######.',
    '.#....#.',
    '#......#',
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

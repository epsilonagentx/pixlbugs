/**
 * @fileoverview Playfield size and layout values shared by the game logic and
 * the renderer.
 */

/** Width of the playfield, in canvas pixels. */
export const PLAYFIELD_WIDTH = 800;

/** Height of the playfield, in canvas pixels. */
export const PLAYFIELD_HEIGHT = 600;

/** Gap the ship and the invader fleet keep from the side walls. */
export const SIDE_MARGIN = 18;

/**
 * Y position of the ground line. The invaders win when they reach it, and the
 * remaining lives are drawn below it.
 */
export const GROUND_Y = 552;

/** Size of one pixel of sprite art, in canvas pixels. */
export const PIXEL_SCALE = 3;

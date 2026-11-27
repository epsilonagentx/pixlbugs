/**
 * @fileoverview A 3x5 pixel font for all the text on screen.
 */

import {Color} from './palette.js';

/**
 * Pixels of each character: five rows of three, top to bottom, separated by
 * spaces. '1' is a lit pixel. Characters missing here print as a blank.
 * @const {!Object<string, string>}
 */
const GLYPHS = Object.freeze({
  '0': '111 101 101 101 111',
  '1': '010 110 010 010 111',
  '2': '111 001 111 100 111',
  '3': '111 001 011 001 111',
  '4': '101 101 111 001 001',
  '5': '111 100 111 001 111',
  '6': '111 100 111 101 111',
  '7': '111 001 010 010 010',
  '8': '111 101 111 101 111',
  '9': '111 101 111 001 111',
  'A': '010 101 111 101 101',
  'B': '110 101 110 101 110',
  'C': '011 100 100 100 011',
  'D': '110 101 101 101 110',
  'E': '111 100 110 100 111',
  'F': '111 100 110 100 100',
  'G': '011 100 101 101 011',
  'H': '101 101 111 101 101',
  'I': '111 010 010 010 111',
  'L': '100 100 100 100 111',
  'M': '101 111 111 101 101',
  'N': '101 111 111 111 101',
  'O': '010 101 101 101 010',
  'P': '111 101 111 100 100',
  'R': '111 101 110 101 101',
  'S': '111 100 010 001 111',
  'T': '111 010 010 010 010',
  'U': '101 101 101 101 111',
  'V': '101 101 101 101 010',
  'W': '101 101 101 111 010',
  'X': '101 101 010 101 101',
  'Y': '101 101 010 010 010',
  '-': '000 000 111 000 000',
  '!': '010 010 010 000 010',
  '?': '111 001 010 000 001',
  ' ': '000 000 000 000 000',
});

/**
 * Distance from one character to the next, in font pixels: three for the
 * glyph and one for the gap.
 */
const GLYPH_ADVANCE = 4;

/**
 * Where text sits relative to the x position it is drawn at.
 * @enum {string}
 */
export const Align = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
};

/**
 * @param {string} text
 * @param {number} scale Canvas pixels per font pixel.
 * @return {number} Width of the text on screen, without a trailing gap.
 */
export function textWidth(text, scale) {
  return text.length * GLYPH_ADVANCE * scale - scale;
}

/**
 * Draws a line of text.
 * @param {!CanvasRenderingContext2D} context
 * @param {string} text Uppercase text.
 * @param {number} x Anchor position; see align.
 * @param {number} y Top edge.
 * @param {number} scale Canvas pixels per font pixel.
 * @param {!Color=} color
 * @param {!Align=} align Whether x is the left edge, the center or the right
 *     edge of the text.
 */
export function drawText(
    context, text, x, y, scale, color = Color.WHITE, align = Align.LEFT) {
  context.fillStyle = color;
  let left = getLeftEdge(text, x, scale, align);
  for (const character of text) {
    const rows = (GLYPHS[character] ?? GLYPHS[' ']).split(' ');
    for (let row = 0; row < rows.length; row++) {
      for (let column = 0; column < rows[row].length; column++) {
        if (rows[row][column] === '1') {
          context.fillRect(
              left + column * scale, y + row * scale, scale, scale);
        }
      }
    }
    left += GLYPH_ADVANCE * scale;
  }
}

/**
 * @param {string} text
 * @param {number} x Anchor position.
 * @param {number} scale Canvas pixels per font pixel.
 * @param {!Align} align
 * @return {number} X position of the text's left edge.
 */
function getLeftEdge(text, x, scale, align) {
  switch (align) {
    case Align.CENTER:
      return x - textWidth(text, scale) / 2;
    case Align.RIGHT:
      return x - textWidth(text, scale);
    default:
      return x;
  }
}

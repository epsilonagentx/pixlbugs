"use strict";

/* ============================================================
   Shared configuration and pure game logic.
   No DOM access. Loaded as a classic script before game.js in
   the browser and required directly by tests/logic.test.js.
   ============================================================ */

const SCALE = 3; // sprite pixel size

/* ---------------- invaders ---------------- */
const INV_COLS = 11;
const INV_ROWS = 5;
const INV_W = 8 * SCALE;
const INV_H = 8 * SCALE;
const INV_GAP_X = 20;
const INV_GAP_Y = 16;

/* ---------------- bunkers ---------------- */
const BUNKER_SHAPE = [
  ".......########.......",
  ".....############.....",
  "...################...",
  "..##################..",
  ".####################.",
  "######################",
  "######################",
  "######################",
  "######################",
  "########......########",
  "########......########",
  "########......########",
  "########......########",
  "########......########",
];
const BUNKER_CELL = SCALE;
const BUNKER_COLS = BUNKER_SHAPE[0].length;
const BUNKER_ROWS = BUNKER_SHAPE.length;

if (BUNKER_SHAPE.some((row) => row.length !== BUNKER_COLS)) {
  throw new Error("BUNKER_SHAPE rows must all have the same width");
}

/* ---------------- UFO ---------------- */
const UFO_POINTS = [50, 100, 150, 300];

/* ---------------- pure helpers ---------------- */
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function pointsForRow(row) {
  return row === 0 ? 30 : row <= 2 ? 20 : 10;
}

function invaderTypeForRow(row) {
  return row === 0 ? "B" : row <= 2 ? "A" : "C";
}

function makeInvaders(playfieldWidth, startY) {
  const totalW = INV_COLS * INV_W + (INV_COLS - 1) * INV_GAP_X;
  const startX = (playfieldWidth - totalW) / 2;
  const list = [];
  for (let row = 0; row < INV_ROWS; row++) {
    for (let col = 0; col < INV_COLS; col++) {
      list.push({
        row,
        col,
        type: invaderTypeForRow(row),
        alive: true,
        x: startX + col * (INV_W + INV_GAP_X),
        y: startY + row * (INV_H + INV_GAP_Y),
        points: pointsForRow(row),
      });
    }
  }
  return list;
}

function makeBunkers(y, xs) {
  return xs.map((x) => ({
    x,
    y,
    w: BUNKER_COLS * BUNKER_CELL,
    h: BUNKER_ROWS * BUNKER_CELL,
    cell: BUNKER_CELL,
    rows: BUNKER_ROWS,
    cols: BUNKER_COLS,
    grid: BUNKER_SHAPE.map((row) => row.split("").map((c) => (c === "#" ? 1 : 0))),
  }));
}

function damageBunker(bunker, px, py, radius, rng = Math.random) {
  const cx = (px - bunker.x) / bunker.cell;
  const cy = (py - bunker.y) / bunker.cell;
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (dr * dr + dc * dc > radius * radius + 0.5) continue;
      const rr = Math.round(cy) + dr;
      const cc = Math.round(cx) + dc;
      if (rr < 0 || rr >= bunker.rows || cc < 0 || cc >= bunker.cols) continue;
      if (rng() < 0.85) bunker.grid[rr][cc] = 0;
    }
  }
}

function eraseBunkerRect(bunker, rx, ry, rw, rh) {
  const x0 = Math.max(0, Math.floor((rx - bunker.x) / bunker.cell));
  const x1 = Math.min(bunker.cols - 1, Math.floor((rx + rw - 1 - bunker.x) / bunker.cell));
  const y0 = Math.max(0, Math.floor((ry - bunker.y) / bunker.cell));
  const y1 = Math.min(bunker.rows - 1, Math.floor((ry + rh - 1 - bunker.y) / bunker.cell));
  if (y0 > y1 || x0 > x1) return;
  for (let rr = y0; rr <= y1; rr++)
    for (let cc = x0; cc <= x1; cc++)
      if (bunker.grid[rr][cc] === 1) bunker.grid[rr][cc] = 0;
}

/* True only when the rect touches at least one filled bunker cell.
   Prevents bullets from being swallowed by the empty arch. */
function bunkerOverlapsRect(bunker, rx, ry, rw, rh) {
  if (!rectsOverlap(rx, ry, rw, rh, bunker.x, bunker.y, bunker.w, bunker.h)) return false;
  const x0 = Math.max(0, Math.floor((rx - bunker.x) / bunker.cell));
  const x1 = Math.min(bunker.cols - 1, Math.floor((rx + rw - 1 - bunker.x) / bunker.cell));
  const y0 = Math.max(0, Math.floor((ry - bunker.y) / bunker.cell));
  const y1 = Math.min(bunker.rows - 1, Math.floor((ry + rh - 1 - bunker.y) / bunker.cell));
  if (y0 > y1 || x0 > x1) return false;
  for (let rr = y0; rr <= y1; rr++)
    for (let cc = x0; cc <= x1; cc++)
      if (bunker.grid[rr][cc] === 1) return true;
  return false;
}

function pickUfoPoints(rng = Math.random) {
  const index = Math.min(UFO_POINTS.length - 1, Math.floor(rng() * UFO_POINTS.length));
  return UFO_POINTS[index];
}

/* CommonJS export for node --test; a no-op in the browser. */
// @ts-ignore
if (typeof module !== "undefined" && module.exports) {
  // @ts-ignore
  module.exports = {
    SCALE,
    INV_COLS,
    INV_ROWS,
    INV_W,
    INV_H,
    INV_GAP_X,
    INV_GAP_Y,
    BUNKER_SHAPE,
    BUNKER_CELL,
    BUNKER_COLS,
    BUNKER_ROWS,
    UFO_POINTS,
    rectsOverlap,
    pointsForRow,
    invaderTypeForRow,
    makeInvaders,
    makeBunkers,
    damageBunker,
    eraseBunkerRect,
    bunkerOverlapsRect,
    pickUfoPoints,
  };
}

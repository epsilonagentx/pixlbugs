"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  rectsOverlap,
  pointsForRow,
  invaderTypeForRow,
  makeInvaders,
  makeBunkers,
  damageBunker,
  eraseBunkerRect,
  bunkerOverlapsRect,
  pickUfoPoints,
  BUNKER_SHAPE,
  BUNKER_CELL,
  BUNKER_COLS,
  BUNKER_ROWS,
  INV_COLS,
  INV_ROWS,
  INV_W,
  INV_H,
  INV_GAP_X,
  INV_GAP_Y,
  UFO_POINTS,
} = require("../src/logic.js");

test("rectsOverlap detects overlap but not edges that merely touch", () => {
  assert.equal(rectsOverlap(0, 0, 10, 10, 5, 5, 10, 10), true);
  assert.equal(rectsOverlap(0, 0, 10, 10, 10, 0, 10, 10), false);
  assert.equal(rectsOverlap(0, 0, 10, 10, 11, 0, 10, 10), false);
  assert.equal(rectsOverlap(0, 0, 10, 10, -5, -5, 4, 4), false);
  assert.equal(rectsOverlap(0, 0, 10, 10, 9, 9, 1, 1), true);
});

test("makeInvaders centers a full 5x11 formation", () => {
  const startY = 128;
  const invaders = makeInvaders(800, startY);
  const totalW = INV_COLS * INV_W + (INV_COLS - 1) * INV_GAP_X;
  const startX = (800 - totalW) / 2;

  assert.equal(invaders.length, INV_ROWS * INV_COLS);
  assert.equal(invaders[0].row, 0);
  assert.equal(invaders[0].col, 0);
  assert.equal(invaders[0].x, startX);
  assert.equal(invaders[0].y, startY);

  const last = invaders[invaders.length - 1];
  assert.equal(last.row, INV_ROWS - 1);
  assert.equal(last.col, INV_COLS - 1);
  assert.equal(last.x, startX + (INV_COLS - 1) * (INV_W + INV_GAP_X));
  assert.equal(last.y, startY + (INV_ROWS - 1) * (INV_H + INV_GAP_Y));

  for (const inv of invaders) {
    assert.equal(inv.alive, true);
    assert.ok(inv.x >= 0 && inv.x + INV_W <= 800);
  }
});

test("invader rows use the classic types and scores", () => {
  assert.equal(invaderTypeForRow(0), "B");
  assert.equal(pointsForRow(0), 30);
  for (const row of [1, 2]) {
    assert.equal(invaderTypeForRow(row), "A");
    assert.equal(pointsForRow(row), 20);
  }
  for (const row of [3, 4]) {
    assert.equal(invaderTypeForRow(row), "C");
    assert.equal(pointsForRow(row), 10);
  }
});

test("BUNKER_SHAPE is rectangular", () => {
  assert.equal(BUNKER_SHAPE.length, BUNKER_ROWS);
  assert.ok(BUNKER_SHAPE.every((row) => row.length === BUNKER_COLS));
});

test("makeBunkers builds full grids at the requested positions", () => {
  const bunkers = makeBunkers(432, [130, 604]);
  assert.equal(bunkers.length, 2);

  for (const b of bunkers) {
    assert.equal(b.rows, BUNKER_ROWS);
    assert.equal(b.cols, BUNKER_COLS);
    assert.equal(b.cell, BUNKER_CELL);
    assert.equal(b.w, BUNKER_COLS * BUNKER_CELL);
    assert.equal(b.h, BUNKER_ROWS * BUNKER_CELL);
    assert.equal(b.grid.length, BUNKER_ROWS);
    assert.ok(b.grid.every((row) => row.length === BUNKER_COLS));
  }

  assert.equal(bunkers[0].x, 130);
  assert.equal(bunkers[1].x, 604);
});

test("damageBunker clears cells around the impact when rng allows", () => {
  const [b] = makeBunkers(0, [0]);
  const before = b.grid.flat().filter(Boolean).length;
  const impactX = 11 * BUNKER_CELL + 1;
  const impactY = 5 * BUNKER_CELL + 1;

  assert.equal(b.grid[5][11], 1);
  damageBunker(b, impactX, impactY, 1, () => 0);

  const after = b.grid.flat().filter(Boolean).length;
  assert.ok(after < before);
  assert.equal(b.grid[5][11], 0);
});

test("damageBunker keeps cells when rng refuses", () => {
  const [b] = makeBunkers(0, [0]);
  const before = b.grid.flat().filter(Boolean).length;
  damageBunker(b, 33, 21, 1, () => 1);
  assert.equal(b.grid.flat().filter(Boolean).length, before);
});

test("damageBunker ignores impacts fully outside the grid", () => {
  const [b] = makeBunkers(0, [0]);
  const before = JSON.stringify(b.grid);
  damageBunker(b, -50, -50, 1, () => 0);
  assert.equal(JSON.stringify(b.grid), before);
});

test("eraseBunkerRect clears only the requested area", () => {
  const [b] = makeBunkers(0, [0]);
  eraseBunkerRect(b, 0, 5 * BUNKER_CELL, BUNKER_CELL * 2, BUNKER_CELL * 2);

  for (let r = 5; r <= 6; r++)
    for (let c = 0; c <= 1; c++)
      assert.equal(b.grid[r][c], 0);

  assert.equal(b.grid[7][0], 1);
});

test("bunkerOverlapsRect sees filled cells and ignores the empty arch", () => {
  const [b] = makeBunkers(0, [0]);

  assert.equal(bunkerOverlapsRect(b, 11 * BUNKER_CELL, 5 * BUNKER_CELL, 1, 1), true);

  const archX = 8 * BUNKER_CELL + 1;
  const archY = 9 * BUNKER_CELL + 1;
  assert.equal(bunkerOverlapsRect(b, archX, archY, 1, 1), false);

  assert.equal(bunkerOverlapsRect(b, -100, -100, 1, 1), false);
});

test("pickUfoPoints draws from the classic table", () => {
  assert.equal(pickUfoPoints(() => 0), UFO_POINTS[0]);
  assert.equal(pickUfoPoints(() => 0.999), UFO_POINTS[UFO_POINTS.length - 1]);
  assert.equal(pickUfoPoints(() => 1), UFO_POINTS[UFO_POINTS.length - 1]);
});

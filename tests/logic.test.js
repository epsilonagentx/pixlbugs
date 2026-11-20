/**
 * @fileoverview Unit tests for the game logic that does not need a browser:
 * geometry, the invader formation, bunkers and the saucer's points.
 */

import * as assert from 'node:assert/strict';
import {test} from 'node:test';

import {Bunker, BUNKER_CELL_SIZE, BUNKER_COLUMNS, BUNKER_ROWS, BUNKER_SHAPE, createBunkers} from '../src/game/bunkers.js';
import {rectsOverlap} from '../src/game/geometry.js';
import {createInvaders, INVADER_COLUMNS, INVADER_GAP_X, INVADER_GAP_Y, INVADER_HEIGHT, INVADER_ROWS, INVADER_WIDTH, InvaderType, invaderTypeForRow, pointsForRow} from '../src/game/invaders.js';
import {pickUfoPoints, UFO_POINTS} from '../src/game/ufo.js';

/**
 * @param {!Bunker} bunker
 * @return {number} How many cells are still standing.
 */
function countStanding(bunker) {
  return bunker.cells.flat().filter(Boolean).length;
}

test('rectsOverlap detects overlap but not edges that merely touch', () => {
  assert.equal(rectsOverlap(0, 0, 10, 10, 5, 5, 10, 10), true);
  assert.equal(rectsOverlap(0, 0, 10, 10, 10, 0, 10, 10), false);
  assert.equal(rectsOverlap(0, 0, 10, 10, 11, 0, 10, 10), false);
  assert.equal(rectsOverlap(0, 0, 10, 10, -5, -5, 4, 4), false);
  assert.equal(rectsOverlap(0, 0, 10, 10, 9, 9, 1, 1), true);
});

test('createInvaders centers a full 5x11 formation', () => {
  const top = 128;
  const invaders = createInvaders(800, top);
  const formationWidth =
      INVADER_COLUMNS * INVADER_WIDTH + (INVADER_COLUMNS - 1) * INVADER_GAP_X;
  const left = (800 - formationWidth) / 2;

  assert.equal(invaders.length, INVADER_ROWS * INVADER_COLUMNS);
  assert.equal(invaders[0].row, 0);
  assert.equal(invaders[0].column, 0);
  assert.equal(invaders[0].x, left);
  assert.equal(invaders[0].y, top);

  const last = invaders[invaders.length - 1];
  assert.equal(last.row, INVADER_ROWS - 1);
  assert.equal(last.column, INVADER_COLUMNS - 1);
  assert.equal(
      last.x, left + (INVADER_COLUMNS - 1) * (INVADER_WIDTH + INVADER_GAP_X));
  assert.equal(
      last.y, top + (INVADER_ROWS - 1) * (INVADER_HEIGHT + INVADER_GAP_Y));

  for (const invader of invaders) {
    assert.equal(invader.alive, true);
    assert.ok(invader.x >= 0 && invader.x + INVADER_WIDTH <= 800);
  }
});

test('invader rows use the classic types and scores', () => {
  assert.equal(invaderTypeForRow(0), InvaderType.SQUID);
  assert.equal(pointsForRow(0), 30);
  for (const row of [1, 2]) {
    assert.equal(invaderTypeForRow(row), InvaderType.CRAB);
    assert.equal(pointsForRow(row), 20);
  }
  for (const row of [3, 4]) {
    assert.equal(invaderTypeForRow(row), InvaderType.OCTOPUS);
    assert.equal(pointsForRow(row), 10);
  }
});

test('BUNKER_SHAPE is rectangular', () => {
  assert.equal(BUNKER_SHAPE.length, BUNKER_ROWS);
  assert.ok(BUNKER_SHAPE.every((row) => row.length === BUNKER_COLUMNS));
});

test('createBunkers builds full grids at the requested positions', () => {
  const bunkers = createBunkers(432, [130, 604]);
  assert.equal(bunkers.length, 2);

  for (const bunker of bunkers) {
    assert.equal(bunker.y, 432);
    assert.equal(bunker.width, BUNKER_COLUMNS * BUNKER_CELL_SIZE);
    assert.equal(bunker.height, BUNKER_ROWS * BUNKER_CELL_SIZE);
    assert.equal(bunker.cells.length, BUNKER_ROWS);
    assert.ok(bunker.cells.every((row) => row.length === BUNKER_COLUMNS));
  }

  assert.equal(bunkers[0].x, 130);
  assert.equal(bunkers[1].x, 604);
});

test('Bunker.damage clears cells around the impact when random allows', () => {
  const bunker = new Bunker(0, 0);
  const before = countStanding(bunker);
  const impactX = 11 * BUNKER_CELL_SIZE + 1;
  const impactY = 5 * BUNKER_CELL_SIZE + 1;

  assert.equal(bunker.cells[5][11], true);
  bunker.damage(impactX, impactY, 1, () => 0);

  assert.ok(countStanding(bunker) < before);
  assert.equal(bunker.cells[5][11], false);
});

test('Bunker.damage keeps cells when random refuses', () => {
  const bunker = new Bunker(0, 0);
  const before = countStanding(bunker);
  bunker.damage(33, 21, 1, () => 1);
  assert.equal(countStanding(bunker), before);
});

test('Bunker.damage ignores impacts fully outside the grid', () => {
  const bunker = new Bunker(0, 0);
  const before = JSON.stringify(bunker.cells);
  bunker.damage(-50, -50, 1, () => 0);
  assert.equal(JSON.stringify(bunker.cells), before);
});

test('Bunker.erase clears only the requested area', () => {
  const bunker = new Bunker(0, 0);
  bunker.erase(
      0, 5 * BUNKER_CELL_SIZE, BUNKER_CELL_SIZE * 2, BUNKER_CELL_SIZE * 2);

  for (let row = 5; row <= 6; row++) {
    for (let column = 0; column <= 1; column++) {
      assert.equal(bunker.cells[row][column], false);
    }
  }
  assert.equal(bunker.cells[7][0], true);
});

test('Bunker.overlaps sees standing cells and ignores the empty arch', () => {
  const bunker = new Bunker(0, 0);

  assert.equal(
      bunker.overlaps(11 * BUNKER_CELL_SIZE, 5 * BUNKER_CELL_SIZE, 1, 1), true);

  const archX = 8 * BUNKER_CELL_SIZE + 1;
  const archY = 9 * BUNKER_CELL_SIZE + 1;
  assert.equal(bunker.overlaps(archX, archY, 1, 1), false);

  assert.equal(bunker.overlaps(-100, -100, 1, 1), false);
});

test('pickUfoPoints draws from the classic table', () => {
  assert.equal(pickUfoPoints(() => 0), UFO_POINTS[0]);
  assert.equal(pickUfoPoints(() => 0.999), UFO_POINTS[UFO_POINTS.length - 1]);
  assert.equal(pickUfoPoints(() => 1), UFO_POINTS[UFO_POINTS.length - 1]);
});

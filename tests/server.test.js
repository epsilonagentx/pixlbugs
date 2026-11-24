/**
 * @fileoverview Tests for the static file server: what it serves, what it
 * refuses, and that it only listens on this machine by default.
 */

import * as assert from 'node:assert/strict';
import {once} from 'node:events';
import {after, before, test} from 'node:test';

import {startServer} from '../server.js';

/** @type {?Server} */
let server = null;

/** Where the test server listens, e.g. `http://127.0.0.1:41234`. */
let baseUrl = '';

before(async () => {
  delete process.env.HOST;
  server = startServer(0);
  await once(server, 'listening');
  const address = /** @type {!AddressInfo} */ (server.address());
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

test('listens on 127.0.0.1 only unless HOST is set', () => {
  const address = /** @type {!AddressInfo} */ (server.address());
  assert.equal(address.address, '127.0.0.1');
});

test('serves the page at /', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.equal(
      response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(await response.text(), /<title>Space Invaders<\/title>/);
});

test('serves modules as JavaScript, which browsers require', async () => {
  for (const path of ['/src/main.js', '/src/game/game.js']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.equal(
        response.headers.get('content-type'), 'text/javascript; charset=utf-8',
        path);
    await response.arrayBuffer();
  }
});

test('serves the stylesheet as CSS', async () => {
  const response = await fetch(`${baseUrl}/src/style.css`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/css; charset=utf-8');
  await response.arrayBuffer();
});

test('refuses files outside index.html and src/', async () => {
  const paths = [
    '/package.json',
    '/server.js',
    '/tests/server.test.js',
    '/src/..%2fpackage.json',
    '/src/%2e%2e/package.json',
    '/src',
    '/src/game/',
    '/src/missing.js',
    '/%E0%A4%A',
  ];
  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 404, path);
    await response.arrayBuffer();
  }
});

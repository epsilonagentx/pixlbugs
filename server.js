/**
 * @fileoverview A small static file server for the game. It serves
 * `index.html` and the files under `src/`, and nothing else. `npm start` and
 * the Docker image run it; `npm run dev` uses Vite instead.
 */

import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

/** The folder this file is in, which holds the page and `src/`. */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));

/** The page served at `/`. */
const PAGE_FILE = join(ROOT, 'index.html');

/** Everything under this folder is served; ends with a separator. */
const SOURCE_DIR = join(ROOT, 'src') + sep;

/** The port `npm run dev` uses too. */
const DEFAULT_PORT = 8000;

/** @const {!Object<string, string>} */
const CONTENT_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
});

/**
 * Checked on the resolved path, so an encoded `..` such as
 * `/src/..%2fpackage.json` can't climb out of `src/`.
 * @param {string} filePath An absolute, resolved path.
 * @return {boolean} Whether the server may send this file.
 */
function isAllowed(filePath) {
  return filePath === PAGE_FILE || filePath.startsWith(SOURCE_DIR);
}

/** @param {!ServerResponse} response */
function sendNotFound(response) {
  response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
  response.end('Not found');
}

/**
 * @param {!IncomingMessage} request
 * @param {!ServerResponse} response
 * @return {!Promise<void>}
 */
async function handleRequest(request, response) {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = resolve(join(ROOT, decodeURIComponent(path)));
    if (!isAllowed(filePath)) {
      sendNotFound(response);
      return;
    }
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type':
          CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch (error) {
    // A missing file, a folder, or a path that can't be decoded.
    sendNotFound(response);
  }
}

/**
 * Starts the server. If the port is taken, it tries the next one up.
 * @param {number=} port Defaults to the `PORT` environment variable, then
 *     8000. 0 picks any free port.
 * @param {string=} host Defaults to the `HOST` environment variable, then
 *     `127.0.0.1`, so only this machine can connect. The Docker image sets
 *     `HOST=0.0.0.0` so the published port can reach the server.
 * @return {!Server}
 */
export function startServer(
    port = Number(process.env.PORT ?? DEFAULT_PORT),
    host = process.env.HOST ?? '127.0.0.1') {
  const server = createServer(handleRequest);
  let currentPort = port;

  /** @param {number} tryPort */
  const listenOn = (tryPort) => {
    server.listen(tryPort, host, () => {
      if (tryPort !== currentPort) {
        return;  // A stale callback from an attempt that failed.
      }
      const address = server.address();
      const actualPort =
          typeof address === 'object' && address ? address.port : tryPort;
      console.log(`Pixlbugs running at http://localhost:${actualPort}`);
    });
  };

  server.on('error', (/** !Error */ error) => {
    if (/** @type {{code: (string|undefined)}} */ (error).code ===
        'EADDRINUSE') {
      console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}`);
      currentPort++;
      listenOn(currentPort);
      return;
    }
    throw error;
  });

  listenOn(currentPort);
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

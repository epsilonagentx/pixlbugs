# Pixlbugs

A retro shoot-'em-up built with vanilla JavaScript and the Canvas API. No
runtime dependencies and nothing to build before you play; Vite is used as the
dev server and for `npm run build`. Works fully offline.

## How to play

1. Start a server, either one:

   ```sh
   npm start          # the game's own server; nothing to install
   # or
   npm install
   npm run dev        # Vite, which reloads the page when you edit the code
   ```

   Then visit http://localhost:8000/. Both use port 8000, and `npm start` moves
   to the next free port if it's taken (set `PORT` to choose another).

   The game is written as ES modules, and browsers refuse to load modules from
   `file://`, so double-clicking `index.html` doesn't work.

2. Press **ENTER** on the title screen.

The game's server, `server.js`, serves `index.html` and the files under `src/`,
and nothing else. It listens on `127.0.0.1` only, unless `HOST` says otherwise.

## Controls

| Key              | Action        |
| ---------------- | ------------- |
| ← / → or A / D   | Move ship     |
| SPACE            | Fire          |
| P                | Pause / resume|
| M                | Mute / unmute |
| ENTER            | Start / retry |

## Rules

- Beetles are worth 20, mantises 30, flies 10 points.
- The mystery saucer is worth 50–300 random points.
- Destructible bunkers protect your ship; invaders grind them down.
- Your ship fires two bolts at once, with up to four on screen.
- An invader touching your ship destroys it.
- 3 lives. Waves get faster as the invaders die off.
- High score is saved in your browser (localStorage).

## Project layout

```
pixlbugs/
├── index.html              Page shell (entry point, stays at the root for Vite)
├── server.js               The game's own static file server (`npm start`)
├── Dockerfile              Image that runs server.js
├── compose.yaml            Runs the image from Docker Hub
├── src/
│   ├── main.js             Entry point: wires everything up, runs the frame loop
│   ├── config.js           Playfield size and layout shared by logic and drawing
│   ├── pixel_art.js        Sprite art; hitbox sizes are derived from it
│   ├── storage.js          High score and mute setting in localStorage
│   ├── style.css           CRT styling
│   ├── game/               The rules; nothing here draws
│   │   ├── game.js         Phases, score, lives, waves, and who hits what
│   │   ├── player.js       Ship: steering, twin cannon, spawn protection
│   │   ├── invaders.js     Formation, marching, and invader fire
│   │   ├── bunkers.js      Destructible bunkers
│   │   ├── ufo.js          Mystery saucer and its spawn timer
│   │   ├── bullet.js       Player and invader bullets
│   │   ├── score_popup.js  Floating score numbers
│   │   ├── geometry.js     Rectangle overlap
│   │   └── random.js       Random helpers that tests can make predictable
│   ├── render/             Everything drawn on the canvas
│   │   ├── renderer.js     Draws a whole frame
│   │   ├── playfield.js    Bunkers, saucer, fleet, bullets, ship, explosions
│   │   ├── hud.js          Scores, wave, ground line, spare ships
│   │   ├── title_screen.js Title and points table
│   │   ├── overlays.js     Wave cleared, game over, paused
│   │   ├── sprites.js      Pixel art painted onto canvases once
│   │   ├── font.js         3×5 pixel font
│   │   ├── starfield.js    Background stars
│   │   ├── palette.js      Colors
│   │   └── blink.js        Blink timing
│   ├── audio/
│   │   ├── synth.js        Tiny Web Audio synthesizer
│   │   └── sound_effects.js The game's sounds, and muting
│   └── input/
│       ├── keyboard.js     Held keys mapped to actions
│       └── controls.js     Key, focus and visibility events
└── tests/
    ├── logic.test.js       Unit tests for bunkers, collisions, and wave layout
    └── server.test.js      What server.js serves and refuses
```

The code follows the
[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html).
Dependencies only point one way: `main.js` uses everything, `render/` reads
`game/`, and `game/` never touches the canvas, so the rules can be tested in
Node.

## Development

```sh
npm test      # runs node --test; nothing to install
```

`jsconfig.json` enables editor type-checking (`checkJs`) for everything in
`src/`; it has no effect on the game and needs no build step.

## Run it in Docker

`compose.yaml` runs the published image, `epsilonagentx/pixlbugs:1.0.0`,
from Docker Hub. If the repository is private, run `docker login` first.

```sh
docker compose up -d
# open http://localhost:8000
docker compose down
```

Every `docker compose up` downloads the current image (`pull_policy: always`).

The game is published on `127.0.0.1:8000` only, for a reverse proxy on the same
machine (`http://127.0.0.1:8000`). Set `PORT` to use another port, e.g.
`PORT=8080 docker compose up -d`, and `BIND_ADDRESS=0.0.0.0` to reach the game
directly from other machines. A reverse proxy running in Docker can join the
`pixlbugs` network as an external network and use
`http://pixlbugs:8000` instead.

The container starts again after a crash or a reboot
(`restart: unless-stopped`), and `docker compose ps` shows it as `healthy` once
the server answers. It runs with a read-only filesystem, no Linux capabilities
and no way to gain privileges, within limits of 256 MB of memory, one CPU and
64 processes, and keeps at most 3 MB of logs.

To run your own changes, build an image from the source and point Compose at
it with `IMAGE`. `--pull never` makes Compose use the local image instead of
looking for it on Docker Hub:

```sh
docker build -t pixlbugs .
IMAGE=pixlbugs docker compose up -d --pull never
```

The image runs `server.js` with Node 24 as a non-root user; there's nothing to
compile. It installs Alpine's latest fixes and removes what the server doesn't
use: npm, Yarn, Corepack, `apk`, the system OpenSSL and BusyBox. A vulnerability
scan finds no known vulnerabilities in the OS or npm packages that remain.
Node's own bundled libraries, such as OpenSSL, aren't covered by that scan;
they change only with a new Node release, so rebuild the image after each one.
Without BusyBox there's no shell or basic commands in the container, so
`docker compose exec pixlbugs sh` fails; run Node instead, e.g. `docker compose
exec pixlbugs node -p process.arch`. Inside the container the server listens on
`0.0.0.0` (via `HOST`) so the published port can reach it; outside Docker it
still listens on `127.0.0.1` only.

Without Compose:

```sh
docker run --rm --init -p 8000:8000 pixlbugs
```

`--init` (`init: true` in `compose.yaml`) lets `Ctrl+C` and `docker stop` shut
the server down straight away instead of after Docker's 10-second timeout.

## Publish to Docker Hub

The image is published for both `amd64` (most PCs and servers) and `arm64`
(Apple Silicon Macs, Raspberry Pi, ARM servers). Replace `1.0.0` with the
version in `package.json`, and `<user>` with your Docker Hub username. For a
new version, also change the `image` line in `compose.yaml`.

**1. Build an image file for each processor** into `docker-build/` (ignored by
git and Docker):

```sh
for arch in amd64 arm64; do
  mkdir -p docker-build/$arch
  docker buildx build --platform linux/$arch \
    -t pixlbugs:1.0.0-$arch \
    --output type=docker,dest=docker-build/$arch/pixlbugs-1.0.0-$arch.tar .
done
```

This gives `docker-build/amd64/pixlbugs-1.0.0-amd64.tar` and
`docker-build/arm64/pixlbugs-1.0.0-arm64.tar`. Building the `arm64` image
on an `amd64` machine needs QEMU emulation: Docker Desktop includes it, and on
Linux `docker run --privileged --rm tonistiigi/binfmt --install arm64` adds it.

**2. Test both images with Compose before uploading.** `IMAGE` picks the image
to run, and `--pull never` makes Compose use the local image. Open
`http://localhost:8000` while each one runs:

```sh
IMAGE=pixlbugs:1.0.0-amd64 docker compose up -d --pull never
docker compose exec pixlbugs node -p process.arch    # x64
docker compose down

# the ARM image, under emulation on an amd64 machine:
IMAGE=pixlbugs:1.0.0-arm64 DOCKER_DEFAULT_PLATFORM=linux/arm64 docker compose up -d --pull never
docker compose exec pixlbugs node -p process.arch    # arm64
docker compose down
```

If the images aren't loaded on this machine yet, run
`docker load -i docker-build/<arch>/pixlbugs-1.0.0-<arch>.tar` first.

**3. Upload them.** Docker Hub doesn't take `.tar` files directly: load each
file into Docker, tag it with your username, and push it. Then join the two
into one `1.0.0` tag and one `latest` tag that cover both processors:

```sh
docker login
for arch in amd64 arm64; do
  docker load -i docker-build/$arch/pixlbugs-1.0.0-$arch.tar
  docker tag pixlbugs:1.0.0-$arch <user>/pixlbugs:1.0.0-$arch
  docker push <user>/pixlbugs:1.0.0-$arch
done
docker buildx imagetools create \
  -t <user>/pixlbugs:1.0.0 -t <user>/pixlbugs:latest \
  <user>/pixlbugs:1.0.0-amd64 <user>/pixlbugs:1.0.0-arm64
```

`docker buildx imagetools inspect <user>/pixlbugs:latest` should list
`linux/amd64` and `linux/arm64`.

**4. Test it from Docker Hub.** Compose downloads the current image on every
`up` of the `image` in `compose.yaml` (`<user>/pixlbugs:<version>`):

```sh
docker compose up -d
docker compose exec pixlbugs node -p process.arch    # x64
docker compose down

# the ARM image, under emulation on an amd64 machine:
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker compose up -d
docker compose exec pixlbugs node -p process.arch    # arm64
docker compose down
```

Or without Compose:

```sh
docker run --pull always --rm --init -p 8000:8000 <user>/pixlbugs
# the ARM image, under emulation on an amd64 machine:
docker run --pull always --rm --init --platform linux/arm64 -p 8000:8000 <user>/pixlbugs
```

## Known simplifications

- Keyboard only; there are no touch controls.
- Bunker damage is cell-based rather than per-pixel.
- Player and invader bullets pass through each other.

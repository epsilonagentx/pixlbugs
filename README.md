# Space Invaders

A retro clone of the 1978 arcade classic, built with vanilla JavaScript and the
Canvas API. No runtime dependencies and no build step; Vite is used only as a
dev server. Works fully offline.

## How to play

1. Start the dev server:

   ```sh
   npm install
   npm run dev
   # then visit http://localhost:8000/
   ```

   The game is written as ES modules, and browsers refuse to load modules from
   `file://`, so double-clicking `index.html` no longer works. Any static web
   server will do; Vite is just the one that's set up.

2. Press **ENTER** on the title screen.

## Controls

| Key              | Action        |
| ---------------- | ------------- |
| ← / → or A / D   | Move ship     |
| SPACE            | Fire          |
| P                | Pause / resume|
| M                | Mute / unmute |
| ENTER            | Start / retry |

## Rules

- Crabs are worth 20, squids 30, octopuses 10 points (like the original).
- The mystery saucer is worth 50–300 random points.
- Destructible bunkers protect your ship; invaders grind them down.
- Your ship fires two bolts at once, with up to four on screen.
- An invader touching your ship destroys it.
- 3 lives. Waves get faster as the invaders die off.
- High score is saved in your browser (localStorage).

## Project layout

```
space-invaders/
├── index.html              Page shell (entry point, stays at the root for Vite)
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
    └── logic.test.js       Unit tests for bunkers, collisions, and wave layout
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

## Known simplifications

- Keyboard only; there are no touch controls.
- Bunker damage is cell-based rather than per-pixel.
- Player and invader bullets pass through each other.

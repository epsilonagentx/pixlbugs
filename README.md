# Space Invaders

A retro clone of the 1978 arcade classic, built with vanilla JavaScript and the
Canvas API. No runtime dependencies and no build step; Vite is used only as a
dev server. Works fully offline.

## How to play

1. Open `index.html` in Chrome (double-click the file or drag it into a tab), or
   run the dev server:

   ```sh
   npm install
   npm run dev
   # then visit http://localhost:8000/
   ```

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

| File                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `game.js`               | Canvas rendering, audio, input, game loop              |
| `logic.js`              | Shared config and pure simulation helpers (no DOM)     |
| `tests/logic.test.js`   | Unit tests for bunkers, collisions, and wave layout    |
| `index.html`, `style.css` | Page shell and CRT styling                           |

`logic.js` is loaded as a classic script before `game.js`, so the game still runs
straight from `file://` — no bundler or module server needed.

## Development

```sh
npm test      # runs node --test; nothing to install
```

Node is only required for the tests. `jsconfig.json` enables editor
type-checking (`checkJs`) for `game.js` and `logic.js`; it has no effect on the
game and needs no build step.

## Known simplifications

- Keyboard only; there are no touch controls.
- Bunker damage is cell-based rather than per-pixel.
- Player and invader bullets pass through each other.

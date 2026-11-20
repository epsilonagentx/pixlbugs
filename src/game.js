"use strict";

/* ============================================================
   SPACE INVADERS — retro arcade clone
   Vanilla JS + Canvas. No dependencies. Works from file://
   Shared config and pure logic live in logic.js.
   ============================================================ */

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("game"));
const ctx = canvas.getContext("2d");
const W = canvas.width;   // 800
const H = canvas.height;  // 600

/* ---------------- states & input ---------------- */
const STATE = Object.freeze({
  TITLE: "title",
  PLAYING: "playing",
  PAUSED: "paused",
  LEVELUP: "levelup",
  GAMEOVER: "gameover",
});

const KEY_BINDINGS = Object.freeze({
  left: ["arrowleft", "a"],
  right: ["arrowright", "d"],
  fire: [" "],
});

const keys = Object.create(null);
function isHeld(action) {
  return KEY_BINDINGS[action].some((key) => keys[key]);
}

/* ---------------- layout & tuning ---------------- */
const MARGIN = 18;
const LINE_Y = 552;
const BUNKER_Y = 432;
const BUNKER_XS = [130, 288, 446, 604];
const PLAYER_Y = 506;
const PLAYER_SPEED = 330;
const PLAYER_MAX_BULLETS = 4;
const PLAYER_RELOAD = 0.32;
const TWIN_SHOT_OFFSET = 8;
const PLAYER_BULLET_SPEED = 700;
const PLAYER_DEATH_DURATION = 1.7;
const PLAYER_INVINCIBLE_TIME = 1.5;
const BULLET_CULL_Y = 44;

const INV_START_Y = 128;
const INV_BASE_SPEED = 20;
const INV_DROP = 12;
const MARCH_SOUND_DISTANCE = 22;
const LEVELUP_DURATION = 2.2;

const INVADER_MAX_BULLETS = 3;
const INVADER_BULLET_BASE_SPEED = 170;
const INVADER_BULLET_SPEED_PER_LEVEL = 10;

const BUNKER_DAMAGE_RADIUS = 1;

const UFO_Y = 74;
const UFO_SPEED = 95;
const UFO_ENTRY_OFFSET = 11;
const UFO_DESPAWN_MARGIN = 50;
const UFO_FIRST_SPAWN_MIN = 12;
const UFO_FIRST_SPAWN_MAX = 22;
const UFO_RESPAWN_MIN = 18;
const UFO_RESPAWN_MAX = 32;

const MAX_DT = 1 / 30;
const GLYPH_ADVANCE = 4;

/* ---------------- palette ---------------- */
const COL = {
  white: "#f4f4f4",
  cyan: "#45e6e6",
  green: "#4dff7c",
  red: "#ff4d6d",
  bunker: "#19e57a",
  player: "#eaffea",
  bullet: "#fff",
  dim: "#777",
  sky: "#9fd8ff",
  gold: "#ffd23f",
};

/* ---------------- 3x5 bitmap font ---------------- */
const FONT = {
  "0": ["111","101","101","101","111"],
  "1": ["010","110","010","010","111"],
  "2": ["111","001","111","100","111"],
  "3": ["111","001","011","001","111"],
  "4": ["101","101","111","001","001"],
  "5": ["111","100","111","001","111"],
  "6": ["111","100","111","101","111"],
  "7": ["111","001","010","010","010"],
  "8": ["111","101","111","101","111"],
  "9": ["111","101","111","001","111"],
  "A": ["010","101","111","101","101"],
  "C": ["011","100","100","100","011"],
  "D": ["110","101","101","101","110"],
  "E": ["111","100","110","100","111"],
  "F": ["111","100","110","100","100"],
  "G": ["011","100","101","101","011"],
  "H": ["101","101","111","101","101"],
  "I": ["111","010","010","010","111"],
  "L": ["100","100","100","100","111"],
  "M": ["101","111","111","101","101"],
  "N": ["101","111","111","111","101"],
  "O": ["010","101","101","101","010"],
  "P": ["111","101","111","100","100"],
  "R": ["111","101","110","101","101"],
  "S": ["111","100","010","001","111"],
  "T": ["111","010","010","010","010"],
  "U": ["101","101","101","101","111"],
  "V": ["101","101","101","101","010"],
  "W": ["101","101","101","111","010"],
  "X": ["101","101","010","101","101"],
  "Y": ["101","101","010","010","010"],
  "-": ["000","000","111","000","000"],
  "!": ["010","010","010","000","010"],
  "?": ["111","001","010","000","001"],
  " ": ["000","000","000","000","000"],
};

function textWidth(str, s) { return str.length * GLYPH_ADVANCE * s - s; }
function drawText(str, x, y, s, color = COL.white, align = "left") {
  if (align === "center") x -= textWidth(str, s) / 2;
  else if (align === "right") x -= textWidth(str, s);
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of str) {
    const glyph = FONT[ch] || FONT[" "];
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 3; col++)
        if (glyph[row][col] === "1") ctx.fillRect(cx + col * s, y + row * s, s, s);
    cx += GLYPH_ADVANCE * s;
  }
}

/* ---------------- sprites (pixel maps -> canvases) ---------------- */
function makeSprite(rows, s, color) {
  const c = document.createElement("canvas");
  c.width = rows[0].length * s;
  c.height = rows.length * s;
  const g = c.getContext("2d");
  g.fillStyle = color;
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y].length; x++)
      if (rows[y][x] === "#") g.fillRect(x * s, y * s, s, s);
  return c;
}

const SPRITES = {
  player: makeSprite([
    "......#......",
    ".....###.....",
    ".....###.....",
    ".############",
    "#############",
    "#############",
    "#############",
    "#############",
  ], SCALE, COL.player),

  ufo: makeSprite([
    "...#####...",
    "..#######..",
    ".#########.",
    "##.##.##.##",
    "..########.",
  ], SCALE, COL.red),

  // mid rows: crab, 20 pts (cyan)
  invA: [makeSprite([
    "...##...",
    "..####..",
    "########",
    "##.##.##",
    "########",
    "..#..#..",
    "#.#..#.#",
    "##....##",
  ], SCALE, COL.cyan), makeSprite([
    "...##...",
    "..####..",
    "########",
    "##.##.##",
    "########",
    ".#.##.#.",
    "..#..#..",
    ".#....#.",
  ], SCALE, COL.cyan)],

  // top row: squid, 30 pts (white)
  invB: [makeSprite([
    "...##...",
    "..####..",
    ".######.",
    "##.##.##",
    "########",
    "..####..",
    ".##..##.",
    ".#....#.",
  ], SCALE, COL.white), makeSprite([
    "...##...",
    "..####..",
    ".######.",
    "##.##.##",
    "########",
    ".#.##.#.",
    "..#..#..",
    ".#....#.",
  ], SCALE, COL.white)],

  // bottom rows: octopus, 10 pts (green)
  invC: [makeSprite([
    "..####..",
    ".######.",
    "########",
    "########",
    ".##..##.",
    ".##..##.",
    ".#.##.#.",
    "..#.##..",
  ], SCALE, COL.green), makeSprite([
    "..####..",
    ".######.",
    "########",
    "########",
    ".##..##.",
    ".#.##.#.",
    "..#..#..",
    ".#....#.",
  ], SCALE, COL.green)],

  invBullet: [makeSprite([
    "..##",
    ".##.",
    "##..",
    "....",
    ".#..",
    ".##.",
  ], SCALE, COL.bullet), makeSprite([
    ".##.",
    "..#.",
    "....",
    "....",
    "##..",
    ".##.",
  ], SCALE, COL.bullet)],

  playerBullet: makeSprite([
    "##", "##", "##", "##",
    "##", "##", "##", "##",
  ], SCALE, COL.bullet),
};

/* Sizes derived from the art, so sprites and hitboxes cannot drift. */
const PLAYER_W = SPRITES.player.width;
const PLAYER_H = SPRITES.player.height;
const PLAYER_BULLET_W = SPRITES.playerBullet.width;
const PLAYER_BULLET_H = SPRITES.playerBullet.height;
const INVADER_BULLET_W = SPRITES.invBullet[0].width;
const INVADER_BULLET_H = SPRITES.invBullet[0].height;

console.assert(
  SPRITES.invA[0].width === INV_W && SPRITES.invA[0].height === INV_H,
  "invader sprite dimensions must match INV_W/INV_H",
);

const TITLE_LAYOUT = Object.freeze({
  legendIconX: 300,
  legendLabelX: 380,
  legendTop: 180,
  legendRowH: 52,
  startPromptY: 448,
  controlsY: 508,
});

/* ---------------- sound (Web Audio, no files) ---------------- */
const sfx = {
  ctx: /** @type {any} */ (null),
  master: /** @type {any} */ (null),
  noiseBuffer: /** @type {any} */ (null),
  muted: false,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    try { localStorage.setItem("si-muted", this.muted ? "1" : "0"); } catch (e) { /* ignore */ }
    if (!this.muted) this.tone({ freq: 660, dur: 0.06, vol: 0.08 });
  },
  getNoiseBuffer() {
    if (!this.noiseBuffer) {
      const length = this.ctx.sampleRate; // one second of white noise
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  },
  tone(o) {
    if (!this.ctx) return;
    const { freq = 440, freqEnd = 0, type = "square", dur = 0.1, vol = 0.15, delay = 0 } = o;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },
  noise(o) {
    if (!this.ctx) return;
    const { dur = 0.3, vol = 0.3, freq = 800 } = o;
    const t = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.getNoiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t);
    source.stop(t + dur + 0.02);
  },
  shoot() { this.tone({ freq: 880, freqEnd: 220, dur: 0.09, vol: 0.1 }); },
  invaderKilled() { this.noise({ dur: 0.12, vol: 0.16, freq: 1400 }); },
  march(i) { this.tone({ freq: [523, 440, 392, 330][i % 4], dur: 0.055, vol: 0.04 }); },
  explosion() {
    this.noise({ dur: 0.7, vol: 0.35, freq: 400 });
    this.tone({ freq: 120, freqEnd: 30, type: "sawtooth", dur: 0.7, vol: 0.18 });
  },
  invaderShoot() { this.tone({ freq: 300, freqEnd: 150, type: "sawtooth", dur: 0.08, vol: 0.04 }); },
  ufoBlip() { this.tone({ freq: 620, freqEnd: 500, dur: 0.08, vol: 0.045 }); },
  ufoHit() { this.noise({ dur: 0.25, vol: 0.2, freq: 900 }); this.tone({ freq: 700, freqEnd: 200, dur: 0.25, vol: 0.08 }); },
  levelup() { [392, 494, 587, 784].forEach((f, i) => this.tone({ freq: f, dur: 0.1, vol: 0.1, delay: i * 0.09 })); },
  gameover() { [440, 392, 330, 262, 196].forEach((f, i) => this.tone({ freq: f, dur: 0.16, vol: 0.1, delay: i * 0.15 })); },
};

try { sfx.muted = localStorage.getItem("si-muted") === "1"; } catch (e) { /* private mode */ }

/* ---------------- starfield background ---------------- */
const starsCanvas = document.createElement("canvas");
starsCanvas.width = W;
starsCanvas.height = H;
(function initStars() {
  const g = starsCanvas.getContext("2d");
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(255,255,255,${(0.08 + Math.random() * 0.25).toFixed(2)})`;
    g.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 2, 2);
  }
})();

/* ============================================================
   GAME STATE
   ============================================================ */
function loadHiScore() {
  try { return Number(localStorage.getItem("si-hiscore") || 0) || 0; } catch (e) { return 0; }
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * @typedef {Object} GameState
 * @property {string} state
 * @property {number} score
 * @property {number} hiScore
 * @property {number} lives
 * @property {number} level
 * @property {any} player
 * @property {any[]} invaders
 * @property {any[]} bunkers
 * @property {any[]} playerBullets
 * @property {any[]} invaderBullets
 * @property {any[]} popups
 * @property {any} ufo
 * @property {number} ufoTimer
 * @property {number} invDir
 * @property {number} invShootTimer
 * @property {number} marchAccum
 * @property {number} marchNote
 * @property {number} levelupTimer
 * @property {number} time
 * @property {string} gameOverReason
 */

/** @type {GameState} */
const game = {
  state: STATE.TITLE,
  score: 0,
  hiScore: loadHiScore(),
  lives: 3,
  level: 1,
  player: null,
  invaders: [],
  bunkers: [],
  playerBullets: [],
  invaderBullets: [],
  popups: [],
  ufo: null,
  ufoTimer: 0,
  invDir: 1,
  invShootTimer: 0,
  marchAccum: 0,
  marchNote: 0,
  levelupTimer: 0,
  time: 0,
  gameOverReason: "GAME OVER",
};

function resetPlayer() {
  game.player = {
    x: W / 2 - PLAYER_W / 2,
    y: PLAYER_Y,
    w: PLAYER_W,
    h: PLAYER_H,
    dying: false,
    deathTimer: 0,
    cooldown: 0,
    invincible: PLAYER_INVINCIBLE_TIME,
  };
}

function setupLevel() {
  game.invaders = makeInvaders(W, INV_START_Y);
  game.invDir = 1;
  game.invShootTimer = 1.6;
  game.marchAccum = 0;
  game.marchNote = 0;
  game.bunkers = makeBunkers(BUNKER_Y, BUNKER_XS);
  game.playerBullets = [];
  game.invaderBullets = [];
  game.popups = [];
  game.ufo = null;
  game.ufoTimer = randRange(UFO_FIRST_SPAWN_MIN, UFO_FIRST_SPAWN_MAX);
  resetPlayer();
}

function startGame() {
  game.score = 0;
  game.lives = 3;
  game.level = 1;
  setupLevel();
  game.state = STATE.PLAYING;
}

function addScore(n) {
  game.score += n;
  if (game.score > game.hiScore) game.hiScore = game.score;
}

function gameOver(reason) {
  game.state = STATE.GAMEOVER;
  game.gameOverReason = reason;
  if (game.score > game.hiScore) game.hiScore = game.score;
  try { localStorage.setItem("si-hiscore", String(game.hiScore)); } catch (e) { /* ignore */ }
  sfx.gameover();
}

function killPlayer() {
  if (game.player.dying) return;
  game.player.dying = true;
  game.player.deathTimer = PLAYER_DEATH_DURATION;
  game.lives--;
  game.invaderBullets = [];
  sfx.explosion();
}

/* ============================================================
   UPDATE
   ============================================================ */
function update(dt) {
  game.time += dt;

  if (game.state === STATE.PLAYING) updatePlaying(dt);
  else if (game.state === STATE.LEVELUP) {
    game.levelupTimer -= dt;
    if (game.levelupTimer <= 0) {
      game.level++;
      setupLevel();
      game.state = STATE.PLAYING;
    }
  }
  // title / paused / gameover wait for input
}

function updatePlaying(dt) {
  // Snapshot before any kills this frame; the steps below rely on the
  // fleet as it stood at the start of the tick.
  const aliveInv = game.invaders.filter((a) => a.alive);
  if (!updatePlayer(dt)) return;
  if (!updateInvaders(dt, aliveInv)) return;
  updateInvaderFire(dt, aliveInv);
  updateBullets(dt);
  updateUfo(dt);
}

/* Returns false when the game is over. */
function updatePlayer(dt) {
  const player = game.player;

  if (player.dying) {
    player.deathTimer -= dt;
    if (player.deathTimer <= 0) {
      if (game.lives > 0) resetPlayer();
      else {
        gameOver("GAME OVER");
        return false;
      }
    }
    return true;
  }

  if (isHeld("left")) player.x -= PLAYER_SPEED * dt;
  if (isHeld("right")) player.x += PLAYER_SPEED * dt;
  player.x = Math.max(MARGIN, Math.min(W - MARGIN - player.w, player.x));

  if (player.invincible > 0) player.invincible -= dt;
  player.cooldown -= dt;

  if (isHeld("fire") && player.cooldown <= 0 &&
      game.playerBullets.length + 2 <= PLAYER_MAX_BULLETS) {
    const centerX = player.x + player.w / 2;
    for (const offset of [-TWIN_SHOT_OFFSET, TWIN_SHOT_OFFSET]) {
      game.playerBullets.push({
        x: centerX + offset - PLAYER_BULLET_W / 2,
        y: player.y - PLAYER_BULLET_H,
        w: PLAYER_BULLET_W,
        h: PLAYER_BULLET_H,
      });
    }
    player.cooldown = PLAYER_RELOAD;
    sfx.shoot();
  }

  return true;
}

/* Returns false when the wave ends or the invaders reach the line. */
function updateInvaders(dt, aliveInv) {
  if (!aliveInv.length) return finishWave();

  const frac = aliveInv.length / (INV_ROWS * INV_COLS);
  const speed = INV_BASE_SPEED * (1 + 4 * (1 - frac));
  let minX = Infinity;
  let maxX = -Infinity;
  for (const a of aliveInv) {
    if (a.x < minX) minX = a.x;
    if (a.x + INV_W > maxX) maxX = a.x + INV_W;
  }

  const step = speed * dt * game.invDir;
  if ((game.invDir > 0 && maxX + step > W - MARGIN) ||
      (game.invDir < 0 && minX + step < MARGIN)) {
    game.invDir *= -1;
    for (const a of aliveInv) a.y += INV_DROP;
    game.marchNote = 0;
  } else {
    for (const a of aliveInv) a.x += step;
  }
  game.marchAccum += Math.abs(step);
  while (game.marchAccum >= MARCH_SOUND_DISTANCE) {
    game.marchAccum -= MARCH_SOUND_DISTANCE;
    sfx.march(game.marchNote++);
  }

  // An invader touching the ship destroys it.
  if (!game.player.dying && game.player.invincible <= 0) {
    for (const a of aliveInv) {
      if (rectsOverlap(a.x, a.y, INV_W, INV_H,
                       game.player.x, game.player.y, game.player.w, game.player.h)) {
        killPlayer();
        break;
      }
    }
  }

  let maxY = -Infinity;
  for (const a of aliveInv) if (a.y + INV_H > maxY) maxY = a.y + INV_H;
  if (maxY >= LINE_Y) {
    gameOver("INVASION!");
    return false;
  }

  // Invaders grind away any bunker they touch.
  for (const b of game.bunkers)
    for (const a of aliveInv)
      if (rectsOverlap(a.x, a.y, INV_W, INV_H, b.x, b.y, b.w, b.h))
        eraseBunkerRect(b, a.x, a.y, INV_W, INV_H);

  return true;
}

function finishWave() {
  game.state = STATE.LEVELUP;
  game.levelupTimer = LEVELUP_DURATION;
  // drop in-flight props so the banner is not drawn over frozen bullets
  game.playerBullets = [];
  game.invaderBullets = [];
  game.ufo = null;
  sfx.levelup();
  return false;
}

function updateInvaderFire(dt, aliveInv) {
  game.invShootTimer -= dt;
  if (game.invaderBullets.length >= INVADER_MAX_BULLETS ||
      game.invShootTimer > 0 ||
      game.player.dying) return;

  const frac = aliveInv.length / (INV_ROWS * INV_COLS);
  game.invShootTimer = (0.55 + Math.random() * 1.1) * (0.35 + 0.85 * frac);

  const columns = [...new Set(aliveInv.map((a) => a.col))];
  const col = columns[(Math.random() * columns.length) | 0];
  let shooter = null;
  for (const a of aliveInv)
    if (a.col === col && (!shooter || a.y > shooter.y)) shooter = a;
  if (!shooter) return;

  game.invaderBullets.push({
    x: shooter.x + INV_W / 2 - INVADER_BULLET_W / 2,
    y: shooter.y + INV_H,
    w: INVADER_BULLET_W,
    h: INVADER_BULLET_H,
    vy: INVADER_BULLET_BASE_SPEED + game.level * INVADER_BULLET_SPEED_PER_LEVEL,
  });
  sfx.invaderShoot();
}

function updateBullets(dt) {
  for (const p of game.playerBullets) p.y -= PLAYER_BULLET_SPEED * dt;

  /* --- player bullets vs UFO --- */
  if (game.ufo) {
    for (const p of game.playerBullets) {
      if (p.dead) continue;
      if (rectsOverlap(p.x, p.y, p.w, p.h, game.ufo.x, game.ufo.y, game.ufo.w, game.ufo.h)) {
        p.dead = true;
        const points = pickUfoPoints();
        addScore(points);
        game.popups.push({
          x: game.ufo.x + game.ufo.w / 2,
          y: game.ufo.y,
          text: String(points),
          t: 1.0,
          max: 1.0,
        });
        game.ufo = null;
        game.ufoTimer = randRange(UFO_RESPAWN_MIN, UFO_RESPAWN_MAX);
        sfx.ufoHit();
        break;
      }
    }
  }

  /* --- player bullets vs invaders --- */
  for (const p of game.playerBullets) {
    if (p.dead) continue;
    for (const a of game.invaders) {
      if (!a.alive) continue;
      if (rectsOverlap(p.x, p.y, p.w, p.h, a.x, a.y, INV_W, INV_H)) {
        a.alive = false;
        p.dead = true;
        addScore(a.points);
        game.popups.push({
          x: a.x + INV_W / 2,
          y: a.y,
          text: String(a.points),
          t: 0.9,
          max: 0.9,
        });
        sfx.invaderKilled();
        break;
      }
    }
  }

  /* --- player bullets vs bunkers --- */
  for (const p of game.playerBullets) {
    if (p.dead) continue;
    for (const b of game.bunkers) {
      if (bunkerOverlapsRect(b, p.x, p.y, p.w, p.h)) {
        p.dead = true;
        damageBunker(b, p.x + p.w / 2, p.y, BUNKER_DAMAGE_RADIUS);
        break;
      }
    }
  }

  /* --- invader bullets --- */
  for (const b of game.invaderBullets) b.y += b.vy * dt;
  for (const b of game.invaderBullets) {
    if (b.dead || b.y > H) continue;

    for (const k of game.bunkers) {
      if (bunkerOverlapsRect(k, b.x, b.y, b.w, b.h)) {
        b.dead = true;
        // moving down: the leading edge is the bottom of the sprite
        damageBunker(k, b.x + b.w / 2, b.y + b.h, BUNKER_DAMAGE_RADIUS);
        break;
      }
    }

    if (!b.dead && !game.player.dying && game.player.invincible <= 0 &&
        rectsOverlap(b.x, b.y, b.w, b.h,
                     game.player.x, game.player.y, game.player.w, game.player.h)) {
      b.dead = true;
      killPlayer();
    }
  }

  /* --- cleanup --- */
  game.playerBullets = game.playerBullets.filter((b) => !b.dead && b.y > BULLET_CULL_Y);
  game.invaderBullets = game.invaderBullets.filter((b) => !b.dead && b.y < H);
  for (const p of game.popups) p.t -= dt;
  game.popups = game.popups.filter((p) => p.t > 0);
}

function updateUfo(dt) {
  game.ufoTimer -= dt;
  if (!game.ufo && game.ufoTimer <= 0) {
    const fromLeft = Math.random() < 0.5;
    game.ufo = {
      x: fromLeft ? -(SPRITES.ufo.width + UFO_ENTRY_OFFSET) : W + 4,
      y: UFO_Y,
      w: SPRITES.ufo.width,
      h: SPRITES.ufo.height,
      dir: fromLeft ? 1 : -1,
      blip: 0,
    };
  }

  if (!game.ufo) return;

  game.ufo.x += UFO_SPEED * game.ufo.dir * dt;
  game.ufo.blip -= dt;
  if (game.ufo.blip <= 0) {
    game.ufo.blip = 0.28;
    sfx.ufoBlip();
  }

  if (game.ufo.x > W + UFO_DESPAWN_MARGIN || game.ufo.x < -UFO_DESPAWN_MARGIN) {
    game.ufo = null;
    game.ufoTimer = randRange(UFO_RESPAWN_MIN, UFO_RESPAWN_MAX);
  }
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(starsCanvas, 0, 0);

  if (game.state === STATE.TITLE) {
    renderTopBar();
    renderTitle();
    return;
  }

  renderTopBar();
  renderField();
  renderBottomLine();

  if (game.state === STATE.LEVELUP) {
    drawText("WAVE " + game.level + " CLEARED", W / 2, 270, 4, COL.green, "center");
    drawText("GET READY FOR WAVE " + (game.level + 1), W / 2, 320, 2, COL.sky, "center");
  } else if (game.state === STATE.GAMEOVER) {
    drawText(game.gameOverReason, W / 2, LINE_Y - 20, 4, COL.red, "center");
    drawText("FINAL SCORE " + String(game.score).padStart(6, "0"), W / 2, LINE_Y + 22, 2, COL.white, "center");
    if (Math.floor(game.time * 2) % 2 === 0)
      drawText("PRESS ENTER", W / 2, LINE_Y + 38, 2, COL.green, "center");
  } else if (game.state === STATE.PAUSED) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    drawText("PAUSED", W / 2, 270, 5, COL.white, "center");
    drawText("PRESS P TO RESUME", W / 2, 330, 2, COL.green, "center");
  }
}

function renderTopBar() {
  drawText("HI-SCORE", 16, 12, 2, COL.red);
  drawText(String(game.hiScore).padStart(6, "0"), 16, 30, 2, COL.white);
  drawText("SCORE", W / 2, 12, 2, COL.red, "center");
  drawText(String(game.score).padStart(6, "0"), W / 2, 30, 2, COL.white, "center");
  drawText("WAVE " + game.level, W - 16, 12, 2, COL.green, "right");
  if (sfx.muted) drawText("MUTED", W - 16, 30, 2, COL.dim, "right");
}

function renderField() {
  const frameAnim = Math.floor(game.time / 0.4) % 2;

  for (const b of game.bunkers) {
    ctx.fillStyle = COL.bunker;
    for (let r = 0; r < b.rows; r++)
      for (let c = 0; c < b.cols; c++)
        if (b.grid[r][c]) ctx.fillRect(b.x + c * b.cell, b.y + r * b.cell, b.cell, b.cell);
  }

  if (game.ufo) ctx.drawImage(SPRITES.ufo, game.ufo.x, game.ufo.y);

  for (const a of game.invaders)
    if (a.alive) ctx.drawImage(SPRITES["inv" + a.type][frameAnim], a.x, a.y);

  for (const p of game.playerBullets) ctx.drawImage(SPRITES.playerBullet, p.x, p.y);
  for (const b of game.invaderBullets)
    ctx.drawImage(SPRITES.invBullet[Math.floor(game.time * 10) % 2], b.x, b.y);

  if (game.state === STATE.PLAYING || game.state === STATE.LEVELUP) {
    if (game.player.dying) {
      drawExplosion(game.player.x + game.player.w / 2,
                    game.player.y + game.player.h / 2,
                    PLAYER_DEATH_DURATION - game.player.deathTimer);
    } else if (!(game.player.invincible > 0 && Math.floor(game.time * 12) % 2 === 0)) {
      ctx.drawImage(SPRITES.player, game.player.x, game.player.y);
    }
  }

  for (const p of game.popups)
    drawText(p.text, p.x, p.y - (1 - p.t / p.max) * 20, 2, COL.gold, "center");
}

function renderBottomLine() {
  ctx.fillStyle = COL.bunker;
  ctx.fillRect(0, LINE_Y, W, 2);
  for (let i = 0; i < game.lives; i++)
    ctx.drawImage(SPRITES.player, 16 + i * 44, LINE_Y + 10, 26, 16);
  drawText("X " + game.lives, 16 + 3 * 44 + 6, LINE_Y + 12, 2, COL.white);
}

function renderTitle() {
  drawText("SPACE INVADERS", W / 2, 92, 6, COL.white, "center");

  const legend = [
    [SPRITES.invB[0], 48, 48, "30 POINTS", COL.white],
    [SPRITES.invA[0], 48, 48, "20 POINTS", COL.cyan],
    [SPRITES.invC[0], 48, 48, "10 POINTS", COL.green],
    [SPRITES.ufo,    66, 30, "??? POINTS", COL.red],
  ];
  let y = TITLE_LAYOUT.legendTop;
  for (const [img, dw, dh, label, color] of legend) {
    ctx.drawImage(img, TITLE_LAYOUT.legendIconX, y + (48 - dh) / 2, dw, dh);
    drawText(label, TITLE_LAYOUT.legendLabelX, y + 14, 2, color);
    y += TITLE_LAYOUT.legendRowH;
  }

  if (Math.floor(game.time * 2) % 2 === 0)
    drawText("PRESS ENTER TO START", W / 2, TITLE_LAYOUT.startPromptY, 3, COL.green, "center");
  drawText("ARROWS MOVE   SPACE FIRE   P PAUSE   M MUTE",
           W / 2, TITLE_LAYOUT.controlsY, 2, COL.dim, "center");
}

function drawExplosion(cx, cy, t) {
  const r = 6 + t * 34;
  ctx.save();
  ctx.translate(cx, cy);
  const colors = [COL.bullet, COL.gold, COL.red];
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + 0.3;
    ctx.strokeStyle = colors[i % 3];
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r * 0.3, Math.sin(ang) * r * 0.3);
    ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================
   INPUT
   ============================================================ */
function releaseKeys() {
  for (const key in keys) keys[key] = false;
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key))
    e.preventDefault();
  if (!e.repeat) sfx.ensure(); // unlock audio on first gesture
  keys[key] = true;
  if (e.repeat) return;

  if (key === "enter") {
    if (game.state === STATE.TITLE) startGame();
    else if (game.state === STATE.GAMEOVER) game.state = STATE.TITLE;
  }
  if (key === " " && game.state === STATE.TITLE) startGame();
  if (key === "p") {
    if (game.state === STATE.PLAYING) game.state = STATE.PAUSED;
    else if (game.state === STATE.PAUSED) game.state = STATE.PLAYING;
  }
  if (key === "m") sfx.toggleMute();
});

window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

window.addEventListener("blur", () => {
  releaseKeys();
  if (game.state === STATE.PLAYING) game.state = STATE.PAUSED;
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) return;
  releaseKeys();
  if (game.state === STATE.PLAYING) game.state = STATE.PAUSED;
});

canvas.addEventListener("pointerdown", () => sfx.ensure());

/* ============================================================
   MAIN LOOP
   ============================================================ */
setupLevel(); // so the title screen has a valid world behind it
let last = performance.now();

function frame(now) {
  const dt = Math.max(0, Math.min(MAX_DT, (now - last) / 1000));
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

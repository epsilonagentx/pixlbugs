/**
 * @fileoverview The rules of the game: phases, score, lives and waves, and
 * how the ship, the fleet, the bunkers, the bullets and the saucer interact.
 */

import {SoundEffects} from '../audio/sound_effects.js';
import {GROUND_Y, PLAYFIELD_HEIGHT} from '../config.js';
import {Action, Keyboard} from '../input/keyboard.js';
import {loadHighScore, saveHighScore} from '../storage.js';

import {Bullet} from './bullet.js';
import {Bunker, createBunkers} from './bunkers.js';
import {Fleet, Invader, INVADER_HEIGHT, INVADER_WIDTH} from './invaders.js';
import {Player} from './player.js';
import {ScorePopup} from './score_popup.js';
import {pickUfoPoints, UfoSpawner} from './ufo.js';

/**
 * Phases of the game.
 * @enum {string}
 */
export const Phase = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WAVE_CLEARED: 'wave-cleared',
  GAME_OVER: 'game-over',
};

/** Lives at the start of a game. */
const STARTING_LIVES = 3;

/** Seconds the "wave cleared" banner shows before the next wave. */
const WAVE_CLEARED_TIME = 2.2;

/** Y position of the fleet's top row at the start of a wave. */
const FLEET_TOP = 128;

/** Y position of the bunkers' top edges. */
const BUNKER_TOP = 432;

/** X position of each bunker's left edge. */
const BUNKER_LEFTS = Object.freeze([130, 288, 446, 604]);

/** Radius of the hole a bullet blasts in a bunker, in cells. */
const BUNKER_BLAST_RADIUS = 1;

/** Player bullets that fly above this Y position are removed. */
const PLAYER_BULLET_CEILING = 44;

/** Seconds the score for an invader floats on screen. */
const INVADER_POPUP_TIME = 0.9;

/** Seconds the score for the saucer floats on screen. */
const UFO_POPUP_TIME = 1;

/** The game state and the rules that advance it each frame. */
export class Game {
  /** @param {!SoundEffects} sounds Plays the sound for each game event. */
  constructor(sounds) {
    /** @private @const {!SoundEffects} */
    this.sounds_ = sounds;

    /** @type {!Phase} */
    this.phase = Phase.TITLE;

    /** @type {number} */
    this.score = 0;

    /** @type {number} */
    this.highScore = loadHighScore();

    /**
     * Lives left, counting the ship in play.
     * @type {number}
     */
    this.lives = STARTING_LIVES;

    /**
     * Current wave, starting at 1.
     * @type {number}
     */
    this.wave = 1;

    /**
     * Seconds since the game was loaded. Drives the animations.
     * @type {number}
     */
    this.time = 0;

    /**
     * Headline shown on the game-over screen.
     * @type {string}
     */
    this.gameOverMessage = 'GAME OVER';

    // The title screen shows a fresh wave behind it, so build one now.

    /** @type {!Player} */
    this.player = new Player();

    /** @type {!Fleet} */
    this.fleet = new Fleet(FLEET_TOP);

    /** @type {!Array<!Bunker>} */
    this.bunkers = createBunkers(BUNKER_TOP, BUNKER_LEFTS);

    /** @type {!Array<!Bullet>} */
    this.playerBullets = [];

    /** @type {!Array<!Bullet>} */
    this.invaderBullets = [];

    /** @type {!Array<!ScorePopup>} */
    this.popups = [];

    /** @type {!UfoSpawner} */
    this.ufoSpawner = new UfoSpawner();

    /**
     * Seconds until the next wave starts, while the banner shows.
     * @private {number}
     */
    this.waveClearedTimer_ = 0;
  }

  /** Starts a new game from wave 1. */
  start() {
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.wave = 1;
    this.setupWave_();
    this.phase = Phase.PLAYING;
  }

  /** Goes back to the title screen. */
  showTitle() {
    this.phase = Phase.TITLE;
  }

  /** Pauses a game in progress. Does nothing in other phases. */
  pause() {
    if (this.phase === Phase.PLAYING) this.phase = Phase.PAUSED;
  }

  /** Pauses a game in progress, or resumes a paused one. */
  togglePause() {
    if (this.phase === Phase.PLAYING) {
      this.phase = Phase.PAUSED;
    } else if (this.phase === Phase.PAUSED) {
      this.phase = Phase.PLAYING;
    }
  }

  /**
   * Advances the game by one frame.
   * @param {number} dt Seconds since the last frame.
   * @param {!Keyboard} keyboard Keys held for steering and firing.
   */
  update(dt, keyboard) {
    this.time += dt;
    switch (this.phase) {
      case Phase.PLAYING:
        this.updatePlaying_(dt, keyboard);
        break;
      case Phase.WAVE_CLEARED:
        this.waveClearedTimer_ -= dt;
        if (this.waveClearedTimer_ <= 0) {
          this.wave++;
          this.setupWave_();
          this.phase = Phase.PLAYING;
        }
        break;
      default:
        // The title, pause and game-over screens wait for input.
        break;
    }
  }

  /**
   * @param {number} dt Seconds since the last frame.
   * @param {!Keyboard} keyboard
   * @private
   */
  updatePlaying_(dt, keyboard) {
    // Snapshot the fleet before anything dies this frame. Every step below
    // works on the fleet as it stood at the start of the frame.
    const alive = this.fleet.getAlive();
    if (!this.updatePlayer_(dt, keyboard)) return;
    if (!this.updateFleet_(dt, alive)) return;
    this.updateInvaderFire_(dt, alive);
    this.updateBullets_(dt);
    this.updatePopups_(dt);
    this.updateUfo_(dt);
  }

  /**
   * Steers and fires the ship, or runs its explosion and then respawns it.
   * @param {number} dt Seconds since the last frame.
   * @param {!Keyboard} keyboard
   * @return {boolean} False if the game ended.
   * @private
   */
  updatePlayer_(dt, keyboard) {
    if (this.player.isExploding()) {
      if (!this.player.updateExplosion(dt)) return true;
      if (this.lives > 0) {
        this.player = new Player();
        return true;
      }
      this.endGame_('GAME OVER');
      return false;
    }

    const direction = Number(keyboard.isHeld(Action.RIGHT)) -
        Number(keyboard.isHeld(Action.LEFT));
    this.player.update(dt, direction);
    if (keyboard.isHeld(Action.FIRE) &&
        this.player.canFire(this.playerBullets.length)) {
      this.playerBullets.push(...this.player.fire());
      this.sounds_.shoot();
    }
    return true;
  }

  /**
   * Marches the fleet and applies what it touches: the ship, the ground and
   * the bunkers.
   * @param {number} dt Seconds since the last frame.
   * @param {!Array<!Invader>} alive The invaders alive at the start of the
   *     frame.
   * @return {boolean} False if the wave or the game ended.
   * @private
   */
  updateFleet_(dt, alive) {
    if (alive.length === 0) {
      this.clearWave_();
      return false;
    }

    for (const beat of this.fleet.march(dt, alive)) {
      this.sounds_.march(beat);
    }

    const player = this.player;
    if (player.isVulnerable() &&
        alive.some(
            (invader) => invader.overlaps(
                player.x, player.y, player.width, player.height))) {
      this.killPlayer_();
    }

    if (this.fleet.getBottom(alive) >= GROUND_Y) {
      this.endGame_('INVASION!');
      return false;
    }

    // Invaders grind away any bunker they touch.
    for (const bunker of this.bunkers) {
      for (const invader of alive) {
        bunker.erase(invader.x, invader.y, INVADER_WIDTH, INVADER_HEIGHT);
      }
    }
    return true;
  }

  /**
   * Lets the fleet shoot when its timer runs out.
   * @param {number} dt Seconds since the last frame.
   * @param {!Array<!Invader>} alive The invaders alive at the start of the
   *     frame.
   * @private
   */
  updateInvaderFire_(dt, alive) {
    const shooter = this.fleet.updateShooting(
        dt, alive, this.invaderBullets.length, this.player.isExploding());
    if (!shooter) return;
    this.invaderBullets.push(Bullet.fromInvader(
        shooter.x + INVADER_WIDTH / 2, shooter.y + INVADER_HEIGHT, this.wave));
    this.sounds_.invaderShoot();
  }

  /**
   * Moves every bullet, resolves what each one hits, and removes bullets that
   * hit something or left the playfield.
   * @param {number} dt Seconds since the last frame.
   * @private
   */
  updateBullets_(dt) {
    for (const bullet of this.playerBullets) {
      bullet.move(dt);
    }
    this.shootUfo_();
    this.shootInvaders_();
    for (const bullet of this.playerBullets) {
      if (!bullet.spent) this.hitBunker_(bullet);
    }

    for (const bullet of this.invaderBullets) {
      bullet.move(dt);
    }
    // killPlayer_ replaces invaderBullets with an empty array. This loop keeps
    // going over the old one, so later bullets can still chip the bunkers.
    for (const bullet of this.invaderBullets) {
      if (bullet.spent || bullet.y > PLAYFIELD_HEIGHT) continue;
      this.hitBunker_(bullet);
      if (!bullet.spent && this.player.isVulnerable() &&
          this.player.overlaps(
              bullet.x, bullet.y, bullet.width, bullet.height)) {
        bullet.spent = true;
        this.killPlayer_();
      }
    }

    this.playerBullets = this.playerBullets.filter(
        (bullet) => !bullet.spent && bullet.y > PLAYER_BULLET_CEILING);
    this.invaderBullets = this.invaderBullets.filter(
        (bullet) => !bullet.spent && bullet.y < PLAYFIELD_HEIGHT);
  }

  /**
   * Checks the player's bullets against the saucer. At most one bullet can
   * shoot it down.
   * @private
   */
  shootUfo_() {
    const ufo = this.ufoSpawner.ufo;
    if (!ufo) return;
    const bullet = this.playerBullets.find(
        (candidate) => !candidate.spent &&
            ufo.overlaps(
                candidate.x, candidate.y, candidate.width, candidate.height));
    if (!bullet) return;

    bullet.spent = true;
    const points = pickUfoPoints();
    this.addScore_(points);
    this.popups.push(
        new ScorePopup(ufo.x + ufo.width / 2, ufo.y, points, UFO_POPUP_TIME));
    this.ufoSpawner.remove();
    this.sounds_.ufoHit();
  }

  /**
   * Checks the player's bullets against the fleet. Each bullet destroys at
   * most one invader.
   * @private
   */
  shootInvaders_() {
    for (const bullet of this.playerBullets) {
      if (bullet.spent) continue;
      const invader = this.fleet.invaders.find(
          (candidate) => candidate.alive &&
              candidate.overlaps(
                  bullet.x, bullet.y, bullet.width, bullet.height));
      if (!invader) continue;

      invader.alive = false;
      bullet.spent = true;
      this.addScore_(invader.points);
      this.popups.push(new ScorePopup(
          invader.x + INVADER_WIDTH / 2, invader.y, invader.points,
          INVADER_POPUP_TIME));
      this.sounds_.invaderKilled();
    }
  }

  /**
   * Stops a bullet at the first bunker it hits and blasts a hole where its
   * tip struck.
   * @param {!Bullet} bullet
   * @private
   */
  hitBunker_(bullet) {
    const bunker = this.bunkers.find(
        (candidate) => candidate.overlaps(
            bullet.x, bullet.y, bullet.width, bullet.height));
    if (!bunker) return;
    bullet.spent = true;
    bunker.damage(
        bullet.x + bullet.width / 2, bullet.getLeadingEdge(),
        BUNKER_BLAST_RADIUS);
  }

  /**
   * @param {number} dt Seconds since the last frame.
   * @private
   */
  updatePopups_(dt) {
    for (const popup of this.popups) {
      popup.update(dt);
    }
    this.popups = this.popups.filter((popup) => !popup.isExpired());
  }

  /**
   * @param {number} dt Seconds since the last frame.
   * @private
   */
  updateUfo_(dt) {
    if (this.ufoSpawner.update(dt)) this.sounds_.ufoBlip();
  }

  /**
   * Shows the "wave cleared" banner before the next wave.
   * @private
   */
  clearWave_() {
    this.phase = Phase.WAVE_CLEARED;
    this.waveClearedTimer_ = WAVE_CLEARED_TIME;
    // Drop everything in flight so the banner is not drawn over frozen
    // bullets.
    this.playerBullets = [];
    this.invaderBullets = [];
    this.ufoSpawner.remove();
    this.sounds_.waveCleared();
  }

  /**
   * Blows up the ship and takes a life. Clears the invader bullets so the
   * next ship does not respawn under fire.
   * @private
   */
  killPlayer_() {
    if (this.player.isExploding()) return;
    this.player.explode();
    this.lives--;
    this.invaderBullets = [];
    this.sounds_.explosion();
  }

  /**
   * Ends the game and saves the high score.
   * @param {string} message Headline for the game-over screen.
   * @private
   */
  endGame_(message) {
    this.phase = Phase.GAME_OVER;
    this.gameOverMessage = message;
    this.highScore = Math.max(this.highScore, this.score);
    saveHighScore(this.highScore);
    this.sounds_.gameOver();
  }

  /**
   * @param {number} points
   * @private
   */
  addScore_(points) {
    this.score += points;
    this.highScore = Math.max(this.highScore, this.score);
  }

  /**
   * Resets the ship, the fleet, the bunkers and everything in flight for a
   * new wave.
   * @private
   */
  setupWave_() {
    this.player = new Player();
    this.fleet = new Fleet(FLEET_TOP);
    this.bunkers = createBunkers(BUNKER_TOP, BUNKER_LEFTS);
    this.playerBullets = [];
    this.invaderBullets = [];
    this.popups = [];
    this.ufoSpawner = new UfoSpawner();
  }
}

/**
 * @fileoverview Tracks which keys are held down and maps them to the actions
 * the player can hold: steering and firing.
 */

/**
 * Actions the player performs by holding a key.
 * @enum {string}
 */
export const Action = {
  LEFT: 'left',
  RIGHT: 'right',
  FIRE: 'fire',
};

/** Keys bound to each action, as lowercase KeyboardEvent.key values. */
const KEY_BINDINGS = Object.freeze({
  [Action.LEFT]: Object.freeze(['arrowleft', 'a']),
  [Action.RIGHT]: Object.freeze(['arrowright', 'd']),
  [Action.FIRE]: Object.freeze([' ']),
});

/** The set of keys currently held down. */
export class Keyboard {
  constructor() {
    /**
     * Held keys, as lowercase KeyboardEvent.key values.
     * @private @const {!Set<string>}
     */
    this.held_ = new Set();
  }

  /** @param {string} key Lowercase key that went down. */
  press(key) {
    this.held_.add(key);
  }

  /** @param {string} key Lowercase key that came up. */
  release(key) {
    this.held_.delete(key);
  }

  /**
   * Forgets every held key. Call this when the page loses focus, because the
   * key-up events will go elsewhere.
   */
  releaseAll() {
    this.held_.clear();
  }

  /**
   * @param {!Action} action
   * @return {boolean} Whether any key bound to the action is held.
   */
  isHeld(action) {
    return KEY_BINDINGS[action].some((key) => this.held_.has(key));
  }
}

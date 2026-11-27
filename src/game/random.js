/**
 * @fileoverview Random choices. Each helper takes an optional source of random
 * numbers so tests can make the outcome predictable.
 */

/**
 * @param {number} min Smallest possible result.
 * @param {number} max Upper bound of the result.
 * @param {function(): number=} random Returns a number in [0, 1).
 * @return {number} A number in [min, max).
 */
export function randomBetween(min, max, random = Math.random) {
  return min + random() * (max - min);
}

/**
 * @param {!ReadonlyArray<T>} items Items to choose from; must not be empty.
 * @param {function(): number=} random Returns a number in [0, 1]. A result of
 *     exactly 1 picks the last item.
 * @return {T} One of the items, each equally likely.
 * @template T
 */
export function randomItem(items, random = Math.random) {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[index];
}

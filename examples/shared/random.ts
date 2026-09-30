/**
 * Random number generator in [0, 1), the same as `Math.random`
 */
export type Random = () => number;

/**
 * Creates a random number generator with a seed, so games and tests are reproducible
 */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

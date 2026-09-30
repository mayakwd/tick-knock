/**
 * A creep: towers target it, and the next wave starts when there are no creeps left
 */
export const CREEP = 'creep';

/**
 * The creep has reached the exit. It's destroyed, but not killed: it takes a life instead of giving gold.
 */
export const ESCAPED = 'escaped';

/**
 * Rules of choosing a target. A tower has one of them, and every rule has its own targeting system.
 */
export const TARGET_FIRST = 'target-first';
export const TARGET_STRONGEST = 'target-strongest';

export type Targeting = typeof TARGET_FIRST | typeof TARGET_STRONGEST;

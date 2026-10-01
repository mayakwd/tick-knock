import {TARGET_FIRST, TARGET_STRONGEST, Targeting} from '../tags';

export const TOWER_KINDS = ['arrow', 'cannon', 'frost', 'poison'] as const;
export type TowerKind = typeof TOWER_KINDS[number];

/**
 * Who a hit hurts: only the target, or every creep around it
 */
export type Impact =
  | {readonly kind: 'single'}
  | {readonly kind: 'splash'; readonly radius: number};

/**
 * Slows the creep down. Several slows don't stack: the strongest one is applied.
 */
export interface SlowEffect {
  readonly kind: 'slow';
  /**
   * Multiplier of the speed of the creep, from 0 to 1
   */
  readonly factor: number;
  readonly seconds: number;
}

/**
 * Damages the creep over time. Poisons stack: every poison deals its damage until it expires.
 */
export interface PoisonEffect {
  readonly kind: 'poison';
  readonly damagePerSecond: number;
  readonly seconds: number;
}

/**
 * What a hit leaves on a creep besides damage
 */
export type Effect = SlowEffect | PoisonEffect;

/**
 * What a hit does
 */
export interface PayloadDescription {
  readonly damage: number;
  readonly impact: Impact;
  readonly effects: ReadonlyArray<Effect>;
}

/**
 * Characteristics of a tower level. A level only describes what a tower of this level has: when a tower is built or
 * upgraded, the level is turned into components of the tower, and systems work with these components.
 */
export interface TowerLevel {
  /**
   * Cost of building the tower of the first level, or of upgrading the tower to this level
   */
  readonly cost: number;
  /**
   * Range in pixels
   */
  readonly range: number;
  /**
   * Time in seconds between shots
   */
  readonly interval: number;
  readonly projectileSpeed: number;
  readonly payload: PayloadDescription;
}

export interface TowerDescription {
  readonly name: string;
  /**
   * Tag of the rule of choosing a target
   */
  readonly targeting: Targeting;
  /**
   * Levels from the first one: a tower has at least one level
   */
  readonly levels: readonly [TowerLevel, ...TowerLevel[]];
}

const SINGLE: Impact = {kind: 'single'};

export const TOWERS = {
  arrow: {
    name: 'Arrow',
    targeting: TARGET_FIRST,
    levels: [
      {cost: 50, range: 110, interval: 0.4, projectileSpeed: 420, payload: {damage: 4, impact: SINGLE, effects: []}},
      {cost: 60, range: 125, interval: 0.33, projectileSpeed: 460, payload: {damage: 6, impact: SINGLE, effects: []}},
      {cost: 90, range: 140, interval: 0.25, projectileSpeed: 500, payload: {damage: 9, impact: SINGLE, effects: []}},
    ],
  },
  cannon: {
    name: 'Cannon',
    targeting: TARGET_FIRST,
    levels: [
      {
        cost: 100, range: 100, interval: 1.4, projectileSpeed: 260,
        payload: {damage: 10, impact: {kind: 'splash', radius: 50}, effects: []},
      },
      {
        cost: 110, range: 110, interval: 1.3, projectileSpeed: 280,
        payload: {damage: 15, impact: {kind: 'splash', radius: 60}, effects: []},
      },
      {
        cost: 160, range: 120, interval: 1.2, projectileSpeed: 300,
        payload: {damage: 22, impact: {kind: 'splash', radius: 70}, effects: []},
      },
    ],
  },
  frost: {
    name: 'Frost',
    targeting: TARGET_FIRST,
    levels: [
      {
        cost: 80, range: 90, interval: 0.8, projectileSpeed: 320,
        payload: {damage: 1, impact: SINGLE, effects: [{kind: 'slow', factor: 0.5, seconds: 1.5}]},
      },
      {
        cost: 90, range: 100, interval: 0.7, projectileSpeed: 340,
        payload: {damage: 2, impact: SINGLE, effects: [{kind: 'slow', factor: 0.4, seconds: 2}]},
      },
      // The last level freezes creeps around the target too
      {
        cost: 130, range: 110, interval: 0.7, projectileSpeed: 360,
        payload: {
          damage: 3,
          impact: {kind: 'splash', radius: 40},
          effects: [{kind: 'slow', factor: 0.35, seconds: 2.5}],
        },
      },
    ],
  },
  poison: {
    name: 'Poison',
    // Poison is most useful against creeps with a lot of health
    targeting: TARGET_STRONGEST,
    levels: [
      {
        cost: 90, range: 100, interval: 1, projectileSpeed: 320,
        payload: {damage: 1, impact: SINGLE, effects: [{kind: 'poison', damagePerSecond: 5, seconds: 3}]},
      },
      {
        cost: 100, range: 110, interval: 0.9, projectileSpeed: 340,
        payload: {damage: 1, impact: SINGLE, effects: [{kind: 'poison', damagePerSecond: 8, seconds: 3}]},
      },
      // The last level poisons creeps around the target too
      {
        cost: 140, range: 120, interval: 0.8, projectileSpeed: 360,
        payload: {
          damage: 2,
          impact: {kind: 'splash', radius: 35},
          effects: [{kind: 'poison', damagePerSecond: 12, seconds: 4}],
        },
      },
    ],
  },
} as const satisfies Record<TowerKind, TowerDescription>;

import {PayloadDescription} from './components';
import {TARGET_FIRST, TARGET_STRONGEST} from './tags';

export type TowerKind = 'arrow' | 'cannon' | 'frost' | 'poison';

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
  readonly targeting: typeof TARGET_FIRST | typeof TARGET_STRONGEST;
  readonly levels: ReadonlyArray<TowerLevel>;
}

export const TOWERS: Record<TowerKind, TowerDescription> = {
  arrow: {
    name: 'Arrow',
    targeting: TARGET_FIRST,
    levels: [
      {cost: 50, range: 110, interval: 0.4, projectileSpeed: 420, payload: {damage: 4}},
      {cost: 60, range: 125, interval: 0.33, projectileSpeed: 460, payload: {damage: 6}},
      {cost: 90, range: 140, interval: 0.25, projectileSpeed: 500, payload: {damage: 9}},
    ],
  },
  cannon: {
    name: 'Cannon',
    targeting: TARGET_FIRST,
    levels: [
      {cost: 100, range: 100, interval: 1.4, projectileSpeed: 260, payload: {damage: 10, splash: 50}},
      {cost: 110, range: 110, interval: 1.3, projectileSpeed: 280, payload: {damage: 15, splash: 60}},
      {cost: 160, range: 120, interval: 1.2, projectileSpeed: 300, payload: {damage: 22, splash: 70}},
    ],
  },
  frost: {
    name: 'Frost',
    targeting: TARGET_FIRST,
    levels: [
      {cost: 80, range: 90, interval: 0.8, projectileSpeed: 320, payload: {damage: 1, slow: {factor: 0.5, seconds: 1.5}}},
      {cost: 90, range: 100, interval: 0.7, projectileSpeed: 340, payload: {damage: 2, slow: {factor: 0.4, seconds: 2}}},
      // The last level freezes creeps around the target too
      {
        cost: 130, range: 110, interval: 0.7, projectileSpeed: 360,
        payload: {damage: 3, slow: {factor: 0.35, seconds: 2.5}, splash: 40},
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
        payload: {damage: 1, poison: {damagePerSecond: 5, seconds: 3}},
      },
      {
        cost: 100, range: 110, interval: 0.9, projectileSpeed: 340,
        payload: {damage: 1, poison: {damagePerSecond: 8, seconds: 3}},
      },
      // The last level poisons creeps around the target too
      {
        cost: 140, range: 120, interval: 0.8, projectileSpeed: 360,
        payload: {damage: 2, poison: {damagePerSecond: 12, seconds: 4}, splash: 35},
      },
    ],
  },
};

export const TOWER_KINDS = Object.keys(TOWERS) as TowerKind[];

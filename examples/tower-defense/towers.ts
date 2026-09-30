import {DamageDescription} from './components';

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
  /**
   * Damage of every hit, a tower can deal several kinds of damage at once
   */
  readonly damage: ReadonlyArray<DamageDescription>;
}

export interface TowerDescription {
  readonly name: string;
  readonly levels: ReadonlyArray<TowerLevel>;
}

export const TOWERS: Record<TowerKind, TowerDescription> = {
  arrow: {
    name: 'Arrow',
    levels: [
      {cost: 50, range: 110, interval: 0.4, projectileSpeed: 420, damage: [{type: 'physical', amount: 4}]},
      {cost: 60, range: 125, interval: 0.33, projectileSpeed: 460, damage: [{type: 'physical', amount: 6}]},
      {cost: 90, range: 140, interval: 0.25, projectileSpeed: 500, damage: [{type: 'physical', amount: 9}]},
    ],
  },
  cannon: {
    name: 'Cannon',
    levels: [
      {cost: 100, range: 100, interval: 1.4, projectileSpeed: 260, damage: [{type: 'physical', amount: 10, splash: 50}]},
      {cost: 110, range: 110, interval: 1.3, projectileSpeed: 280, damage: [{type: 'physical', amount: 15, splash: 60}]},
      {cost: 160, range: 120, interval: 1.2, projectileSpeed: 300, damage: [{type: 'physical', amount: 22, splash: 70}]},
    ],
  },
  frost: {
    name: 'Frost',
    levels: [
      {
        cost: 80, range: 90, interval: 0.8, projectileSpeed: 320,
        damage: [{type: 'physical', amount: 1}, {type: 'frost', amount: 0.5, duration: 1.5}],
      },
      {
        cost: 90, range: 100, interval: 0.7, projectileSpeed: 340,
        damage: [{type: 'physical', amount: 2}, {type: 'frost', amount: 0.6, duration: 2}],
      },
      {
        // The last level freezes creeps around the target too
        cost: 130, range: 110, interval: 0.7, projectileSpeed: 360,
        damage: [{type: 'physical', amount: 3}, {type: 'frost', amount: 0.65, duration: 2.5, splash: 40}],
      },
    ],
  },
  poison: {
    name: 'Poison',
    levels: [
      {
        cost: 90, range: 100, interval: 1, projectileSpeed: 320,
        damage: [{type: 'physical', amount: 1}, {type: 'poison', amount: 5, duration: 3}],
      },
      {
        cost: 100, range: 110, interval: 0.9, projectileSpeed: 340,
        damage: [{type: 'physical', amount: 1}, {type: 'poison', amount: 8, duration: 3}],
      },
      {
        // The last level poisons creeps around the target too
        cost: 140, range: 120, interval: 0.8, projectileSpeed: 360,
        damage: [{type: 'physical', amount: 2}, {type: 'poison', amount: 12, duration: 4, splash: 35}],
      },
    ],
  },
};

export const TOWER_KINDS = Object.keys(TOWERS) as TowerKind[];

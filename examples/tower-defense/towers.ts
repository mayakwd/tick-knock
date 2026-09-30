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
  readonly damage: number;
  readonly projectileSpeed: number;
  /**
   * Radius of the explosion in pixels, all creeps in it are hit
   */
  readonly splash?: number;
  readonly slow?: { factor: number; seconds: number };
  readonly poison?: { damagePerSecond: number; seconds: number };
}

export interface TowerDescription {
  readonly name: string;
  readonly levels: ReadonlyArray<TowerLevel>;
}

export const TOWERS: Record<TowerKind, TowerDescription> = {
  arrow: {
    name: 'Arrow',
    levels: [
      {cost: 50, range: 110, interval: 0.4, damage: 4, projectileSpeed: 420},
      {cost: 60, range: 125, interval: 0.33, damage: 6, projectileSpeed: 460},
      {cost: 90, range: 140, interval: 0.25, damage: 9, projectileSpeed: 500},
    ],
  },
  cannon: {
    name: 'Cannon',
    levels: [
      {cost: 100, range: 100, interval: 1.4, damage: 10, projectileSpeed: 260, splash: 50},
      {cost: 110, range: 110, interval: 1.3, damage: 15, projectileSpeed: 280, splash: 60},
      {cost: 160, range: 120, interval: 1.2, damage: 22, projectileSpeed: 300, splash: 70},
    ],
  },
  frost: {
    name: 'Frost',
    levels: [
      {cost: 80, range: 90, interval: 0.8, damage: 1, projectileSpeed: 320, slow: {factor: 0.5, seconds: 1.5}},
      {cost: 90, range: 100, interval: 0.7, damage: 2, projectileSpeed: 340, slow: {factor: 0.4, seconds: 2}},
      // The last level freezes creeps around the target too
      {cost: 130, range: 110, interval: 0.7, damage: 3, projectileSpeed: 360, slow: {factor: 0.35, seconds: 2.5}, splash: 40},
    ],
  },
  poison: {
    name: 'Poison',
    levels: [
      {cost: 90, range: 100, interval: 1, damage: 1, projectileSpeed: 320, poison: {damagePerSecond: 5, seconds: 3}},
      {cost: 100, range: 110, interval: 0.9, damage: 1, projectileSpeed: 340, poison: {damagePerSecond: 8, seconds: 3}},
      // The last level poisons creeps around the target too
      {cost: 140, range: 120, interval: 0.8, damage: 2, projectileSpeed: 360, poison: {damagePerSecond: 12, seconds: 4}, splash: 35},
    ],
  },
};

export const TOWER_KINDS = Object.keys(TOWERS) as TowerKind[];

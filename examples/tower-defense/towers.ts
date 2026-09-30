export type TowerKind = 'arrow' | 'cannon' | 'frost' | 'poison';

/**
 * Description of a tower kind. Towers differ only in data: one targeting system and one projectile system
 * handle all of them.
 */
export interface TowerDescription {
  readonly name: string;
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
  readonly damage: number;
  /**
   * Radius of the explosion in pixels, all creeps in it are damaged
   */
  readonly splash?: number;
  readonly slow?: { factor: number; seconds: number };
  readonly poison?: { damagePerSecond: number; seconds: number };
}

export const TOWERS: Record<TowerKind, TowerDescription> = {
  arrow: {name: 'Arrow', cost: 50, range: 110, interval: 0.4, projectileSpeed: 420, damage: 4},
  cannon: {name: 'Cannon', cost: 100, range: 100, interval: 1.4, projectileSpeed: 260, damage: 10, splash: 50},
  frost: {name: 'Frost', cost: 80, range: 90, interval: 0.8, projectileSpeed: 320, damage: 1, slow: {factor: 0.5, seconds: 1.5}},
  poison: {name: 'Poison', cost: 90, range: 100, interval: 1, projectileSpeed: 320, damage: 1, poison: {damagePerSecond: 5, seconds: 3}},
};

export const TOWER_KINDS = Object.keys(TOWERS) as TowerKind[];

import {TowerKind} from '../data/towers';

export const TOWER_COLORS = {
  arrow: 0xe3b341,
  cannon: 0xf0883e,
  frost: 0x79c0ff,
  poison: 0x7ee787,
} satisfies Record<TowerKind, number>;

/**
 * Radius of projectiles in pixels
 */
export const PROJECTILE_RADIUS = {
  arrow: 3,
  cannon: 5,
  frost: 3,
  poison: 3,
} satisfies Record<TowerKind, number>;

export const GRASS_COLOR = 0x0f1a12;
export const GRID_COLOR = 0x1a2b1e;
export const PATH_COLOR = 0x3b2f22;

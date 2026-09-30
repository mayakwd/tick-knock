import {Graphics, GraphicsContext} from 'pixi.js';
import {CELL} from '../config';
import {TowerKind} from '../towers';
import {TOWER_COLORS} from './colors';

/**
 * Draws a tower of the level: the core grows with the level, and dots at the bottom show it
 * @param level Index of the level, starting from 0
 */
export function drawTower(kind: TowerKind, level: number): Graphics {
  const color = TOWER_COLORS[kind];
  const size = CELL - 8;
  const graphics = new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, 6)
    .fill(0x21262d)
    .stroke({width: 2, color: level > 0 ? color : 0x484f58})
    .circle(0, -2, size / 4 + level * 2)
    .fill(color);
  for (let i = 0; i <= level; i++) {
    graphics.circle((i - level / 2) * 7, size / 2 - 5, 2).fill(0xe6edf3);
  }
  return graphics;
}

/**
 * Projectiles of the same tower kind share geometry
 */
const projectileContexts = new Map<TowerKind, GraphicsContext>();

export function drawProjectile(kind: TowerKind): Graphics {
  let context = projectileContexts.get(kind);
  if (context === undefined) {
    context = new GraphicsContext().circle(0, 0, kind === 'cannon' ? 5 : 3).fill(TOWER_COLORS[kind]);
    projectileContexts.set(kind, context);
  }
  return new Graphics(context);
}

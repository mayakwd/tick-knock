import {Graphics, GraphicsContext} from 'pixi.js';
import {CELL} from '../config';
import {TowerKind} from '../towers';
import {TOWER_COLORS} from './colors';

export function drawTower(kind: TowerKind): Graphics {
  const color = TOWER_COLORS[kind];
  const size = CELL - 8;
  return new Graphics()
    .roundRect(-size / 2, -size / 2, size, size, 6)
    .fill(0x21262d)
    .stroke({width: 2, color: 0x484f58})
    .circle(0, 0, size / 3)
    .fill(color);
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

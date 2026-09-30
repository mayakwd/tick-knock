import {Graphics, GraphicsContext} from 'pixi.js';
import {Payload} from '../components';
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
 * Projectiles that look the same share geometry: they are cached by color, separately for shells and bullets
 */
const projectileContexts = {shell: new Map<number, GraphicsContext>(), bullet: new Map<number, GraphicsContext>()};

/**
 * Draws a projectile by its payload: it has the color of its effect, and an explosive shell is bigger
 */
export function drawProjectile(payload: Payload): Graphics {
  const isShell = payload.splash > 0;
  const color = projectileColor(payload);
  const contexts = isShell ? projectileContexts.shell : projectileContexts.bullet;
  let context = contexts.get(color);
  if (context === undefined) {
    context = new GraphicsContext().circle(0, 0, isShell ? 5 : 3).fill(color);
    contexts.set(color, context);
  }
  return new Graphics(context);
}

function projectileColor({splash, slow, poison}: Payload): number {
  if (poison !== undefined) return TOWER_COLORS.poison;
  if (slow !== undefined) return TOWER_COLORS.frost;
  return splash > 0 ? TOWER_COLORS.cannon : TOWER_COLORS.arrow;
}

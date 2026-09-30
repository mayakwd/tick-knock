import {Graphics, GraphicsContext} from 'pixi.js';
import {Asteroid} from '../components';
import {ASTEROIDS, BULLET_RADIUS, SHIP_RADIUS} from '../config';

const SHIP_COLOR = 0x58a6ff;
const ASTEROID_COLOR = 0x8b949e;
const BULLET_COLOR = 0xffa657;

let bulletContext: GraphicsContext | undefined;

/**
 * Draws the ship pointing to the right, the view is rotated by the rotation of the ship
 */
export function drawShip(): Graphics {
  return new Graphics()
    .poly([
      SHIP_RADIUS + 4, 0,
      Math.cos(2.5) * SHIP_RADIUS, Math.sin(2.5) * SHIP_RADIUS,
      Math.cos(-2.5) * SHIP_RADIUS, Math.sin(-2.5) * SHIP_RADIUS,
    ])
    .stroke({width: 2, color: SHIP_COLOR});
}

export function drawAsteroid({size, outline}: Asteroid): Graphics {
  const {radius} = ASTEROIDS[size];
  const points = outline.flatMap((scale, i) => {
    const angle = (i / outline.length) * Math.PI * 2;
    return [Math.cos(angle) * radius * scale, Math.sin(angle) * radius * scale];
  });
  return new Graphics().poly(points).stroke({width: 2, color: ASTEROID_COLOR});
}

/**
 * All bullets look the same, so they share the geometry
 */
export function drawBullet(): Graphics {
  bulletContext ??= new GraphicsContext().rect(-BULLET_RADIUS, -BULLET_RADIUS, BULLET_RADIUS * 2, BULLET_RADIUS * 2).fill(BULLET_COLOR);
  return new Graphics(bulletContext);
}

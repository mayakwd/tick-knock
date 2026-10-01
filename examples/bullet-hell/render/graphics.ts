import {Graphics, GraphicsContext} from 'pixi.js';
import {ENEMY_BULLET_RADIUS, PLAYER_RADIUS} from '../config';
import {EnemyKind} from '../enemies';

const PLAYER_COLOR = 0x58a6ff;
const PLAYER_BULLET_COLOR = 0x79c0ff;
const ENEMY_BULLET_COLOR = 0xff7b72;
const ENEMY_COLORS: Record<EnemyKind, number> = {
  drone: 0xffa657,
  spinner: 0xd2a8ff,
  turret: 0xf778ba,
  warden: 0x7ee787,
};
const ENEMY_SIDES: Record<EnemyKind, number> = {
  drone: 4,
  spinner: 6,
  turret: 8,
  warden: 5,
};

/**
 * Thousands of bullets look the same, so they share geometry: creating a view of a bullet doesn't build it again
 */
const contexts: { player?: GraphicsContext; enemy?: GraphicsContext } = {};

export function drawPlayer(): Graphics {
  return new Graphics()
    .poly([0, -14, 11, 10, 0, 5, -11, 10])
    .fill({color: PLAYER_COLOR, alpha: 0.35})
    .stroke({width: 2, color: PLAYER_COLOR})
    // The real collider of the player is tiny, so it's shown to the player
    .circle(0, 0, PLAYER_RADIUS + 1)
    .fill(0xffffff);
}

/**
 * Draws an enemy of the kind. The size is taken from the collider, so the enemy looks exactly as big as bullets see it.
 */
export function drawEnemy(kind: EnemyKind, radius: number): Graphics {
  const color = ENEMY_COLORS[kind];
  const sides = ENEMY_SIDES[kind];
  const points = Array.from({length: sides}, (_, i) => {
    const angle = (i / sides) * Math.PI * 2 + Math.PI / 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  }).flat();
  return new Graphics()
    .poly(points)
    .fill({color, alpha: 0.25})
    .stroke({width: 2, color})
    .circle(0, 0, radius / 3)
    .fill(color);
}

export function drawPlayerBullet(): Graphics {
  contexts.player ??= new GraphicsContext().rect(-1.5, -7, 3, 14).fill(PLAYER_BULLET_COLOR);
  return new Graphics(contexts.player);
}

export function drawEnemyBullet(): Graphics {
  contexts.enemy ??= new GraphicsContext()
    .circle(0, 0, ENEMY_BULLET_RADIUS + 1)
    .fill(ENEMY_BULLET_COLOR)
    .circle(0, 0, ENEMY_BULLET_RADIUS - 1.5)
    .fill(0xffffff);
  return new Graphics(contexts.enemy);
}

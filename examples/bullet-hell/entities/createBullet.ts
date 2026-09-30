import {Entity} from 'tick-knock';
import {Collider, Position, Velocity} from '../components';
import {ENEMY_BULLET_RADIUS, PLAYER_BULLET_SPEED} from '../config';
import {ENEMY_BULLET, PLAYER_BULLET} from '../tags';

export function createPlayerBullet(x: number, y: number): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Velocity(0, -PLAYER_BULLET_SPEED))
    .add(new Collider(3))
    .add(PLAYER_BULLET);
}

/**
 * Creates a bullet of an enemy flying in the direction
 * @param angle Direction in radians, 0 points to the right
 */
export function createEnemyBullet(x: number, y: number, angle: number, speed: number): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Velocity(Math.cos(angle) * speed, Math.sin(angle) * speed))
    .add(new Collider(ENEMY_BULLET_RADIUS))
    .add(ENEMY_BULLET);
}

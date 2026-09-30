import {Entity} from 'tick-knock';
import {Collider, Lifetime, Position, Velocity} from '../components';
import {BULLET_LIFETIME, BULLET_SPEED, SHIP_RADIUS} from '../config';
import {BULLET} from '../tags';

/**
 * Creates a bullet fired by the ship: it starts at the nose of the ship and inherits its velocity
 */
export function createBullet(position: Position, velocity: Velocity, angle: number): Entity {
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  return new Entity()
    .add(new Position(position.x + directionX * SHIP_RADIUS, position.y + directionY * SHIP_RADIUS))
    .add(new Velocity(velocity.x + directionX * BULLET_SPEED, velocity.y + directionY * BULLET_SPEED))
    .add(new Collider(2))
    .add(new Lifetime(BULLET_LIFETIME))
    .add(BULLET);
}

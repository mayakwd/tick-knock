import {Entity} from 'tick-knock';
import {View} from '../../shared/render/View';
import {Payload, Position, Projectile} from '../components';
import {drawProjectile} from '../render/graphics';

/**
 * Creates a projectile flying from the position to the target. The payload is copied, so the projectile hits
 * with the payload the tower had at the moment of the shot.
 */
export function createProjectile({x, y}: Position, target: Entity, speed: number, payload: Payload): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Projectile(target, speed))
    .add(new Payload(payload))
    .add(new View(drawProjectile(payload)));
}

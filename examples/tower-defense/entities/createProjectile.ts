import {Entity} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {View} from '../../shared/render/View';
import {Payload, Projectile} from '../components';
import {TowerKind} from '../data/towers';
import {CreepEntry} from '../indexes/CreepEntry';
import {drawProjectile} from '../render/graphics';

/**
 * Creates a projectile flying from the tower to the target. The payload is immutable, so the projectile shares it
 * with the tower: it hits with the payload the tower had at the moment of the shot.
 */
export function createProjectile(
  {x, y}: Position,
  target: CreepEntry,
  kind: TowerKind,
  speed: number,
  payload: Payload,
): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Projectile(target, speed))
    .add(payload)
    .add(new View(drawProjectile(kind)));
}

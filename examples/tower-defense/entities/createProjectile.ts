import {Entity} from 'tick-knock';
import {Position, Projectile} from '../components';
import {TowerKind} from '../towers';

export function createProjectile(kind: TowerKind, x: number, y: number, target: Entity): Entity {
  return new Entity().add(new Position(x, y)).add(new Projectile(kind, target));
}

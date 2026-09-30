import {Entity} from 'tick-knock';
import {TowerKind} from '../towers';

/**
 * Projectile flying to the target. It keeps a reference to the target entity: if the target dies before
 * the projectile reaches it, the projectile disappears.
 */
export class Projectile {
  public constructor(public readonly kind: TowerKind, public readonly target: Entity) {}
}

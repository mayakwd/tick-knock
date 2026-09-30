import {Entity} from 'tick-knock';
import {TowerKind} from '../towers';

/**
 * Projectile flying to the target. It keeps a reference to the target entity: if the target dies before
 * the projectile reaches it, the projectile disappears.
 *
 * The damage of the projectile is copied from the tower when it fires, so an upgrade of the tower doesn't change
 * projectiles that are already flying.
 */
export class Projectile {
  public constructor(
    public readonly target: Entity,
    public readonly speed: number,
    /**
     * Kind of the tower that has fired the projectile, rendering draws projectiles of every kind differently
     */
    public readonly kind: TowerKind,
  ) {}
}

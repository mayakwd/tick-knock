import {Entity} from 'tick-knock';

/**
 * Projectile flying to the target. It keeps a reference to the target entity: if the target dies before
 * the projectile reaches it, the projectile disappears.
 *
 * What the hit does is the payload of the projectile, copied from the tower when it fires, so an upgrade of the tower
 * doesn't change projectiles that are already flying.
 */
export class Projectile {
  public constructor(public readonly target: Entity, public readonly speed: number) {}
}

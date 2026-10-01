import {CreepEntry} from '../indexes/CreepEntry';

/**
 * Projectile flying to the target. It keeps the entry of the target in the index of creeps: if the target dies or
 * escapes before the projectile reaches it, the projectile disappears.
 *
 * What the hit does is the payload of the projectile, shared with the tower at the moment of the shot, so an upgrade
 * of the tower doesn't change projectiles that are already flying.
 */
export class Projectile {
  public constructor(public readonly target: CreepEntry, public readonly speed: number) {}
}

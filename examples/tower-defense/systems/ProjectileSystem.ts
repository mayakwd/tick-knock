import {Entity, IterativeSystem} from 'tick-knock';
import {moveTowards} from '../../shared/geometry';
import {Hit, Payload, Poison, Position, Projectile, Slow} from '../components';
import {SpatialIndex} from '../SpatialIndex';

/**
 * Moves projectiles to their targets, and delivers their payload on hit: every hit creep gets a component for every
 * effect of the payload. The system doesn't know what effects do, and doesn't know anything about towers.
 */
export class ProjectileSystem extends IterativeSystem.of(Position, Projectile, Payload) {
  /**
   * @param creeps Spatial index of creeps, that can be hit
   */
  public constructor(private readonly creeps: SpatialIndex) {
    super();
  }

  protected updateEntity(
    projectile: Entity,
    dt: number,
    position: Position,
    {target, speed}: Projectile,
    payload: Payload,
  ): void {
    // The target has died or escaped, and the projectile has nothing to fly to
    if (!this.creeps.has(target)) {
      this.engine.removeEntity(projectile);
      return;
    }
    const targetPosition = target.get(Position)!;
    if (moveTowards(position, targetPosition, speed * dt) === undefined) return;

    this.engine.removeEntity(projectile);
    if (payload.splash === 0) {
      deliver(target, payload);
      return;
    }
    // An explosion hits every creep around the target, the spatial index gives only creeps in nearby cells
    this.creeps.forEachWithin(targetPosition, payload.splash, (creep) => deliver(creep, payload));
  }
}

/**
 * Adds effects of the payload to the creep. Effects are linked components: a creep can have several of them
 * at the same time.
 */
function deliver(creep: Entity, {damage, slow, poison}: Payload): void {
  creep.append(new Hit(damage));
  if (slow !== undefined) creep.append(new Slow(slow));
  if (poison !== undefined) creep.append(new Poison(poison));
}

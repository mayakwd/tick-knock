import {Entity, IterativeSystem} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {DESTROYED} from '../../shared/ecs/tags';
import {moveTowards} from '../../shared/geometry';
import {Hit, Payload, Poison, Projectile, Slow} from '../components';
import {CreepEntry} from '../indexes/CreepEntry';
import {CreepIndex} from '../indexes/CreepIndex';

/**
 * Moves projectiles to their targets, and delivers their payload on hit: every hit creep gets a component for every
 * effect of the payload. The system doesn't know what effects do, and doesn't know anything about towers.
 */
export class ProjectileSystem extends IterativeSystem.of(Position, Projectile, Payload) {
  /**
   * @param creeps Index of creeps, that can be hit
   */
  public constructor(private readonly creeps: CreepIndex) {
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
    if (!target.isAlive) {
      projectile.add(DESTROYED);
      return;
    }

    // The projectile flies until it reaches the target
    if (moveTowards(position, target.position, speed * dt) === undefined) return;
    projectile.add(DESTROYED);

    // A bullet hits only the target, an explosion hits every creep around it
    switch (payload.impact.kind) {
      case 'single':
        return deliver(target, payload);
      case 'splash':
        return this.creeps.forEachInRange(target.position, payload.impact.radius, (creep) => deliver(creep, payload));
    }
  }
}

/**
 * Adds the damage and effects of the payload to the creep. They are linked components: a creep can have several of
 * them at the same time.
 */
function deliver({entity}: CreepEntry, {damage, effects}: Payload): void {
  entity.append(new Hit(damage));
  for (const effect of effects) {
    switch (effect.kind) {
      case 'slow':
        entity.append(new Slow(effect));
        break;
      case 'poison':
        entity.append(new Poison(effect));
        break;
    }
  }
}

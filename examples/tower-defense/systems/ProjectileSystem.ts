import {Entity, IterativeSystem} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {DESTROYED} from '../../shared/ecs/tags';
import {moveTowards} from '../../shared/geometry';
import {Hit, Payload, Projectile} from '../components';

/**
 * Moves projectiles to their targets. A projectile, that has reached its target, hits it with its payload and
 * disappears. What the hit does is decided by `HitSystem`: the projectile only delivers it.
 */
export class ProjectileSystem extends IterativeSystem.of(Position, Projectile, Payload) {
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

    target.entity.append(new Hit(payload));
    projectile.add(DESTROYED);
  }
}

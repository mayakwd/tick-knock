import {Entity, IterativeSystem} from 'tick-knock';
import {Health, Hit} from '../components';

/**
 * Deals hits of this update. A creep can be hit by several projectiles in one update, so every hit is dealt, and all of
 * them are removed.
 */
export class DamageSystem extends IterativeSystem.of(Hit, Health) {
  protected updateEntity(creep: Entity, dt: number, first: Hit, health: Health): void {
    creep.iterate(Hit, ({damage}) => {
      health.value -= damage;
    });
    creep.remove(Hit);
  }
}

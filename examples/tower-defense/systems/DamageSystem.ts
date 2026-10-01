import {Entity, IterativeSystem} from 'tick-knock';
import {Damage, Health} from '../components';

/**
 * Deals damage of this update. A creep can be damaged several times in one update, so every damage is dealt, and all
 * of them are removed.
 */
export class DamageSystem extends IterativeSystem.of(Damage, Health) {
  protected updateEntity(creep: Entity, dt: number, first: Damage, health: Health): void {
    creep.iterate(Damage, ({amount}) => {
      health.value -= amount;
    });
    creep.remove(Damage);
  }
}

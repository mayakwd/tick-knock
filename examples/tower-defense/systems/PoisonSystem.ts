import {Entity, IterativeSystem} from 'tick-knock';
import {Health, Poison} from '../components';

/**
 * Poisons stack: every poison deals its damage until it expires
 */
export class PoisonSystem extends IterativeSystem.of(Poison, Health) {
  protected updateEntity(creep: Entity, dt: number, first: Poison, health: Health): void {
    creep.iterate(Poison, (poison) => {
      health.value -= poison.damagePerSecond * Math.min(dt, poison.seconds);
      poison.seconds -= dt;
      if (poison.seconds <= 0) creep.pick(poison);
    });
  }
}

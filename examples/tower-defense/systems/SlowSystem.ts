import {Entity, IterativeSystem} from 'tick-knock';
import {Slow} from '../components';

/**
 * Counts slows down. Every slow expires on its own, so all of them are iterated, and expired ones are picked one by
 * one. `PathSystem` applies the strongest one.
 */
export class SlowSystem extends IterativeSystem.of(Slow) {
  protected updateEntity(creep: Entity, dt: number): void {
    creep.iterate(Slow, (slow) => {
      slow.seconds -= dt;
      if (slow.seconds <= 0) creep.pick(slow);
    });
  }
}

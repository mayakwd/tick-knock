import {Engine, IterativeUpdate} from 'tick-knock';
import {Creep, Health, Poison, Slow} from '../components';
import {CreepKilled} from '../messages';

/**
 * Removes expired slows. Every slow expires on its own, so all of them are iterated, and expired ones are picked
 * from the entity one by one.
 */
export const slowing: IterativeUpdate<[Slow]> = (entity, dt) => {
  entity.iterate(Slow, (slow) => {
    slow.seconds -= dt;
    if (slow.seconds <= 0) entity.pick(slow);
  });
};

/**
 * Damages poisoned entities by every poison, and removes expired poisons
 */
export const poisoning: IterativeUpdate<[Poison, Health]> = (entity, dt, poison, health) => {
  entity.iterate(Poison, (it) => {
    health.value -= it.damagePerSecond * Math.min(dt, it.seconds);
    it.seconds -= dt;
    if (it.seconds <= 0) entity.pick(it);
  });
};

/**
 * Removes creeps without health. It runs after all damage of the update has been dealt, so the reward is given once.
 */
export function death(engine: Engine): IterativeUpdate<[Health, Creep]> {
  return (entity, dt, health, creep) => {
    if (health.value > 0) return;
    engine.removeEntity(entity);
    engine.dispatch(new CreepKilled(creep.reward));
  };
}

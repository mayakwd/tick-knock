import {Entity, IterativeSystem, without} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {DESTROYED} from '../../shared/ecs/tags';
import {Damage, Hit, Payload, Poison, Slow} from '../components';
import {CreepIndex} from '../indexes/CreepIndex';
import {CREEP} from '../tags';

/**
 * Applies payloads of hits. A hit without splash affects only the hit creep, an explosion affects every creep around
 * it. Every affected creep gets the damage and the effects of the payload as components, and their systems deal them.
 */
export class HitSystem extends IterativeSystem.of(Hit, Position, CREEP, without(DESTROYED)) {
  /**
   * @param creeps Index of creeps, explosions find creeps around the hit creep in it
   */
  public constructor(private readonly creeps: CreepIndex) {
    super();
  }

  protected updateEntity(creep: Entity, dt: number, first: Hit, position: Position): void {
    creep.iterate(Hit, ({payload}) => {
      switch (payload.impact.kind) {
        case 'single':
          return apply(creep, payload);
        case 'splash':
          return this.creeps.forEachInRange(position, payload.impact.radius, ({entity}) => apply(entity, payload));
      }
    });
    creep.remove(Hit);
  }
}

/**
 * Gives the creep the damage and the effects of the payload. They are linked components: a creep can have several of
 * them at the same time.
 */
function apply(creep: Entity, {damage, effects}: Payload): void {
  creep.append(new Damage(damage));
  for (const effect of effects) {
    switch (effect.kind) {
      case 'slow':
        creep.append(new Slow(effect));
        break;
      case 'poison':
        creep.append(new Poison(effect));
        break;
    }
  }
}

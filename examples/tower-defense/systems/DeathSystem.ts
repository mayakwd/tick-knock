import {Entity, IterativeSystem, without} from 'tick-knock';
import {DESTROYED, KILLED} from '../../shared/ecs/tags';
import {Health} from '../components';
import {CREEP} from '../tags';

/**
 * A creep without health is killed by the player. The system runs after all damage of the update has been dealt, and
 * a destroyed creep leaves its query, so a creep is killed once, and a creep that has escaped is not killed.
 */
export class DeathSystem extends IterativeSystem.of(Health, CREEP, without(DESTROYED)) {
  protected updateEntity(creep: Entity, dt: number, health: Health): void {
    if (health.value <= 0) creep.add(KILLED).add(DESTROYED);
  }
}

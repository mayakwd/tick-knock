import {Entity, IterativeSystem} from 'tick-knock';
import {Health, Poison, Slow} from '../components';
import {HealthBar} from './HealthBar';

/**
 * Shows the health of creeps, and tints creeps that are slowed or poisoned
 */
export class HealthBarSystem extends IterativeSystem.of(HealthBar, Health) {
  protected updateEntity(creep: Entity, dt: number, {view}: HealthBar, health: Health): void {
    view.setHealth(health.value / health.max);
    view.setEffects(creep.has(Slow), creep.has(Poison));
  }
}

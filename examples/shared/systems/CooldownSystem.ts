import {Entity, IterativeSystem} from 'tick-knock';
import {Cooldown} from '../components/Cooldown';

/**
 * Counts down cooldowns. Add it before systems that perform the actions.
 *
 * The time passed after a cooldown is over is kept for the next action, so the rate of actions doesn't depend on
 * the frame rate. While the action is not performed, the cooldown doesn't go below one update, so an idle gun doesn't
 * fire a burst.
 */
export class CooldownSystem extends IterativeSystem.of(Cooldown) {
  protected updateEntity(entity: Entity, dt: number, cooldown: Cooldown): void {
    cooldown.remaining = Math.max(cooldown.remaining - dt, -dt);
  }
}

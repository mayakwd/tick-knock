import {Class, Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Cooldown} from './Cooldown';

/**
 * Component with a cooldown, like a gun
 */
export interface WithCooldown {
  readonly cooldown: Cooldown;
}

/**
 * Counts down cooldowns of components of the class. Add it before systems that perform the actions.
 *
 * The time passed after a cooldown is over is kept for the next action, so the rate of actions doesn't depend on
 * the frame rate. While the action is not performed, the cooldown doesn't go below one update, so an idle gun doesn't
 * fire a burst.
 */
export class CooldownSystem extends IterativeSystem<[WithCooldown]> {
  public constructor(componentClass: Class<WithCooldown>) {
    super(new QueryBuilder().contains(componentClass) as QueryBuilder<[WithCooldown]>);
  }

  protected updateEntity(entity: Entity, dt: number, {cooldown}: WithCooldown): void {
    cooldown.remaining = Math.max(cooldown.remaining - dt, -dt);
  }
}

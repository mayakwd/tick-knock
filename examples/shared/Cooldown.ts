/**
 * Timer of a repeated action, like firing a gun. An entity, that performs the action, has the cooldown: `CooldownSystem`
 * counts it down, and the system that performs the action checks and restarts it.
 */
export class Cooldown {
  /**
   * @param interval Time in seconds between actions
   * @param remaining Time in seconds until the next action, the action is ready when it's not above zero
   */
  public constructor(public readonly interval: number, public remaining: number = 0) {}
}

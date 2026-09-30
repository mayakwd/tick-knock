/**
 * Timer of a repeated action, like firing a gun. It's data only: `CooldownSystem` counts it down, and systems that
 * perform the action check and restart it.
 */
export class Cooldown {
  /**
   * @param interval Time in seconds between actions
   * @param remaining Time in seconds until the next action, the action is ready when it's not above zero
   */
  public constructor(public readonly interval: number, public remaining: number = 0) {}
}

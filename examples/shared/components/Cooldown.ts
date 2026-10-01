/**
 * Timer of a repeated action, like firing a gun. `CooldownSystem` counts it down, and the system that performs the
 * action restarts it every time it acts, several times in one update if the interval is shorter than the update:
 *
 * ```ts
 * while (cooldown.remaining <= 0) {
 *   fire();
 *   cooldown.remaining += cooldown.interval;
 * }
 * ```
 */
export class Cooldown {
  /**
   * @param interval Time in seconds between actions
   * @param remaining Time in seconds until the next action, the action is ready when it's not above zero
   */
  public constructor(public readonly interval: number, public remaining: number = 0) {}
}

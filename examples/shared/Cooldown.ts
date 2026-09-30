/**
 * Timer of a repeated action, like firing a gun. The time passed after the cooldown is over is kept for the next
 * action, so the rate of actions doesn't depend on the frame rate. While the action is not performed, the cooldown
 * doesn't accumulate more than one update, so an idle gun doesn't fire a burst.
 */
export class Cooldown {
  private remaining: number;

  /**
   * @param interval Time in seconds between actions
   * @param delay Time in seconds before the first action
   */
  public constructor(public readonly interval: number, delay: number = 0) {
    this.remaining = delay;
  }

  public get isReady(): boolean {
    return this.remaining <= 0;
  }

  /**
   * Counts down the time
   * @param dt Delta time in seconds
   */
  public tick(dt: number): void {
    this.remaining = Math.max(this.remaining - dt, -dt);
  }

  /**
   * Starts the cooldown after the action has been performed
   */
  public restart(): void {
    this.remaining += this.interval;
  }

  /**
   * Counts down the time and performs the action as many times as the cooldown is over in this update
   */
  public repeat(dt: number, action: () => void): void {
    this.tick(dt);
    for (; this.isReady; this.restart()) action();
  }
}

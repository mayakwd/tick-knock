/**
 * Fires bullets in all directions at once
 */
export class RingPattern {
  /**
   * Time in seconds until the next shot
   */
  public cooldown: number;

  public constructor(
    /**
     * Time in seconds between shots
     */
    public readonly interval: number,
    /**
     * Amount of bullets in one shot
     */
    public readonly count: number,
    /**
     * Speed of bullets in pixels per second
     */
    public readonly speed: number,
    /**
     * Delay before the first shot, so enemies don't fire right at the edge of the screen
     */
    delay: number,
  ) {
    this.cooldown = delay;
  }
}

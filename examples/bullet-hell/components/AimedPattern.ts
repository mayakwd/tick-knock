/**
 * Fires a fan of bullets at the player
 */
export class AimedPattern {
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
     * Amount of bullets in the fan
     */
    public readonly count: number,
    /**
     * Speed of bullets in pixels per second
     */
    public readonly speed: number,
    /**
     * Width of the fan in radians
     */
    public readonly spread: number,
    /**
     * Delay before the first shot, so enemies don't fire right at the edge of the screen
     */
    delay: number,
  ) {
    this.cooldown = delay;
  }
}

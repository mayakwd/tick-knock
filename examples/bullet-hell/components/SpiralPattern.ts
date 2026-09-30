import {Cooldown} from '../../shared/Cooldown';

/**
 * Fires a few bullets in a direction, that rotates after every shot
 */
export class SpiralPattern {
  public readonly cooldown: Cooldown;
  /**
   * Current direction of the spiral in radians
   */
  public angle: number = Math.PI / 2;

  public constructor(
    /**
     * Time in seconds between shots
     */
    interval: number,
    /**
     * Amount of bullets in one shot, spread evenly around the circle
     */
    public readonly count: number,
    /**
     * Speed of bullets in pixels per second
     */
    public readonly speed: number,
    /**
     * Rotation of the direction after every shot in radians
     */
    public readonly step: number,
    /**
     * Delay before the first shot, so enemies don't fire right at the edge of the screen
     */
    delay: number,
  ) {
    this.cooldown = new Cooldown(interval, delay);
  }
}

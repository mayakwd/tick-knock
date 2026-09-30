import {Cooldown} from '../../shared/Cooldown';

/**
 * Fires bullets in all directions at once
 */
export class RingPattern {
  public readonly cooldown: Cooldown;

  public constructor(
    /**
     * Time in seconds between shots
     */
    interval: number,
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
    this.cooldown = new Cooldown(interval, delay);
  }
}

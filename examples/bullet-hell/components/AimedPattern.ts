import {Cooldown} from '../../shared/Cooldown';

/**
 * Fires a fan of bullets at the player
 */
export class AimedPattern {
  public readonly cooldown: Cooldown;

  public constructor(
    /**
     * Time in seconds between shots
     */
    interval: number,
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
    this.cooldown = new Cooldown(interval, delay);
  }
}

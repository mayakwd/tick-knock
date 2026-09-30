import {Cooldown} from '../../shared/Cooldown';

/**
 * Weapon of a tower. Every tower has one, and upgrades replace it. What a hit does is the payload of the tower.
 */
export class Weapon {
  public readonly cooldown: Cooldown;

  public constructor(
    /**
     * Range in pixels
     */
    public readonly range: number,
    /**
     * Time in seconds between shots
     */
    interval: number,
    public readonly projectileSpeed: number,
  ) {
    this.cooldown = new Cooldown(interval);
  }
}

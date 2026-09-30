import {Cooldown} from '../../shared/Cooldown';

/**
 * Gun of the player: it fires while the fire control is pressed, not more often than its cooldown allows
 */
export class Gun {
  public readonly cooldown: Cooldown;

  /**
   * @param interval Time in seconds between shots
   */
  public constructor(interval: number) {
    this.cooldown = new Cooldown(interval);
  }
}

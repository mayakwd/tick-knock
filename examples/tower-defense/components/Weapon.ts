/**
 * Weapon of a tower. Every tower has one, and upgrades change its characteristics. The damage it deals is a separate
 * component.
 */
export class Weapon {
  /**
   * Time in seconds until the weapon can fire again
   */
  public cooldown: number = 0;

  public constructor(
    /**
     * Range in pixels
     */
    public readonly range: number,
    /**
     * Time in seconds between shots
     */
    public readonly interval: number,
    public readonly projectileSpeed: number,
  ) {}
}

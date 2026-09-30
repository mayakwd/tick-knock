/**
 * Weapon of a tower. Every tower has one, and upgrades replace it. The tower fires when its cooldown is over, and what
 * a hit does is the payload of the tower.
 */
export class Weapon {
  public constructor(
    /**
     * Range in pixels
     */
    public readonly range: number,
    public readonly projectileSpeed: number,
  ) {}
}

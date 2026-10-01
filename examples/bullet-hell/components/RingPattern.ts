/**
 * Fires bullets in all directions at once. The barrel is rotated by half of the gap between bullets after every shot,
 * so bullets of the next ring fly between bullets of the previous one.
 */
export class RingPattern {
  public constructor(
    /**
     * Amount of bullets in one shot
     */
    public readonly count: number,
    /**
     * Speed of bullets in pixels per second
     */
    public readonly speed: number,
  ) {}
}

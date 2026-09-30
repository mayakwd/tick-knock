/**
 * Fires bullets in all directions at once
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

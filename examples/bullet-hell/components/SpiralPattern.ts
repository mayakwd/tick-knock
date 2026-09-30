/**
 * Fires a few bullets spread evenly around the circle, and rotates the barrel after every shot
 */
export class SpiralPattern {
  public constructor(
    /**
     * Amount of bullets in one shot
     */
    public readonly count: number,
    /**
     * Speed of bullets in pixels per second
     */
    public readonly speed: number,
    /**
     * Rotation of the barrel after every shot in radians
     */
    public readonly step: number,
  ) {}
}

/**
 * Fires a few bullets in a direction, that rotates after every shot
 */
export class SpiralPattern {
  /**
   * Current direction of the spiral in radians
   */
  public angle: number = Math.PI / 2;

  public constructor(
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
  ) {}
}

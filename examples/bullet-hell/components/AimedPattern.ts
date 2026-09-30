/**
 * Fires a fan of bullets at the player
 */
export class AimedPattern {
  public constructor(
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
  ) {}
}

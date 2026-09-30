/**
 * Moves the entity from side to side around the horizontal position where it has appeared
 */
export class Sway {
  public time: number = 0;

  public constructor(
    public readonly originX: number,
    public readonly amplitude: number,
    /**
     * Swings per second
     */
    public readonly frequency: number,
  ) {}
}

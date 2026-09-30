/**
 * Moves the entity from side to side. The swing is added to the position, so it works together with any other
 * movement.
 */
export class Sway {
  public time: number = 0;
  /**
   * Horizontal offset of the entity by the swing in the previous frame
   */
  public offset: number = 0;

  public constructor(
    public readonly amplitude: number,
    /**
     * Swings per second
     */
    public readonly frequency: number,
  ) {}
}

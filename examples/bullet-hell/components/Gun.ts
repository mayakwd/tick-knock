/**
 * Gun of the player: it fires while the fire control is pressed
 */
export class Gun {
  /**
   * Time in seconds until the gun can fire again
   */
  public cooldown: number = 0;

  public constructor(public readonly interval: number) {}
}

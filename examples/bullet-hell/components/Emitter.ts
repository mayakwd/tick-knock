/**
 * How an enemy fires:
 * - `ring` fires bullets in all directions at once,
 * - `spiral` fires a few bullets in a rotating direction,
 * - `aimed` fires a fan of bullets at the player.
 */
export type Pattern = 'ring' | 'spiral' | 'aimed';

/**
 * Bullet emitter of an enemy. All patterns are handled by one system, which reads the parameters of the emitter,
 * so a new enemy is new data, not new code.
 */
export class Emitter {
  /**
   * Time in seconds until the next shot
   */
  public cooldown: number;
  /**
   * Current direction of the spiral in radians
   */
  public angle: number = Math.PI / 2;

  public constructor(
    public readonly pattern: Pattern,
    /**
     * Time in seconds between shots
     */
    public readonly interval: number,
    /**
     * Amount of bullets in one shot
     */
    public readonly count: number,
    /**
     * Speed of bullets in pixels per second
     */
    public readonly speed: number,
    /**
     * Delay before the first shot, so enemies don't fire right at the edge of the screen
     */
    delay: number = 0.5,
  ) {
    this.cooldown = delay;
  }
}

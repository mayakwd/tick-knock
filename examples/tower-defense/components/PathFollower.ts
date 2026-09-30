/**
 * Moves the entity along the waypoints of the map
 */
export class PathFollower {
  /**
   * Index of the waypoint the entity moves to
   */
  public waypoint: number = 1;
  /**
   * Distance in pixels the entity has passed, towers target the creep that is closest to the exit
   */
  public distance: number = 0;

  public constructor(
    /**
     * Speed in pixels per second
     */
    public readonly speed: number,
  ) {}
}

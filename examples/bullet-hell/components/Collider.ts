/**
 * Circle used to detect collisions. The player's collider is much smaller than the ship, as usual in the genre.
 */
export class Collider {
  public constructor(public readonly radius: number) {}
}

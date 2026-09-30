/**
 * Hits all creeps in the radius around the target. A tower has it when its level deals damage in an area,
 * and its projectiles carry it.
 */
export class Splash {
  public constructor(public readonly radius: number) {}
}

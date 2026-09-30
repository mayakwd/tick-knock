/**
 * Slows hit creeps down. A tower has it when its level slows, and its projectiles carry it.
 */
export class SlowOnHit {
  public constructor(public readonly factor: number, public readonly seconds: number) {}
}

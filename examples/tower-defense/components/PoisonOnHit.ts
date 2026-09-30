/**
 * Poisons hit creeps. A tower has it when its level poisons, and its projectiles carry it.
 */
export class PoisonOnHit {
  public constructor(public readonly damagePerSecond: number, public readonly seconds: number) {}
}

/**
 * Slow applied by a hit
 */
export interface SlowDescription {
  /**
   * Multiplier of the speed of the creep, from 0 to 1
   */
  readonly factor: number;
  readonly seconds: number;
}

/**
 * Poison applied by a hit
 */
export interface PoisonDescription {
  readonly damagePerSecond: number;
  readonly seconds: number;
}

/**
 * What a hit does. Levels of towers describe it in the table, and the same description is the component of towers and
 * of their projectiles.
 */
export interface PayloadDescription {
  readonly damage: number;
  /**
   * Radius in pixels around the target, all creeps in it are hit. Without it only the target is hit.
   */
  readonly splash?: number;
  readonly slow?: SlowDescription;
  readonly poison?: PoisonDescription;
}

/**
 * What a hit of the tower does. It's copied from the tower to its projectiles, and every hit creep gets
 * a component for every effect of the payload.
 */
export class Payload implements PayloadDescription {
  public readonly damage: number;
  public readonly splash: number;
  public readonly slow?: SlowDescription;
  public readonly poison?: PoisonDescription;

  public constructor({damage, splash = 0, slow, poison}: PayloadDescription) {
    this.damage = damage;
    this.splash = splash;
    this.slow = slow;
    this.poison = poison;
  }
}

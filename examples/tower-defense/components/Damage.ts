import {LinkedComponent} from 'tick-knock';

export type DamageType = 'physical' | 'poison' | 'frost';

/**
 * Damage of a hit. The same description is used by levels of towers, and by components of towers, projectiles and
 * creeps: a tower deals the damage of its level, a projectile carries it, and a creep suffers it.
 */
export interface DamageDescription {
  readonly type: DamageType;
  /**
   * Strength of the damage:
   * - physical: health taken by the hit;
   * - poison: health taken every second;
   * - frost: part of the speed taken, from 0 to 1.
   */
  readonly amount: number;
  /**
   * Time in seconds the damage lasts. Physical damage has no duration, it's dealt once.
   */
  readonly duration?: number;
  /**
   * Radius in pixels around the target, all creeps in it are hit. Without it only the target is hit.
   */
  readonly splash?: number;
}

/**
 * A tower can deal several kinds of damage, and a creep can suffer several of them at the same time, so damage is
 * a linked component. It's copied from the tower to the projectile, and from the projectile to hit creeps.
 */
export class Damage extends LinkedComponent implements DamageDescription {
  public readonly type: DamageType;
  public readonly amount: number;
  /**
   * Time in seconds the damage lasts. On a creep it's the time left, and the damage expires when it's over.
   */
  public duration: number;
  public readonly splash: number;

  public constructor({type, amount, duration = 0, splash = 0}: DamageDescription) {
    super();
    this.type = type;
    this.amount = amount;
    this.duration = duration;
    this.splash = splash;
  }
}

import {LinkedComponent} from 'tick-knock';
import {PoisonEffect} from '../data/towers';

/**
 * Damages the creep over time. Poisons stack: every poison on the creep deals its damage until it expires.
 */
export class Poison extends LinkedComponent {
  public readonly damagePerSecond: number;
  /**
   * Time left in seconds
   */
  public seconds: number;

  public constructor({damagePerSecond, seconds}: PoisonEffect) {
    super();
    this.damagePerSecond = damagePerSecond;
    this.seconds = seconds;
  }
}

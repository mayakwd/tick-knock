import {LinkedComponent} from 'tick-knock';
import {PoisonDescription} from './Payload';

/**
 * Damages the creep over time. Poisons stack: every poison on the creep deals its damage until it expires.
 */
export class Poison extends LinkedComponent implements PoisonDescription {
  public readonly damagePerSecond: number;
  /**
   * Time left in seconds
   */
  public seconds: number;

  public constructor({damagePerSecond, seconds}: PoisonDescription) {
    super();
    this.damagePerSecond = damagePerSecond;
    this.seconds = seconds;
  }
}

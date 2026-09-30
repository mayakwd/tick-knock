import {LinkedComponent} from 'tick-knock';

/**
 * Damages the creep over time. Poisons stack: every poison on the creep deals its damage until it expires.
 */
export class Poison extends LinkedComponent {
  public constructor(public readonly damagePerSecond: number, public seconds: number) {
    super();
  }
}

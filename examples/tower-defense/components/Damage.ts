import {LinkedComponent} from 'tick-knock';

/**
 * Damage the creep takes in this update. A creep can be damaged by several hits at once, so damages are linked
 * components, and `DamageSystem` deals all of them.
 */
export class Damage extends LinkedComponent {
  public constructor(public readonly amount: number) {
    super();
  }
}

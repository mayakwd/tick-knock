import {LinkedComponent} from 'tick-knock';

/**
 * Damage the creep takes in this update. A creep can be hit by several projectiles at once, so hits are linked
 * components, and `DamageSystem` deals all of them.
 */
export class Hit extends LinkedComponent {
  public constructor(public readonly damage: number) {
    super();
  }
}

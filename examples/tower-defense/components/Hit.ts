import {LinkedComponent} from 'tick-knock';
import {Payload} from './Payload';

/**
 * Something has hit the creep with the payload: a projectile has reached it, or a spell has been cast on it.
 * `HitSystem` applies the payload to the creep, or to every creep around it, and doesn't care what has hit them.
 * A creep can be hit several times in one update, so hits are linked components.
 */
export class Hit extends LinkedComponent {
  public constructor(public readonly payload: Payload) {
    super();
  }
}

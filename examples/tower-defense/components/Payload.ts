import {Effect, Impact, PayloadDescription} from '../data/towers';

/**
 * What a hit of the tower does. It's immutable, so the tower shares it with its projectiles: a projectile keeps the
 * payload of the shot, and an upgrade gives the tower a new payload instead of changing this one.
 */
export class Payload implements PayloadDescription {
  public constructor(
    public readonly damage: number,
    public readonly impact: Impact,
    public readonly effects: ReadonlyArray<Effect>,
  ) {}
}

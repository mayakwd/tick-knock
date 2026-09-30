/**
 * The player can't be hit while the component is on the entity. It's added after a hit and removed when the time
 * is over, so systems that care about it just check the presence of the component.
 */
export class Invulnerable {
  public constructor(public seconds: number) {}
}

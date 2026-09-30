/**
 * Message dispatched when a bullet destroys an asteroid
 */
export class AsteroidDestroyed {
  public constructor(public readonly size: number) {}
}

/**
 * Message dispatched when the ship collides with an asteroid
 */
export class ShipDestroyed {}

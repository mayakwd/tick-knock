import {Entity} from 'tick-knock';

/**
 * Message dispatched when a bullet destroys an asteroid. The asteroid is removed after the update, so the game can
 * read its components to split it.
 */
export class AsteroidDestroyed {
  public constructor(public readonly asteroid: Entity) {}
}

/**
 * Message dispatched when the ship collides with an asteroid
 */
export class ShipDestroyed {}

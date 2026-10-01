/**
 * Direction of the gun of an enemy in radians. Patterns are descriptions, shared by all enemies of a kind, so the
 * direction, that changes, is the state of every enemy: an aimed pattern turns the barrel to the player, a spiral
 * rotates it after every shot.
 */
export class Barrel {
  public constructor(public angle: number = Math.PI / 2) {}
}

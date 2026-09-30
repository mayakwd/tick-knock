/**
 * Points of the player. They don't belong to any entity, so the game keeps them, and systems, that give points,
 * receive the score in their constructors.
 */
export class Score {
  public points = 0;
}

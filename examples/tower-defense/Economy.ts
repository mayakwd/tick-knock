/**
 * Gold and lives of the player. They belong to the game, not to any entity, so they are kept in a plain object
 * passed to the systems that need them.
 */
export interface Economy {
  gold: number;
  lives: number;
}

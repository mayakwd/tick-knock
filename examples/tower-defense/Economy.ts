/**
 * Gold and lives of the player. They belong to the game, not to any entity, so they are kept in a plain object.
 * Systems report what has happened with messages, and the game changes the economy.
 */
export interface Economy {
  gold: number;
  lives: number;
}

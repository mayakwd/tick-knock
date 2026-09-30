import {START_GOLD, START_LIVES} from './config';

/**
 * Gold and lives of the player. They belong to the game, not to any entity, so they are kept by the game.
 * Systems report what has happened with messages, and the game changes the economy.
 */
export class Economy {
  public gold = START_GOLD;
  public lives = START_LIVES;
}

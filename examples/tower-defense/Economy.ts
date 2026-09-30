import {START_GOLD, START_LIVES} from './config';

/**
 * Gold and lives of the player. They belong to the game, not to any entity, so they are kept by the game, and systems,
 * that change them, receive the economy in their constructors.
 */
export class Economy {
  public gold = START_GOLD;
  public lives = START_LIVES;
}

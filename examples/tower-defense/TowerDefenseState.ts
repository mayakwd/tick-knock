import {GameState} from '../shared/ecs/GameState';
import {START_GOLD, START_LIVES} from './config';

/**
 * Gold and lives belong to the player, not to any entity, so they are kept in the state, and systems that change them
 * receive the state in their constructors
 */
export class TowerDefenseState extends GameState {
  public gold = START_GOLD;
  public lives = START_LIVES;
}

import {GameState} from '../shared/ecs/GameState';
import {START_GOLD, START_LIVES} from './config';

/**
 * Gold, lives and the wave belong to the player and the game, not to any entity, so they are kept in the state, and
 * systems that change them receive the state in their constructors.
 */
export class TowerDefenseState extends GameState {
  public gold = START_GOLD;
  public lives = START_LIVES;
  /**
   * Number of the current wave, starting from 1
   */
  public wave = 1;
}

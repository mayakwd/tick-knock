import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {Random} from '../random';
import {Controls} from './Controls';
import {GameState} from './GameState';

export interface GameOptions<C extends Controls> {
  /**
   * Layer views of entities are added to
   */
  readonly layer: Container;
  /**
   * Intents of the player or the autopilot, read by control systems of the game
   */
  readonly controls: C;
  /**
   * Random number generator, tests pass a seeded one to make the game reproducible
   */
  readonly random: Random;
}

/**
 * The engine with all systems of a game. A game only adds systems in the order of the update and creates the first
 * entities: all the logic is in systems, and the world outside only calls `update`.
 */
export abstract class Game<S extends GameState = GameState> {
  public readonly engine = new Engine();

  protected constructor(public readonly state: S) {}

  public get isOver(): boolean {
    return this.state.outcome !== undefined;
  }

  /**
   * Advances the game. A finished game doesn't change anymore: its world freezes as it was at the end.
   * @param dt Time in seconds
   */
  public update(dt: number): void {
    if (!this.isOver) this.engine.update(dt);
  }
}

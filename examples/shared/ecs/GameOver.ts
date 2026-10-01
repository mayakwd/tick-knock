import {Outcome} from './GameState';

/**
 * Message dispatched by the `GameOverSystem` of the game, once. The game logic doesn't need it, it's for the world
 * outside of the engine: the demo shows the message and restarts the game, a real game would also play a sound or save
 * the record.
 */
export class GameOver {
  public constructor(public readonly outcome: Outcome) {}
}

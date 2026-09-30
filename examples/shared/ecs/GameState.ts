/**
 * How the game has ended
 */
export type Outcome = 'won' | 'lost';

/**
 * State of the game that no entity owns, like the score or the number of the wave. Every game extends it with its own
 * fields, and systems that change them receive the state in their constructors.
 */
export class GameState {
  /**
   * Undefined while the game goes on. Only the `GameOverSystem` of the game writes it.
   */
  public outcome: Outcome | undefined = undefined;
}

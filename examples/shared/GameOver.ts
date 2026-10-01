/**
 * Message dispatched by the system, that has noticed the end of the game. The game logic doesn't need it, it's for the
 * world outside of the engine: the demo shows the message and restarts the game, a real game would also play a sound
 * or save the record.
 */
export class GameOver {
  /**
   * @param isWon The player has won, not lost
   */
  public constructor(public readonly isWon: boolean = false) {}
}

/**
 * Who fills the controls of the game
 */
export type Pilot = 'player' | 'autopilot';

/**
 * Intents of the player. Every game extends it with its own intents: input of the page writes them while the player
 * plays, the `AutopilotSystem` of the game writes them otherwise, and control systems of the game carry them out.
 *
 * The page owns the controls and passes them to every new game, so input doesn't need to know which game is current.
 */
export abstract class Controls {
  /**
   * The autopilot writes intents only when it's its turn
   */
  public pilot: Pilot = 'autopilot';
}

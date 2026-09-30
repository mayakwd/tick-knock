/**
 * Controls shared between the input source and the player control system
 */
export interface Controls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  /**
   * Slow movement for precise dodging
   */
  focus: boolean;
  fire: boolean;
}

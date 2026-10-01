/**
 * Controls shared between the input source and the player control system, so any input source can control
 * the player: keyboard, autopilot or a test
 */
export class Controls {
  public left = false;
  public right = false;
  public up = false;
  public down = false;
  /**
   * Slow movement for precise dodging
   */
  public focus = false;
  public fire = false;
}

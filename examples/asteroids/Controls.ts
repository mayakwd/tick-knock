/**
 * Controls shared between the input source and the ship control system, so any input source can control the ship:
 * keyboard, autopilot or a test
 */
export class Controls {
  public left = false;
  public right = false;
  public thrust = false;
  public fire = false;

  /**
   * Releases all controls
   */
  public release(): void {
    this.left = this.right = this.thrust = this.fire = false;
  }
}

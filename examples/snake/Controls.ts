export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Steps of directions in cells
 */
export const DIRECTIONS: Readonly<Record<Direction, { readonly dx: number; readonly dy: number }>> = {
  up: {dx: 0, dy: -1},
  down: {dx: 0, dy: 1},
  left: {dx: -1, dy: 0},
  right: {dx: 1, dy: 0},
};

/**
 * Controls shared between the input source and the game. Any input source can turn the snake: keyboard, autopilot
 * or a test, and the game takes the direction once per tick.
 */
export class Controls {
  private direction?: Direction;

  /**
   * Turns the snake on the next tick
   */
  public turn(direction: Direction | undefined): void {
    this.direction = direction;
  }

  /**
   * Returns the direction to turn to, and forgets it, so the snake turns once
   */
  public takeDirection(): Direction | undefined {
    const {direction} = this;
    this.direction = undefined;
    return direction;
  }
}

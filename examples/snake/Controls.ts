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
 * Controls shared between the input source and the game. It's a plain object read by the steering system,
 * so any input source can change it: keyboard, autopilot or a test.
 */
export interface Controls {
  direction?: Direction;
}

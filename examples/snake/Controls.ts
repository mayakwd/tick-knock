export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Controls shared between the input source and the game. It's a plain object passed to the steering system,
 * so any input source can change it: keyboard, autopilot or a test.
 */
export interface Controls {
  direction?: Direction;
}

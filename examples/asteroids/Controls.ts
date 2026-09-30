/**
 * Controls shared between the input source and the ship control system. It's a plain object, so any input source
 * can change it: keyboard, autopilot or a test.
 */
export interface Controls {
  left: boolean;
  right: boolean;
  thrust: boolean;
  fire: boolean;
}

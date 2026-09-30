import {Keyboard} from '../../shared/Keyboard';
import {Controls, Direction} from '../Controls';

const KEYS: Record<string, Direction> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export const KEY_CODES = Object.keys(KEYS);

/**
 * Turns the snake when a key is pressed. The last pressed direction is applied on the next tick.
 */
export function bindKeyboard(keyboard: Keyboard, controls: () => Controls): void {
  for (const [code, direction] of Object.entries(KEYS)) {
    keyboard.onPress(code, () => {
      controls().turn(direction);
    });
  }
}

import {Keyboard} from '../../shared/Keyboard';
import {Controls} from '../Controls';

export const KEY_CODES = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'KeyW', 'Space', 'KeyR'];

/**
 * Updates the controls from the keyboard
 */
export function readKeyboard(keyboard: Keyboard, controls: Controls): void {
  controls.left = keyboard.isDown('ArrowLeft', 'KeyA');
  controls.right = keyboard.isDown('ArrowRight', 'KeyD');
  controls.thrust = keyboard.isDown('ArrowUp', 'KeyW');
  controls.fire = keyboard.isDown('Space');
}

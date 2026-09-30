import {Keyboard} from '../../shared/Keyboard';
import {Controls} from '../Controls';

export const KEY_CODES = [
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'KeyA', 'KeyD', 'KeyW', 'KeyS',
  'ShiftLeft', 'ShiftRight', 'Space', 'KeyZ', 'KeyR',
];

/**
 * Updates the controls from the keyboard
 */
export function readKeyboard(keyboard: Keyboard, controls: Controls): void {
  controls.left = keyboard.isDown('ArrowLeft', 'KeyA');
  controls.right = keyboard.isDown('ArrowRight', 'KeyD');
  controls.up = keyboard.isDown('ArrowUp', 'KeyW');
  controls.down = keyboard.isDown('ArrowDown', 'KeyS');
  controls.focus = keyboard.isDown('ShiftLeft', 'ShiftRight');
  controls.fire = keyboard.isDown('Space', 'KeyZ');
}

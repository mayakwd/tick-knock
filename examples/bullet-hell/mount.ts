import {mountDemo} from '../shared/demo';
import {MountGame} from '../shared/mount';
import {HEIGHT, WIDTH} from './config';
import {createBulletHellGame} from './game';
import {createAutopilot} from './input/autopilot';
import {KEY_CODES, readKeyboard} from './input/keyboardControls';
import {addRendering} from './render/addRendering';

/**
 * Starts the bullet hell in the element
 */
export const mountBulletHell: MountGame = (element) => mountDemo(element, {
  width: WIDTH,
  height: HEIGHT,
  background: 0x0a0c14,
  keys: KEY_CODES,
  create: (layer) => createBulletHellGame({setup: (engine) => addRendering(engine, layer)}),
  createAutopilot,
  advance(game, dt, input) {
    input();
    game.update(dt);
  },
  readInput: (keyboard, game) => readKeyboard(keyboard, game.controls),
  status: ({score, wave, lives, enemyBullets}) => `Score: ${score}   Wave: ${wave}   Lives: ${lives}   Bullets: ${enemyBullets}`,
});

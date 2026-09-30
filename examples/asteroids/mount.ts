import {mountDemo} from '../shared/demo';
import {MountGame} from '../shared/mount';
import {HEIGHT, WIDTH} from './config';
import {createAsteroidsGame} from './game';
import {createAutopilot} from './input/autopilot';
import {KEY_CODES, readKeyboard} from './input/keyboardControls';
import {addRendering} from './render/addRendering';

/**
 * Starts Asteroids in the element
 */
export const mountAsteroids: MountGame = (element) => mountDemo(element, {
  width: WIDTH,
  height: HEIGHT,
  background: 0x05060a,
  keys: KEY_CODES,
  create: (layer) => createAsteroidsGame({width: WIDTH, height: HEIGHT, setup: (engine) => addRendering(engine, layer)}),
  createAutopilot,
  advance(game, dt, input) {
    input();
    game.update(dt);
  },
  readInput: (keyboard, game) => readKeyboard(keyboard, game.controls),
  status: (game) => `Score: ${game.score}   Wave: ${game.wave}`,
});

import {mountDemo} from '../shared/demo';
import {MountGame} from '../shared/mount';
import {CELL, COLUMNS, ROWS, TICK} from './config';
import {createSnakeGame} from './game';
import {createAutopilot} from './input/autopilot';
import {bindKeyboard, KEY_CODES} from './input/keyboardControls';
import {addRendering} from './render/addRendering';

/**
 * Starts Snake in the element. The game logic works in ticks, so the time of frames is accumulated and the game is
 * advanced by whole ticks.
 */
export const mountSnake: MountGame = (element) => {
  let accumulated = 0;
  return mountDemo(element, {
    width: COLUMNS * CELL,
    height: ROWS * CELL,
    background: 0x0d1117,
    keys: KEY_CODES,
    create: (layer) => createSnakeGame({width: COLUMNS, height: ROWS, setup: (engine) => addRendering(engine, layer)}),
    createAutopilot,
    advance(game, dt, input) {
      for (accumulated += dt; accumulated >= TICK; accumulated -= TICK) {
        input();
        game.tick();
      }
    },
    status: (game) => `Score: ${game.score}${game.isWon ? '   The snake fills the board!' : ''}`,
    // Keys turn the snake when they are pressed, not every frame
    extend: (demo) => bindKeyboard(demo.keyboard, () => demo.game.controls),
  });
};

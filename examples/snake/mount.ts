import {Container, Ticker} from 'pixi.js';
import {Keyboard} from '../shared/Keyboard';
import {createApplication, frameTime, MountGame} from '../shared/mount';
import {Hud} from '../shared/render/Hud';
import {createSnakeGame, SnakeGame} from './game';
import {createAutopilot} from './input/autopilot';
import {bindKeyboard, KEY_CODES} from './input/keyboardControls';
import {addRendering} from './render/addRendering';
import {CELL} from './render/graphics';

const COLUMNS = 30;
const ROWS = 20;
/**
 * Time of one tick in seconds
 */
const TICK = 0.1;
const DEMO_RESTART_DELAY = 2;

/**
 * Starts Snake in the element. The autopilot plays until the game gets focus, then the player takes control.
 * The game logic works in ticks, so the time of frames is accumulated and the game is advanced by whole ticks.
 */
export const mountSnake: MountGame = async (element) => {
  const width = COLUMNS * CELL;
  const height = ROWS * CELL;
  const app = await createApplication(element, {width, height, background: 0x0d1117});
  const keyboard = new Keyboard(app.canvas, KEY_CODES);
  const world = new Container();
  const hud = new Hud(width, height);
  app.stage.addChild(world, hud);

  let game: SnakeGame;
  let autopilot: () => void;
  let accumulated = 0;
  let overTime = 0;
  const start = () => {
    for (const child of world.removeChildren()) child.destroy({children: true});
    game = createSnakeGame({width: COLUMNS, height: ROWS, setup: (engine) => addRendering(engine, world)});
    autopilot = createAutopilot(game);
    accumulated = 0;
    overTime = 0;
  };
  start();
  bindKeyboard(keyboard, () => game.controls);
  keyboard.onPress('KeyR', () => {
    if (game.isOver) start();
  });

  const update = (ticker: Ticker) => {
    const dt = frameTime(ticker.deltaMS);
    const playing = document.activeElement === app.canvas;
    for (accumulated += dt; accumulated >= TICK; accumulated -= TICK) {
      if (!playing) autopilot();
      game.tick();
    }

    hud.setStatus(`Score: ${game.score}`);
    hud.setHint(playing ? '' : 'Autopilot is playing, click to take control');
    if (game.isOver) {
      overTime += dt;
      if (!playing && overTime > DEMO_RESTART_DELAY) start();
      hud.setMessage(playing ? 'Game over\nPress R to restart' : 'Game over');
    } else {
      hud.setMessage('');
    }
  };
  app.ticker.add(update);

  return () => {
    keyboard.destroy();
    app.destroy({removeView: true}, {children: true});
  };
};

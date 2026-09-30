import {Container, Ticker} from 'pixi.js';
import {Keyboard} from '../shared/Keyboard';
import {createApplication, frameTime, MountGame} from '../shared/mount';
import {Hud} from '../shared/render/Hud';
import {AsteroidsGame, createAsteroidsGame} from './game';
import {createAutopilot} from './input/autopilot';
import {KEY_CODES, readKeyboard} from './input/keyboardControls';
import {addRendering} from './render/addRendering';

const WIDTH = 800;
const HEIGHT = 600;
/**
 * Time in seconds after which the demo restarts when the autopilot has lost
 */
const DEMO_RESTART_DELAY = 2;

/**
 * Starts Asteroids in the element. The autopilot plays until the game gets focus, then the player takes control.
 */
export const mountAsteroids: MountGame = async (element) => {
  const app = await createApplication(element, {width: WIDTH, height: HEIGHT, background: 0x05060a});
  const keyboard = new Keyboard(app.canvas, KEY_CODES);
  const world = new Container();
  const hud = new Hud(WIDTH, HEIGHT);
  app.stage.addChild(world, hud);

  let game: AsteroidsGame;
  let autopilot: () => void;
  let overTime = 0;
  const start = () => {
    for (const child of world.removeChildren()) child.destroy({children: true});
    game = createAsteroidsGame({width: WIDTH, height: HEIGHT, setup: (engine) => addRendering(engine, world)});
    autopilot = createAutopilot(game);
    overTime = 0;
  };
  start();
  keyboard.onPress('KeyR', () => {
    if (game.isOver) start();
  });

  const update = (ticker: Ticker) => {
    const dt = frameTime(ticker.deltaMS);
    const playing = document.activeElement === app.canvas;
    if (playing) {
      readKeyboard(keyboard, game.controls);
    } else {
      autopilot();
    }
    game.update(dt);

    hud.setStatus(`Score: ${game.score}   Wave: ${game.wave}`);
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

import {Query, QueryBuilder} from 'tick-knock';
import {Container, Ticker} from 'pixi.js';
import {Keyboard} from '../shared/Keyboard';
import {createApplication, frameTime, MountGame} from '../shared/mount';
import {Hud} from '../shared/render/Hud';
import {HEIGHT, WIDTH} from './config';
import {BulletHellGame, createBulletHellGame} from './game';
import {createAutopilot} from './input/autopilot';
import {KEY_CODES, readKeyboard} from './input/keyboardControls';
import {addRendering} from './render/addRendering';
import {ENEMY_BULLET} from './tags';

const DEMO_RESTART_DELAY = 2;

/**
 * Starts the bullet hell in the element. The autopilot plays until the game gets focus, then the player takes control.
 */
export const mountBulletHell: MountGame = async (element) => {
  const app = await createApplication(element, {width: WIDTH, height: HEIGHT, background: 0x0a0c14});
  const keyboard = new Keyboard(app.canvas, KEY_CODES);
  const world = new Container();
  const hud = new Hud(WIDTH, HEIGHT);
  app.stage.addChild(world, hud);

  let game: BulletHellGame;
  let autopilot: () => void;
  let bullets: Query;
  let overTime = 0;
  const start = () => {
    for (const child of world.removeChildren()) child.destroy({children: true});
    game = createBulletHellGame({setup: (engine) => addRendering(engine, world)});
    autopilot = createAutopilot(game);
    bullets = new QueryBuilder().contains(ENEMY_BULLET).build();
    game.engine.addQuery(bullets);
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

    hud.setStatus(`Score: ${game.score}   Wave: ${game.wave}   Lives: ${game.lives}   Bullets: ${bullets.length}`);
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

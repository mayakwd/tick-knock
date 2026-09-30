import {Container, Ticker} from 'pixi.js';
import {Keyboard} from '../shared/Keyboard';
import {createApplication, frameTime, MountGame} from '../shared/mount';
import {Hud} from '../shared/render/Hud';
import {HEIGHT, WIDTH} from './config';
import {createTowerDefenseGame, TowerDefenseGame} from './game';
import {createAutopilot} from './input/autopilot';
import {TowerPlacement} from './input/pointer';
import {addRendering} from './render/addRendering';
import {drawMap} from './render/drawMap';
import {TOWER_KINDS, TOWERS} from './towers';

const KEY_CODES = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyR'];
const DEMO_RESTART_DELAY = 3;

/**
 * Starts the tower defense in the element. The autopilot builds towers until the game gets focus,
 * then the player takes control: keys 1-4 select a tower, a click builds it.
 */
export const mountTowerDefense: MountGame = async (element) => {
  const app = await createApplication(element, {width: WIDTH, height: HEIGHT, background: 0x0f1a12});
  const keyboard = new Keyboard(app.canvas, KEY_CODES);
  const world = new Container();
  const hud = new Hud(WIDTH, HEIGHT);
  app.stage.addChild(drawMap(), world);
  const isPlaying = () => document.activeElement === app.canvas;
  const placement = new TowerPlacement(app.stage, () => game, isPlaying);
  app.stage.addChild(hud);
  app.stage.hitArea = app.screen;

  let game: TowerDefenseGame;
  let autopilot: () => void;
  let overTime = 0;
  const start = () => {
    for (const child of world.removeChildren()) child.destroy({children: true});
    game = createTowerDefenseGame({setup: (engine) => addRendering(engine, world)});
    autopilot = createAutopilot(game);
    overTime = 0;
  };
  start();
  TOWER_KINDS.forEach((kind, index) => keyboard.onPress(`Digit${index + 1}`, () => {
    placement.kind = kind;
  }));
  keyboard.onPress('KeyR', () => {
    if (game.isOver) start();
  });
  // A click on the canvas focuses it, so the player takes control from the autopilot.
  // Pixi listens to the canvas since the application was created, so it handles the click before this listener,
  // while the game is not focused yet: the click that takes control doesn't build a tower.
  const takeControl = () => app.canvas.focus();
  app.canvas.addEventListener('pointerdown', takeControl);

  const update = (ticker: Ticker) => {
    const dt = frameTime(ticker.deltaMS);
    const playing = isPlaying();
    if (!playing) autopilot();
    game.update(dt);
    placement.update();

    const {gold, lives} = game.economy;
    hud.setStatus(`Gold: ${gold}   Lives: ${lives}   Wave: ${game.wave}   ${placement.action ?? `Tower: ${TOWERS[placement.kind].name}`}`);
    hud.setHint(playing
      ? '1 Arrow   2 Cannon   3 Frost   4 Poison   click a cell to build, click a tower to upgrade'
      : 'Autopilot is playing, click to take control');
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
    placement.destroy();
    app.canvas.removeEventListener('pointerdown', takeControl);
    app.destroy({removeView: true}, {children: true});
  };
};

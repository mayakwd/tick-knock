import {mountDemo} from '../shared/demo';
import {MountGame} from '../shared/mount';
import {HEIGHT, WIDTH} from './config';
import {createTowerDefenseGame} from './game';
import {createAutopilot} from './input/autopilot';
import {TowerPlacement} from './input/pointer';
import {addRendering} from './render/addRendering';
import {drawMap} from './render/drawMap';
import {TOWER_KINDS, TOWERS} from './towers';

const TOWER_KEYS = TOWER_KINDS.map((kind, index) => `Digit${index + 1}`);

/**
 * Starts the tower defense in the element: keys 1-4 select a tower, a click builds it or upgrades a tower
 */
export const mountTowerDefense: MountGame = (element) => {
  let placement: TowerPlacement | undefined;
  return mountDemo(element, {
    width: WIDTH,
    height: HEIGHT,
    background: 0x0f1a12,
    keys: TOWER_KEYS,
    hint: '1 Arrow  2 Cannon  3 Frost  4 Poison   click to build or upgrade',
    restartDelay: 3,
    create: (layer) => createTowerDefenseGame({setup: (engine) => addRendering(engine, layer)}),
    createAutopilot,
    advance(game, dt, input) {
      input();
      game.update(dt);
    },
    status: ({economy: {gold, lives}, wave}) => {
      const action = placement?.action ?? `Tower: ${TOWERS[placement?.kind ?? 'arrow'].name}`;
      return `Gold: ${gold}   Lives: ${lives}   Wave: ${wave}   ${action}`;
    },
    extend(demo, below, above) {
      below.addChild(drawMap());
      const current = new TowerPlacement(demo, above);
      placement = current;
      TOWER_KINDS.forEach((kind, index) => demo.keyboard.onPress(TOWER_KEYS[index], () => {
        current.kind = kind;
      }));
      return {update: () => current.update(), destroy: () => current.destroy()};
    },
  });
};

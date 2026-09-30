import {Container} from 'pixi.js';
import {Autopilot, Demo, MountGame} from '../shared/Demo';
import {HEIGHT, WIDTH} from './config';
import {TowerDefenseGame} from './game';
import {TowerDefenseAutopilot} from './input/autopilot';
import {TowerPlacement} from './input/pointer';
import {drawMap} from './render/drawMap';
import {TOWER_KINDS, TOWERS} from './towers';

const TOWER_KEYS = TOWER_KINDS.map((kind, index) => `Digit${index + 1}`);

/**
 * The tower defense in a page: keys 1-4 select a tower, a click builds it or upgrades a tower
 */
class TowerDefenseDemo extends Demo<TowerDefenseGame> {
  private placement!: TowerPlacement;

  public constructor() {
    super({
      width: WIDTH,
      height: HEIGHT,
      background: 0x0f1a12,
      keys: TOWER_KEYS,
      hint: '1 Arrow  2 Cannon  3 Frost  4 Poison   click to build or upgrade',
      restartDelay: 3,
    });
  }

  protected get status(): string {
    const {economy: {gold, lives}, wave} = this.game;
    const action = this.placement.action ?? `Tower: ${TOWERS[this.placement.kind].name}`;
    return `Gold: ${gold}   Lives: ${lives}   Wave: ${wave}   ${action}`;
  }

  public destroy(): void {
    this.placement.destroy();
    super.destroy();
  }

  protected setup(): void {
    // The map never changes, so it's drawn once under the world
    this.background.addChild(drawMap());
    this.placement = new TowerPlacement(this.app.stage, this.app.screen, this.overlay);

    TOWER_KINDS.forEach((kind, index) => this.keyboard.onPress(TOWER_KEYS[index], () => {
      this.placement.kind = kind;
    }));
  }

  protected createGame(layer: Container): TowerDefenseGame {
    return new TowerDefenseGame({layer});
  }

  protected createAutopilot(game: TowerDefenseGame): Autopilot {
    return new TowerDefenseAutopilot(game);
  }

  protected advance(dt: number): void {
    this.control();
    this.game.update(dt);
    this.placement.update(this.game, this.isPlaying);
  }
}

export const mountTowerDefense: MountGame = async (element) => {
  const demo = new TowerDefenseDemo();
  await demo.mount(element);
  return () => demo.destroy();
};

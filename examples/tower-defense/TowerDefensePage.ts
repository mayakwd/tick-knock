import {Container} from 'pixi.js';
import {DemoStage, GamePage} from '../shared/demo/GamePage';
import {Keyboard} from '../shared/demo/Keyboard';
import {HEIGHT, WIDTH} from './config';
import {TOWER_KEYS, TowerPlacement} from './input/TowerPlacement';
import {GRASS_COLOR} from './render/colors';
import {drawMap} from './render/drawMap';
import {TowerDefenseControls} from './TowerDefenseControls';
import {TowerDefenseGame} from './TowerDefenseGame';

/**
 * The tower defense in a page: keys 1-4 select a tower, a click builds it or upgrades a tower
 */
export class TowerDefensePage extends GamePage<TowerDefenseGame, TowerDefenseControls> {
  private readonly placement: TowerPlacement;

  public constructor() {
    super(
      {
        width: WIDTH,
        height: HEIGHT,
        background: GRASS_COLOR,
        keys: TOWER_KEYS,
        hint: '1 Arrow  2 Cannon  3 Frost  4 Poison   click to build or upgrade',
        restartDelay: 3,
      },
      new TowerDefenseControls(),
    );
    this.placement = new TowerPlacement(this.controls);
  }

  public createGame(world: Container): TowerDefenseGame {
    return new TowerDefenseGame({layer: world, controls: this.controls, random: Math.random});
  }

  public status({state: {gold, lives}, wave, construction}: TowerDefenseGame): string {
    return `Gold: ${gold}   Lives: ${lives}   Wave: ${wave}   ${this.placement.describe(construction)}`;
  }

  public setup(stage: DemoStage): void {
    // The map never changes, so it's drawn once under the world
    stage.background.addChild(drawMap());
    this.placement.attach(stage);
  }

  public readInput(keyboard: Keyboard, {construction}: TowerDefenseGame): void {
    this.placement.readInput(construction);
  }

  public present({construction}: TowerDefenseGame): void {
    this.placement.drawPreview(construction);
  }
}

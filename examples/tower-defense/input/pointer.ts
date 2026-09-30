import {Container, FederatedPointerEvent, Graphics} from 'pixi.js';
import {Demo} from '../../shared/demo';
import {CELL} from '../config';
import {TowerDefenseGame} from '../game';
import {Cell} from '../components';
import {cellAt, cellCenter} from '../map';
import {TowerKind, TOWERS} from '../towers';

const ALLOWED_COLOR = 0x3fb950;
const FORBIDDEN_COLOR = 0xf85149;

/**
 * Builds a tower where the player clicks an empty cell, and upgrades a tower the player clicks.
 * The preview shows the cell and the range the tower would have.
 */
export class TowerPlacement {
  public kind: TowerKind = 'arrow';
  private readonly preview = new Graphics();
  private cell?: Cell;

  /**
   * @param demo The running demo: its stage receives pointer events, and its game changes when the game restarts
   * @param layer Layer the preview is drawn in
   */
  public constructor(private readonly demo: Demo<TowerDefenseGame>, layer: Container) {
    const {stage} = demo.app;
    stage.eventMode = 'static';
    stage.hitArea = demo.app.screen;
    stage.on('pointermove', this.onMove);
    stage.on('pointerdown', this.onDown);
    stage.on('pointerleave', this.onLeave);
    layer.addChild(this.preview);
  }

  /**
   * Describes what a click does in the cell under the pointer, or returns undefined if the pointer is out of the map
   */
  public get action(): string | undefined {
    if (this.cell === undefined) return undefined;
    const {game} = this.demo;
    const tower = game.towerAt(this.cell);
    if (tower === undefined) return `Build ${TOWERS[this.kind].name}: ${TOWERS[this.kind].levels[0].cost}`;
    const next = game.nextLevel(this.cell);
    const name = `${TOWERS[tower.kind].name} ${tower.level + 1}`;
    return next === undefined ? `${name}: the last level` : `Upgrade ${name}: ${next.cost}`;
  }

  /**
   * Redraws the preview, the possibility to build or upgrade changes every frame together with gold
   */
  public update(): void {
    this.preview.clear();
    if (this.cell === undefined) return;
    const {game} = this.demo;
    const {x, y} = cellCenter(this.cell);
    const tower = game.towerAt(this.cell);
    // A tower shows the range of its next level, an empty cell shows the range of the selected tower
    const level = tower !== undefined
      ? game.nextLevel(this.cell) ?? TOWERS[tower.kind].levels[tower.level]
      : TOWERS[this.kind].levels[0];
    const allowed = tower !== undefined ? game.canUpgrade(this.cell) : game.canBuild(this.kind, this.cell);
    const color = allowed ? ALLOWED_COLOR : FORBIDDEN_COLOR;
    this.preview
      .circle(x, y, level.range)
      .fill({color, alpha: 0.08})
      .stroke({width: 1, color, alpha: 0.5})
      .rect(x - CELL / 2, y - CELL / 2, CELL, CELL)
      .stroke({width: 2, color});
  }

  public destroy(): void {
    const {stage} = this.demo.app;
    stage.off('pointermove', this.onMove);
    stage.off('pointerdown', this.onDown);
    stage.off('pointerleave', this.onLeave);
  }

  private readonly onMove = (event: FederatedPointerEvent) => {
    this.cell = cellAt(event.global);
  };

  private readonly onDown = (event: FederatedPointerEvent) => {
    this.onMove(event);
    // The click that takes control from the autopilot only focuses the game
    if (!this.demo.isPlaying || this.cell === undefined) return;
    const {game} = this.demo;
    if (game.towerAt(this.cell) !== undefined) {
      game.upgrade(this.cell);
    } else {
      game.build(this.kind, this.cell);
    }
  };

  private readonly onLeave = () => {
    this.cell = undefined;
  };
}

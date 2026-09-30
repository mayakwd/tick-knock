import {Container, FederatedPointerEvent, Graphics, Rectangle} from 'pixi.js';
import {Cell} from '../components';
import {CELL} from '../config';
import {TowerDefenseGame} from '../game';
import {cellAt, cellCenter} from '../map';
import {TowerKind, TOWERS} from '../towers';

const ALLOWED_COLOR = 0x3fb950;
const FORBIDDEN_COLOR = 0xf85149;

/**
 * Builds a tower where the player clicks an empty cell, and upgrades a tower the player clicks.
 * The preview shows the cell and the range the tower would have.
 */
export class TowerPlacement {
  /**
   * Kind of towers the player builds
   */
  public kind: TowerKind = 'arrow';
  private readonly preview = new Graphics();
  private cell?: Cell;
  private game?: TowerDefenseGame;
  private isEnabled = false;

  /**
   * @param stage Stage that receives pointer events
   * @param screen Area of the stage
   * @param layer Layer the preview is drawn in
   */
  public constructor(private readonly stage: Container, screen: Rectangle, layer: Container) {
    stage.eventMode = 'static';
    stage.hitArea = screen;
    stage.on('pointermove', this.onMove);
    stage.on('pointerdown', this.onDown);
    stage.on('pointerleave', this.onLeave);
    layer.addChild(this.preview);
  }

  /**
   * Describes what a click does in the cell under the pointer, or returns undefined if the pointer is out of the map
   */
  public get action(): string | undefined {
    const {cell, game} = this;
    if (cell === undefined || game === undefined) return undefined;

    const tower = game.towerAt(cell);
    if (tower === undefined) return `Build ${TOWERS[this.kind].name}: ${TOWERS[this.kind].levels[0].cost}`;

    const next = game.nextLevel(cell);
    const name = `${TOWERS[tower.kind].name} ${tower.level + 1}`;
    return next === undefined ? `${name}: the last level` : `Upgrade ${name}: ${next.cost}`;
  }

  /**
   * Redraws the preview: the possibility to build or upgrade changes every frame together with gold
   * @param game The current game, it changes when the game restarts
   * @param isEnabled Clicks build and upgrade towers only while the player controls the game
   */
  public update(game: TowerDefenseGame, isEnabled: boolean): void {
    this.game = game;
    this.isEnabled = isEnabled;
    this.preview.clear();
    const {cell} = this;
    if (cell === undefined) return;

    // A tower shows the range of its next level, an empty cell shows the range of the selected tower
    const tower = game.towerAt(cell);
    const level = tower !== undefined
      ? game.nextLevel(cell) ?? TOWERS[tower.kind].levels[tower.level]
      : TOWERS[this.kind].levels[0];
    const isAllowed = tower !== undefined ? game.canUpgrade(cell) : game.canBuild(this.kind, cell);
    const color = isAllowed ? ALLOWED_COLOR : FORBIDDEN_COLOR;

    const {x, y} = cellCenter(cell);
    this.preview
      .circle(x, y, level.range)
      .fill({color, alpha: 0.08})
      .stroke({width: 1, color, alpha: 0.5})
      .rect(x - CELL / 2, y - CELL / 2, CELL, CELL)
      .stroke({width: 2, color});
  }

  public destroy(): void {
    this.stage.off('pointermove', this.onMove);
    this.stage.off('pointerdown', this.onDown);
    this.stage.off('pointerleave', this.onLeave);
  }

  private readonly onMove = (event: FederatedPointerEvent) => {
    this.cell = cellAt(event.global);
  };

  private readonly onDown = (event: FederatedPointerEvent) => {
    this.onMove(event);

    // The click that takes control from the autopilot only focuses the game
    const {cell, game} = this;
    if (!this.isEnabled || cell === undefined || game === undefined) return;

    if (game.towerAt(cell) !== undefined) {
      game.upgrade(cell);
    } else {
      game.build(this.kind, cell);
    }
  };

  private readonly onLeave = () => {
    this.cell = undefined;
  };
}

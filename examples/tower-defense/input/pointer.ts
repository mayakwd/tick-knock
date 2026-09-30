import {Container, FederatedPointerEvent, Graphics} from 'pixi.js';
import {CELL} from '../config';
import {TowerDefenseGame} from '../game';
import {Cell, cellCenter} from '../map';
import {TowerKind, TOWERS} from '../towers';

/**
 * Builds a tower where the player clicks an empty cell, and upgrades a tower the player clicks.
 * The preview shows the cell and the range the tower would have.
 */
export class TowerPlacement {
  public kind: TowerKind = 'arrow';
  private readonly preview = new Graphics();
  private cell?: Cell;

  /**
   * @param stage Stage that receives pointer events
   * @param game The current game, it changes when the game restarts
   * @param isPlaying Returns a value indicating whether the player controls the game
   */
  public constructor(
    private readonly stage: Container,
    private readonly game: () => TowerDefenseGame,
    private readonly isPlaying: () => boolean,
  ) {
    stage.eventMode = 'static';
    stage.on('pointermove', this.onMove);
    stage.on('pointerdown', this.onDown);
    stage.on('pointerleave', this.onLeave);
    stage.addChild(this.preview);
  }

  /**
   * Describes what a click does in the cell under the pointer, or returns undefined if the pointer is out of the map
   */
  public get action(): string | undefined {
    if (this.cell === undefined) return undefined;
    const game = this.game();
    const tower = game.towerAt(this.cell);
    if (tower === undefined) return `Build ${TOWERS[this.kind].name}: ${TOWERS[this.kind].levels[0].cost}`;
    const cost = game.upgradeCost(this.cell);
    const name = `${TOWERS[tower.kind].name} ${tower.level + 1}`;
    return cost === undefined ? `${name}: the last level` : `Upgrade ${name}: ${cost}`;
  }

  /**
   * Redraws the preview, the possibility to build or upgrade changes every frame together with gold
   */
  public update(): void {
    this.preview.clear();
    if (this.cell === undefined) return;
    const game = this.game();
    const {x, y} = cellCenter(this.cell);
    const tower = game.towerAt(this.cell);
    const cost = game.upgradeCost(this.cell);
    // A tower shows the range of its next level, an empty cell shows the range of the selected tower
    const range = tower !== undefined
      ? TOWERS[tower.kind].levels[Math.min(tower.level + 1, TOWERS[tower.kind].levels.length - 1)].range
      : TOWERS[this.kind].levels[0].range;
    const allowed = tower !== undefined
      ? cost !== undefined && game.economy.gold >= cost && !game.isOver
      : game.canBuild(this.kind, this.cell);
    const color = allowed ? 0x3fb950 : 0xf85149;
    this.preview
      .circle(x, y, range)
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
    this.cell = {column: Math.floor(event.global.x / CELL), row: Math.floor(event.global.y / CELL)};
  };

  private readonly onDown = (event: FederatedPointerEvent) => {
    this.onMove(event);
    // The click that takes control from the autopilot only focuses the game
    if (!this.isPlaying() || this.cell === undefined) return;
    const game = this.game();
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

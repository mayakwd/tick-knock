import {Container, FederatedPointerEvent, Graphics} from 'pixi.js';
import {CELL} from '../config';
import {TowerDefenseGame} from '../game';
import {Cell, cellCenter} from '../map';
import {TowerKind, TOWERS} from '../towers';

/**
 * Builds towers where the player clicks, and shows where the selected tower would be built and its range
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
   * Redraws the preview, the possibility to build changes every frame together with gold
   */
  public update(): void {
    this.preview.clear();
    if (this.cell === undefined) return;
    const {x, y} = cellCenter(this.cell);
    const allowed = this.game().canBuild(this.kind, this.cell);
    const color = allowed ? 0x3fb950 : 0xf85149;
    this.preview
      .circle(x, y, TOWERS[this.kind].range)
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
    if (!this.isPlaying()) return;
    if (this.cell !== undefined) this.game().build(this.kind, this.cell);
  };

  private readonly onLeave = () => {
    this.cell = undefined;
  };
}

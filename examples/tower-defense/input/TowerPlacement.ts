import {FederatedPointerEvent, Graphics} from 'pixi.js';
import {Cell} from '../../shared/components/Cell';
import {DemoStage} from '../../shared/demo/GamePage';
import {CELL} from '../config';
import {Construction} from '../Construction';
import {cellAt, cellCenter} from '../data/map';
import {TOWER_KINDS, TowerKind, TowerLevel, TOWERS} from '../data/towers';
import {BuildOrder, TowerDefenseControls, UpgradeOrder} from '../TowerDefenseControls';

/**
 * Keys that select kinds of towers: 1 selects the first kind, 2 the second one, and so on
 */
export const TOWER_KEYS = TOWER_KINDS.map((kind, index) => `Digit${index + 1}`);

const ALLOWED_COLOR = 0x3fb950;
const FORBIDDEN_COLOR = 0xf85149;

/**
 * Input of the player: keys select a kind of towers, a click on an empty cell orders to build it, and a click on
 * a tower orders to upgrade it. The preview shows the cell and the range the tower would have.
 *
 * It only writes orders into the controls, and asks the rules of the game what's possible, so the rules are in one
 * place.
 */
export class TowerPlacement {
  /**
   * Kind of towers the player builds
   */
  private kind: TowerKind = 'arrow';
  private readonly preview = new Graphics();
  /**
   * The cell under the pointer
   */
  private cell: Cell | undefined = undefined;
  /**
   * The cell the player has clicked since the last frame
   */
  private clicked: Cell | undefined = undefined;

  public constructor(private readonly controls: TowerDefenseControls) {}

  public attach({app: {stage, screen}, keyboard, overlay}: DemoStage): void {
    stage.eventMode = 'static';
    stage.hitArea = screen;
    stage.on('pointermove', this.onMove);
    stage.on('pointerdown', this.onDown);
    stage.on('pointerleave', this.onLeave);
    overlay.addChild(this.preview);

    TOWER_KINDS.forEach((kind, index) => keyboard.onPress(TOWER_KEYS[index], () => {
      this.kind = kind;
    }));
  }

  /**
   * Turns the click into an order: a click on a tower upgrades it, a click on an empty cell builds the selected tower
   */
  public readInput(construction: Construction): void {
    const {clicked} = this;
    if (clicked === undefined) return;

    this.clicked = undefined;
    this.controls.order = construction.towerAt(clicked) !== undefined
      ? new UpgradeOrder(clicked)
      : new BuildOrder(this.kind, clicked);
  }

  /**
   * Redraws the preview: the possibility to build or upgrade changes every frame together with gold
   */
  public drawPreview(construction: Construction): void {
    this.preview.clear();
    const {cell} = this;
    if (cell === undefined) return;

    // A tower shows the range of its next level, an empty cell shows the range of the selected tower
    const tower = construction.towerAt(cell);
    const upgrade = construction.upgradeAt(cell);
    const level: TowerLevel = tower === undefined
      ? TOWERS[this.kind].levels[0]
      : upgrade?.level ?? TOWERS[tower.tower.kind].levels[tower.tower.level];
    const isAllowed = tower === undefined
      ? construction.canBuild(this.kind, cell)
      : upgrade !== undefined && construction.canAfford(upgrade);
    const color = isAllowed ? ALLOWED_COLOR : FORBIDDEN_COLOR;

    const {x, y} = cellCenter(cell);
    this.preview
      .circle(x, y, level.range)
      .fill({color, alpha: 0.08})
      .stroke({width: 1, color, alpha: 0.5})
      .rect(x - CELL / 2, y - CELL / 2, CELL, CELL)
      .stroke({width: 2, color});
  }

  /**
   * Describes what a click does in the cell under the pointer, or the selected tower if the pointer is out of the map
   */
  public describe(construction: Construction): string {
    const {cell, kind} = this;
    if (cell === undefined) return `Tower: ${TOWERS[kind].name}`;

    const tower = construction.towerAt(cell);
    if (tower === undefined) return `Build ${TOWERS[kind].name}: ${TOWERS[kind].levels[0].cost}`;

    const upgrade = construction.upgradeAt(cell);
    const name = `${TOWERS[tower.tower.kind].name} ${tower.tower.level + 1}`;
    return upgrade === undefined ? `${name}: the last level` : `Upgrade ${name}: ${upgrade.level.cost}`;
  }

  private readonly onMove = (event: FederatedPointerEvent): void => {
    this.cell = cellAt(event.global);
  };

  private readonly onDown = (event: FederatedPointerEvent): void => {
    this.cell = cellAt(event.global);

    // The click that takes control from the autopilot only focuses the game
    if (this.controls.pilot === 'player') this.clicked = this.cell;
  };

  private readonly onLeave = (): void => {
    this.cell = undefined;
  };
}

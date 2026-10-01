import {Cell} from '../shared/components/Cell';
import {GridIndex} from '../shared/indexes/GridIndex';
import {Tower} from './components';
import {isBuildable} from './data/map';
import {TowerKind, TowerLevel, TOWERS} from './data/towers';
import {TowerEntry} from './indexes/TowerEntry';
import {TowerDefenseState} from './TowerDefenseState';

/**
 * The next level of a tower
 */
export class Upgrade {
  public constructor(
    public readonly tower: TowerEntry,
    /**
     * The `Tower` the tower gets
     */
    public readonly next: Tower,
    public readonly level: TowerLevel,
  ) {}
}

/**
 * Rules of building and upgrading towers. They only read the state and the index of towers: `ConstructionSystem`
 * follows them when it carries out orders, and the page shows them in the preview, so the rules are in one place.
 */
export class Construction {
  public constructor(private readonly state: TowerDefenseState, private readonly towers: GridIndex<TowerEntry>) {}

  /**
   * Gets the tower built in the cell, a cell has one tower at most
   */
  public towerAt(cell: Cell): TowerEntry | undefined {
    return this.towers.first(cell);
  }

  /**
   * Returns a value indicating whether a tower of the kind can be built in the cell right now
   */
  public canBuild(kind: TowerKind, cell: Cell): boolean {
    return isBuildable(cell) && this.towerAt(cell) === undefined && this.state.gold >= TOWERS[kind].levels[0].cost;
  }

  /**
   * Gets the next level of the tower in the cell, or undefined if there is no tower, or it has the last level
   */
  public upgradeAt(cell: Cell): Upgrade | undefined {
    const entry = this.towerAt(cell);
    if (entry === undefined) return undefined;

    const {kind, level} = entry.tower;
    const next = TOWERS[kind].levels.at(level + 1);
    return next === undefined ? undefined : new Upgrade(entry, new Tower(kind, level + 1), next);
  }

  public canAfford(upgrade: Upgrade): boolean {
    return this.state.gold >= upgrade.level.cost;
  }
}

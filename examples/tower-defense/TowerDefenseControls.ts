import {Cell} from '../shared/components/Cell';
import {Controls} from '../shared/ecs/Controls';
import {TowerKind} from './data/towers';

/**
 * Build a tower of the first level in an empty cell
 */
export class BuildOrder {
  public readonly kind = 'build';

  public constructor(public readonly tower: TowerKind, public readonly cell: Cell) {}
}

/**
 * Upgrade the tower in the cell to its next level
 */
export class UpgradeOrder {
  public readonly kind = 'upgrade';

  public constructor(public readonly cell: Cell) {}
}

export type Order = BuildOrder | UpgradeOrder;

/**
 * Intents of the player in the tower defense
 */
export class TowerDefenseControls extends Controls {
  /**
   * What the player or the autopilot wants to build. `ConstructionSystem` carries it out in the next update, if the
   * rules allow it, and clears it.
   */
  public order: Order | undefined = undefined;
}

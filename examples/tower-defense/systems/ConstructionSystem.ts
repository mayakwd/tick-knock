import {System} from 'tick-knock';
import {Construction} from '../Construction';
import {TOWERS} from '../data/towers';
import {createTower} from '../entities';
import {BuildOrder, TowerDefenseControls, UpgradeOrder} from '../TowerDefenseControls';
import {TowerDefenseState} from '../TowerDefenseState';

/**
 * Carries out the order of the player or the autopilot, if the rules allow it. An order that isn't allowed, for example
 * when there is not enough gold, is dropped: the player clicks again.
 */
export class ConstructionSystem extends System {
  public constructor(
    private readonly controls: TowerDefenseControls,
    private readonly state: TowerDefenseState,
    private readonly construction: Construction,
  ) {
    super();
  }

  public update(): void {
    // Nothing is ordered
    const {order} = this.controls;
    if (order === undefined) return;

    this.controls.order = undefined;
    switch (order.kind) {
      case 'build':
        return this.build(order);
      case 'upgrade':
        return this.upgrade(order);
    }
  }

  private build({tower, cell}: BuildOrder): void {
    if (!this.construction.canBuild(tower, cell)) return;

    this.state.gold -= TOWERS[tower].levels[0].cost;
    this.engine.addEntity(createTower(tower, cell));
  }

  // An upgrade replaces the Tower component, and TowerLevelSystem equips the tower for the new level
  private upgrade({cell}: UpgradeOrder): void {
    const upgrade = this.construction.upgradeAt(cell);
    if (upgrade === undefined || !this.construction.canAfford(upgrade)) return;

    this.state.gold -= upgrade.level.cost;
    upgrade.tower.entity.add(upgrade.next);
  }
}

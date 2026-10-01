import {System} from 'tick-knock';
import {Construction} from '../Construction';
import {PLAN} from '../data/plan';
import {Order, TowerDefenseControls} from '../TowerDefenseControls';

/**
 * Plays instead of the player in the demo and in tests: orders towers and upgrades by the plan, as soon as there is
 * enough gold. It only writes orders, and `ConstructionSystem` carries them out, the same way as orders of the player.
 */
export class AutopilotSystem extends System {
  /**
   * Index of the next step of the plan
   */
  private next = 0;

  public constructor(private readonly controls: TowerDefenseControls, private readonly construction: Construction) {
    super();
  }

  public update(): void {
    // The player plays, or the previous order hasn't been carried out yet, or the plan is done
    const {controls} = this;
    if (controls.pilot !== 'autopilot' || controls.order !== undefined || this.next === PLAN.length) return;

    // The next step waits for gold
    const order = PLAN[this.next];
    if (!this.isPossible(order)) return;

    controls.order = order;
    this.next++;
  }

  private isPossible(order: Order): boolean {
    switch (order.kind) {
      case 'build':
        return this.construction.canBuild(order.tower, order.cell);
      case 'upgrade': {
        const upgrade = this.construction.upgradeAt(order.cell);
        return upgrade !== undefined && this.construction.canAfford(upgrade);
      }
    }
  }
}

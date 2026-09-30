import {Cell} from '../../shared/components/Cell';
import {BuildOrder, Order, UpgradeOrder} from '../TowerDefenseControls';

/**
 * Towers the autopilot builds and upgrades, in order, as soon as it has enough gold
 */
export const PLAN: ReadonlyArray<Order> = [
  new BuildOrder('arrow', new Cell(5, 4)),
  new BuildOrder('arrow', new Cell(3, 8)),
  new BuildOrder('frost', new Cell(5, 7)),
  new UpgradeOrder(new Cell(5, 4)),
  new BuildOrder('cannon', new Cell(8, 8)),
  new BuildOrder('poison', new Cell(10, 6)),
  new UpgradeOrder(new Cell(3, 8)),
  new BuildOrder('arrow', new Cell(8, 4)),
  new UpgradeOrder(new Cell(8, 8)),
  new BuildOrder('cannon', new Cell(12, 6)),
  new UpgradeOrder(new Cell(5, 7)),
  new BuildOrder('frost', new Cell(14, 8)),
  new UpgradeOrder(new Cell(10, 6)),
  new UpgradeOrder(new Cell(5, 4)),
  new BuildOrder('arrow', new Cell(12, 9)),
  new UpgradeOrder(new Cell(12, 6)),
  new BuildOrder('poison', new Cell(5, 10)),
  new UpgradeOrder(new Cell(8, 8)),
  new BuildOrder('cannon', new Cell(10, 10)),
  new UpgradeOrder(new Cell(5, 7)),
  new UpgradeOrder(new Cell(10, 6)),
  new BuildOrder('arrow', new Cell(14, 4)),
  new UpgradeOrder(new Cell(12, 6)),
  new UpgradeOrder(new Cell(10, 10)),
];

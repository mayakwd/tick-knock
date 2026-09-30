import {Autopilot} from '../../shared/Demo';
import {Cell} from '../components';
import {TowerDefenseGame} from '../game';
import {TowerKind} from '../towers';

type Step = ['build', TowerKind, Cell] | ['upgrade', Cell];

/**
 * Towers the autopilot builds and upgrades, in order, as soon as it has enough gold
 */
const PLAN: ReadonlyArray<Step> = [
  ['build', 'arrow', {column: 5, row: 4}],
  ['build', 'arrow', {column: 3, row: 8}],
  ['build', 'frost', {column: 5, row: 7}],
  ['upgrade', {column: 5, row: 4}],
  ['build', 'cannon', {column: 8, row: 8}],
  ['build', 'poison', {column: 10, row: 6}],
  ['upgrade', {column: 3, row: 8}],
  ['build', 'arrow', {column: 8, row: 4}],
  ['upgrade', {column: 8, row: 8}],
  ['build', 'cannon', {column: 12, row: 6}],
  ['upgrade', {column: 5, row: 7}],
  ['build', 'frost', {column: 14, row: 8}],
  ['upgrade', {column: 10, row: 6}],
  ['upgrade', {column: 5, row: 4}],
  ['build', 'arrow', {column: 12, row: 9}],
  ['upgrade', {column: 12, row: 6}],
  ['build', 'poison', {column: 5, row: 10}],
  ['upgrade', {column: 8, row: 8}],
  ['build', 'cannon', {column: 10, row: 10}],
  ['upgrade', {column: 5, row: 7}],
  ['upgrade', {column: 10, row: 6}],
  ['build', 'arrow', {column: 14, row: 4}],
  ['upgrade', {column: 12, row: 6}],
  ['upgrade', {column: 10, row: 10}],
];

/**
 * Autopilot for the demo mode and tests: it builds and upgrades towers by the plan, as soon as it has enough gold
 */
export class TowerDefenseAutopilot implements Autopilot {
  private next = 0;

  public constructor(private readonly game: TowerDefenseGame) {}

  public update(): void {
    if (this.next >= PLAN.length) return;

    const step = PLAN[this.next];
    const done = step[0] === 'build' ? this.game.build(step[1], step[2]) : this.game.upgrade(step[1]);
    if (done) this.next++;
  }
}

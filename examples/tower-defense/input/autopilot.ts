import {Cell} from '../map';
import {TowerDefenseGame} from '../game';
import {TowerKind} from '../towers';

/**
 * Towers the autopilot builds, in order, as soon as it has enough gold
 */
const PLAN: ReadonlyArray<[TowerKind, Cell]> = [
  ['arrow', {column: 5, row: 4}],
  ['arrow', {column: 3, row: 8}],
  ['frost', {column: 5, row: 7}],
  ['cannon', {column: 8, row: 8}],
  ['poison', {column: 10, row: 6}],
  ['arrow', {column: 8, row: 4}],
  ['cannon', {column: 12, row: 6}],
  ['frost', {column: 14, row: 8}],
  ['arrow', {column: 12, row: 9}],
  ['poison', {column: 5, row: 10}],
  ['cannon', {column: 10, row: 10}],
  ['arrow', {column: 14, row: 4}],
  ['cannon', {column: 3, row: 4}],
  ['poison', {column: 12, row: 4}],
  ['arrow', {column: 8, row: 10}],
  ['cannon', {column: 14, row: 11}],
];

/**
 * Creates an autopilot for the demo mode and tests: it builds towers by the plan
 */
export function createAutopilot(game: TowerDefenseGame): () => void {
  let next = 0;
  return () => {
    if (next >= PLAN.length) return;
    const [kind, cell] = PLAN[next];
    if (game.build(kind, cell)) next++;
  };
}

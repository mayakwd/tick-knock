import {Entity} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {isWithin} from '../../shared/geometry';
import {Target} from '../components';
import {CreepEntry} from '../indexes/CreepEntry';
import {CreepIndex} from '../indexes/CreepIndex';

/**
 * Keeps the target of the tower while it's alive and in range. Otherwise gives the tower the creep in range with the
 * highest score, or takes the target away if there is no creep in range. Only creeps in cells around the tower are
 * checked.
 */
export function chooseTarget(
  tower: Entity,
  position: Position,
  range: number,
  creeps: CreepIndex,
  score: (creep: CreepEntry) => number,
): void {
  const target = tower.get(Target);
  if (target !== undefined && target.creep.isAlive && isWithin(position, target.creep.position, range)) return;

  const creep = creeps.best(position, range, score);
  if (creep !== undefined) {
    tower.add(new Target(creep));
  } else if (target !== undefined) {
    tower.remove(Target);
  }
}

import {Entity, IterativeSystem} from 'tick-knock';
import {Cell} from '../../shared/components/Cell';
import {Position} from '../../shared/components/Position';
import {DESTROYED} from '../../shared/ecs/tags';
import {moveTowards} from '../../shared/geometry';
import {PathFollower, Slow} from '../components';
import {cellAt, isSameCell, PATH} from '../data/map';
import {CREEP, ESCAPED} from '../tags';

/**
 * Moves creeps along the path. A creep that crosses into another cell gets a new `Cell`, so indexes follow it. A creep
 * that has reached the exit escapes: it's destroyed, and `EscapeSystem` takes a life for it.
 */
export class PathSystem extends IterativeSystem.of(Position, PathFollower, Cell, CREEP) {
  protected updateEntity(creep: Entity, dt: number, position: Position, follower: PathFollower, cell: Cell): void {
    // The creep moves to the next turn of the path. When the turn is reached, the rest of the step is made towards
    // the next one.
    let step = follower.speed * this.slowFactor(creep) * dt;
    while (follower.waypoint < PATH.length) {
      const left = moveTowards(position, PATH[follower.waypoint], step);
      follower.distance += step - (left ?? 0);
      if (left === undefined) break;

      follower.waypoint++;
      step = left;
    }

    // A creep crossing into another cell gets a new one, and indexes follow it
    const next = cellAt(position);
    if (!isSameCell(next, cell)) creep.add(next);

    // The creep has reached the exit
    if (follower.waypoint === PATH.length) creep.add(ESCAPED).add(DESTROYED);
  }

  /**
   * Returns the multiplier of the speed of the creep. Several slows don't stack: the strongest one is applied.
   */
  private slowFactor(creep: Entity): number {
    let factor = 1;
    creep.iterate(Slow, (slow) => {
      factor = Math.min(factor, slow.factor);
    });
    return factor;
  }
}

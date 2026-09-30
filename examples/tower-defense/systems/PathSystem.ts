import {Entity, IterativeSystem} from 'tick-knock';
import {moveTowards} from '../../shared/geometry';
import {Cell, Creep, Health, PathFollower, Position, Slow} from '../components';
import {cellAt, isSameCell, PATH} from '../map';
import {CreepEscaped} from '../messages';

/**
 * Moves creeps along the path. A creep that crosses into another cell gets a new `Cell`, so spatial indexes follow it.
 * A creep that has reached the exit escapes: it's removed, and the player loses a life.
 */
export class PathSystem extends IterativeSystem.of(Position, PathFollower, Cell, Creep) {
  protected updateEntity(entity: Entity, dt: number, position: Position, follower: PathFollower, cell: Cell): void {
    let step = follower.speed * slowFactor(entity) * dt;
    while (follower.waypoint < PATH.length) {
      const left = moveTowards(position, PATH[follower.waypoint], step);
      follower.distance += step - (left ?? 0);
      if (left === undefined) break;
      // The turn is reached, the rest of the step is made towards the next one
      follower.waypoint++;
      step = left;
    }
    const next = cellAt(position);
    if (!isSameCell(next, cell)) entity.add(next);

    if (follower.waypoint === PATH.length) {
      // The creep is removed after the update, but it leaves queries of towers, projectiles and death right now,
      // so it can't be killed after it has escaped
      entity.remove(Health);
      this.engine.removeEntity(entity);
      this.dispatch(new CreepEscaped());
    }
  }
}

/**
 * Returns the multiplier of the speed of the creep. Several slows don't stack: the strongest one is applied.
 */
function slowFactor(creep: Entity): number {
  let factor = 1;
  creep.iterate(Slow, (slow) => {
    factor = Math.min(factor, slow.factor);
  });
  return factor;
}

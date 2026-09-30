import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/DestroySystem';
import {moveTowards} from '../../shared/geometry';
import {Cell, Creep, PathFollower, Position, Slow} from '../components';
import {Economy} from '../Economy';
import {cellAt, isSameCell, PATH} from '../map';

/**
 * Moves creeps along the path. A creep that crosses into another cell gets a new `Cell`, so spatial indexes follow it.
 * A creep that has reached the exit escapes: it's destroyed, and the player loses a life.
 */
export class PathSystem extends IterativeSystem.of(Position, PathFollower, Cell, Creep) {
  public constructor(private readonly economy: Economy) {
    super();
  }

  protected updateEntity(entity: Entity, dt: number, position: Position, follower: PathFollower, cell: Cell): void {
    // The creep moves to the next turn of the path. When the turn is reached, the rest of the step is made towards
    // the next one.
    let step = follower.speed * slowFactor(entity) * dt;
    while (follower.waypoint < PATH.length) {
      const left = moveTowards(position, PATH[follower.waypoint], step);
      follower.distance += step - (left ?? 0);
      if (left === undefined) break;

      follower.waypoint++;
      step = left;
    }

    // A creep crossing into another cell gets a new one, and spatial indexes follow it
    const next = cellAt(position);
    if (!isSameCell(next, cell)) entity.add(next);

    // The creep has escaped
    if (follower.waypoint === PATH.length) {
      this.economy.lives = Math.max(0, this.economy.lives - 1);
      entity.add(DESTROYED);
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

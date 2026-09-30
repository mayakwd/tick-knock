import {Entity, IterativeSystem} from 'tick-knock';
import {Creep, Damage, Health, PathFollower, Position} from '../components';
import {cellCenter, WAYPOINTS} from '../map';
import {CreepEscaped} from '../messages';

/**
 * Moves creeps along the path. A creep that has reached the exit escapes: it's removed, and the player loses a life.
 */
export class PathSystem extends IterativeSystem.of(Position, PathFollower, Creep) {
  protected updateEntity(entity: Entity, dt: number, position: Position, follower: PathFollower): void {
    // Frost doesn't stack: the strongest one is applied
    let slow = 0;
    entity.iterate(Damage, ({type, amount}) => {
      if (type === 'frost') slow = Math.max(slow, amount);
    });

    let step = follower.speed * (1 - slow) * dt;
    while (step > 0 && follower.waypoint < WAYPOINTS.length) {
      const target = cellCenter(WAYPOINTS[follower.waypoint]);
      const dx = target.x - position.x;
      const dy = target.y - position.y;
      const distance = Math.hypot(dx, dy);
      const move = Math.min(step, distance);
      if (distance > 0) {
        position.x += (dx / distance) * move;
        position.y += (dy / distance) * move;
      }
      follower.distance += move;
      step -= move;
      if (move === distance) follower.waypoint++;
    }

    if (follower.waypoint === WAYPOINTS.length) {
      // The creep is removed after the update, but it leaves queries of towers, projectiles and death right now,
      // so it can't be killed after it has escaped
      entity.remove(Health);
      this.engine.removeEntity(entity);
      this.dispatch(new CreepEscaped());
    }
  }
}

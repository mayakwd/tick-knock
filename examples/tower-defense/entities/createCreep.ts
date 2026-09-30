import {Entity} from 'tick-knock';
import {Creep, Health, PathFollower, Position} from '../components';
import {cellCenter, WAYPOINTS} from '../map';

export function createCreep(health: number, speed: number, reward: number): Entity {
  const {x, y} = cellCenter(WAYPOINTS[0]);
  return new Entity()
    .add(new Position(x, y))
    .add(new PathFollower(speed))
    .add(new Health(health))
    .add(new Creep(reward));
}

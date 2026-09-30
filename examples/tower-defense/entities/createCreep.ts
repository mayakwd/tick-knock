import {Entity} from 'tick-knock';
import {Cell, Creep, Health, PathFollower, Position} from '../components';
import {PATH, WAYPOINTS} from '../map';
import {CreepDescription} from '../waves';

/**
 * Creates a creep at the entrance of the path, which is outside the map
 */
export function createCreep({health, speed, reward}: CreepDescription): Entity {
  const {x, y} = PATH[0];
  const {column, row} = WAYPOINTS[0];
  return new Entity()
    .add(new Position(x, y))
    .add(new Cell(column, row))
    .add(new PathFollower(speed))
    .add(new Health(health))
    .add(new Creep(reward));
}

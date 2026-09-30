import {Entity} from 'tick-knock';
import {View} from '../../shared/render/View';
import {Cell, Creep, Health, PathFollower, Position} from '../components';
import {PATH, WAYPOINTS} from '../map';
import {CreepView} from '../render/CreepView';
import {CreepViewRef} from '../render/CreepViewRef';
import {CreepDescription} from '../waves';

/**
 * Creates a creep at the entrance of the path, which is outside the map
 */
export function createCreep({health, speed, reward}: CreepDescription): Entity {
  const {x, y} = PATH[0];
  const {column, row} = WAYPOINTS[0];
  const view = new CreepView();
  return new Entity()
    .add(new Position(x, y))
    .add(new Cell(column, row))
    .add(new PathFollower(speed))
    .add(new Health(health))
    .add(new Creep(reward))
    .add(new View(view))
    .add(new CreepViewRef(view));
}

import {Entity} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {Reward} from '../../shared/components/Reward';
import {View} from '../../shared/render/View';
import {Health, PathFollower} from '../components';
import {PATH, WAYPOINTS} from '../data/map';
import {CreepStats} from '../data/waves';
import {CreepView} from '../render/CreepView';
import {HealthBar} from '../render/HealthBar';
import {CREEP} from '../tags';

/**
 * Creates a creep at the entrance of the path, which is outside the map. The cell of the entrance is immutable, so all
 * creeps share it until they cross into the next cell.
 */
export function createCreep({health, speed, reward}: CreepStats): Entity {
  const {x, y} = PATH[0];
  const view = new CreepView();
  return new Entity()
    .add(new Position(x, y))
    .add(WAYPOINTS[0])
    .add(new PathFollower(speed))
    .add(new Health(health))
    .add(new Reward(reward))
    .add(CREEP)
    .add(new View(view))
    .add(new HealthBar(view));
}

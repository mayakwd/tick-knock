import {EntitySnapshot, ReactionSystem} from 'tick-knock';
import {Tower} from '../components';
import {equipTower} from '../entities';

/**
 * A tower gets the components and the view of its level when it's built, and every time an upgrade replaces its
 * `Tower`, so building and upgrading are the same thing for it
 */
export class TowerLevelSystem extends ReactionSystem.of(Tower) {
  protected entityAdded = ({current}: EntitySnapshot, tower: Tower): void => {
    equipTower(current, tower);
  };
}

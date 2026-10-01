import {CreepEntry} from '../indexes/CreepEntry';
import {CreepIndex} from '../indexes/CreepIndex';
import {TARGET_FIRST} from '../tags';
import {TargetingSystem} from './TargetingSystem';

/**
 * Towers with the `TARGET_FIRST` tag choose the creep in range, that is the closest to the exit
 */
export class TargetFirstSystem extends TargetingSystem {
  public constructor(creeps: CreepIndex) {
    super(TARGET_FIRST, creeps);
  }

  protected score({follower}: CreepEntry): number {
    return follower.distance;
  }
}

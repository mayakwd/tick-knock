import {CreepEntry} from '../indexes/CreepEntry';
import {CreepIndex} from '../indexes/CreepIndex';
import {TARGET_STRONGEST} from '../tags';
import {TargetingSystem} from './TargetingSystem';

/**
 * Towers with the `TARGET_STRONGEST` tag choose the creep in range, that has the most health
 */
export class TargetStrongestSystem extends TargetingSystem {
  public constructor(creeps: CreepIndex) {
    super(TARGET_STRONGEST, creeps);
  }

  protected score({health}: CreepEntry): number {
    return health.value;
  }
}

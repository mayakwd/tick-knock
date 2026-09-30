import {Entity, IterativeSystem} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {Weapon} from '../components';
import {CreepIndex} from '../indexes/CreepIndex';
import {TARGET_FIRST} from '../tags';
import {chooseTarget} from './chooseTarget';

/**
 * Towers with the `TARGET_FIRST` tag choose the creep in range, that is the closest to the exit
 */
export class TargetFirstSystem extends IterativeSystem.of(Position, Weapon, TARGET_FIRST) {
  public constructor(private readonly creeps: CreepIndex) {
    super();
  }

  protected updateEntity(tower: Entity, dt: number, position: Position, {range}: Weapon): void {
    chooseTarget(tower, position, range, this.creeps, (creep) => creep.follower.distance);
  }
}

import {Entity, IterativeSystem} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {Weapon} from '../components';
import {CreepIndex} from '../indexes/CreepIndex';
import {TARGET_STRONGEST} from '../tags';
import {chooseTarget} from './chooseTarget';

/**
 * Towers with the `TARGET_STRONGEST` tag choose the creep in range, that has the most health
 */
export class TargetStrongestSystem extends IterativeSystem.of(Position, Weapon, TARGET_STRONGEST) {
  public constructor(private readonly creeps: CreepIndex) {
    super();
  }

  protected updateEntity(tower: Entity, dt: number, position: Position, {range}: Weapon): void {
    chooseTarget(tower, position, range, this.creeps, (creep) => creep.health.value);
  }
}

import {Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {isWithin} from '../../shared/geometry';
import {Target, Weapon} from '../components';
import {CreepEntry} from '../indexes/CreepEntry';
import {CreepIndex} from '../indexes/CreepIndex';
import {Targeting} from '../tags';

/**
 * Chooses targets of towers with the rule of targeting. A tower keeps its target while it's alive and in range,
 * otherwise it gets the creep in range with the highest score, or loses the target if there is no creep in range.
 * Only creeps in cells around the tower are checked.
 *
 * Every rule is a subclass, that tells the tag of its towers and how a creep is scored.
 */
export abstract class TargetingSystem extends IterativeSystem<[Position, Weapon]> {
  protected constructor(rule: Targeting, private readonly creeps: CreepIndex) {
    super(new QueryBuilder().with(Position, Weapon, rule));
  }

  /**
   * The higher the score of a creep is, the more the tower wants to fire at it
   */
  protected abstract score(creep: CreepEntry): number;

  protected updateEntity(tower: Entity, dt: number, position: Position, {range}: Weapon): void {
    // The tower keeps its target, while it can fire at it
    const target = tower.get(Target);
    if (target !== undefined && target.creep.isAlive && isWithin(position, target.creep.position, range)) return;

    // Otherwise it takes the best creep in range, or stays without a target
    const creep = this.creeps.best(position, range, (entry) => this.score(entry));
    if (creep !== undefined) {
      tower.add(new Target(creep));
    } else if (target !== undefined) {
      tower.remove(Target);
    }
  }
}

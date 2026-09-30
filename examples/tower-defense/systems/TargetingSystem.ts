import {Entity, IterativeSystem} from 'tick-knock';
import {isWithin} from '../../shared/geometry';
import {Health, PathFollower, Position, Target, Weapon} from '../components';
import {SpatialIndex} from '../SpatialIndex';
import {TARGET_FIRST, TARGET_STRONGEST} from '../tags';

/**
 * Towers with the `TARGET_FIRST` tag choose the creep in range, that is the closest to the exit
 */
export class TargetFirstSystem extends IterativeSystem.of(Position, Weapon, Target, TARGET_FIRST) {
  public constructor(private readonly creeps: SpatialIndex) {
    super();
  }

  protected updateEntity(tower: Entity, dt: number, position: Position, {range}: Weapon, target: Target): void {
    chooseTarget(this.creeps, position, range, target, (creep) => creep.get(PathFollower)!.distance);
  }
}

/**
 * Towers with the `TARGET_STRONGEST` tag choose the creep in range, that has the most health
 */
export class TargetStrongestSystem extends IterativeSystem.of(Position, Weapon, Target, TARGET_STRONGEST) {
  public constructor(private readonly creeps: SpatialIndex) {
    super();
  }

  protected updateEntity(tower: Entity, dt: number, position: Position, {range}: Weapon, target: Target): void {
    chooseTarget(this.creeps, position, range, target, (creep) => creep.get(Health)!.value);
  }
}

/**
 * Keeps the target while it's alive and in range. Otherwise chooses the creep in range with the highest score, only
 * creeps in cells around the tower are checked.
 */
function chooseTarget(
  creeps: SpatialIndex,
  position: Position,
  range: number,
  target: Target,
  score: (creep: Entity) => number,
): void {
  const {entity} = target;
  if (entity !== undefined && creeps.has(entity) && isWithin(position, entity.get(Position)!, range)) return;

  let best: Entity | undefined;
  let bestScore = -Infinity;
  creeps.forEachWithin(position, range, (creep) => {
    const value = score(creep);
    if (value <= bestScore) return;

    best = creep;
    bestScore = value;
  });
  target.entity = best;
}

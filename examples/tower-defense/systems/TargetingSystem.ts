import {Entity, IterativeSystem, QueryBuilder, Tag} from 'tick-knock';
import {isWithin} from '../../shared/geometry';
import {Position, Target, Weapon} from '../components';
import {SpatialIndex} from '../SpatialIndex';

/**
 * Score of a creep as a target, the creep with the highest score is chosen
 */
export type TargetScore = (creep: Entity) => number;

/**
 * Chooses targets of towers with the rule. A tower keeps its target while it's alive and in range, and looks for
 * a new one in the spatial index of creeps only when the target is lost.
 *
 * Every rule is a tag of towers, and has its own targeting system.
 */
export class TargetingSystem extends IterativeSystem<[Position, Weapon, Target]> {
  /**
   * @param rule Tag of towers, that choose targets with this system
   * @param creeps Spatial index of creeps, that can be targeted
   * @param score Score of a creep as a target
   */
  public constructor(rule: Tag, private readonly creeps: SpatialIndex, private readonly score: TargetScore) {
    super(new QueryBuilder().contains(Position, Weapon, Target, rule) as QueryBuilder<[Position, Weapon, Target]>);
  }

  protected updateEntity(tower: Entity, dt: number, position: Position, {range}: Weapon, target: Target): void {
    if (this.keepsTarget(target, position, range)) return;

    // Only creeps in cells around the tower are checked
    let best: Entity | undefined;
    let bestScore = -Infinity;
    this.creeps.forEachWithin(position, range, (creep) => {
      const score = this.score(creep);
      if (score <= bestScore) return;

      best = creep;
      bestScore = score;
    });
    target.entity = best;
  }

  /**
   * Returns a value indicating whether the target is still alive and in range
   */
  private keepsTarget({entity}: Target, position: Position, range: number): boolean {
    return entity !== undefined && this.creeps.has(entity) && isWithin(position, entity.get(Position)!, range);
  }
}

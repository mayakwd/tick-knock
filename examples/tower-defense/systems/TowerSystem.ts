import {Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Creep, Health, PathFollower, Position, Tower} from '../components';
import {createProjectile} from '../entities';
import {TOWERS} from '../towers';

/**
 * Towers fire at the creep in range, that is the closest to the exit
 */
export class TowerSystem extends IterativeSystem.of(Position, Tower) {
  private readonly creeps = new QueryBuilder().contains(Position, PathFollower, Health, Creep).build();

  public onAddedToEngine(): void {
    super.onAddedToEngine();
    this.engine.addQuery(this.creeps);
  }

  public onRemovedFromEngine(): void {
    super.onRemovedFromEngine();
    this.engine.removeQuery(this.creeps);
  }

  protected updateEntity(entity: Entity, dt: number, position: Position, tower: Tower): void {
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    if (tower.cooldown > 0) return;

    const {range, interval} = TOWERS[tower.kind];
    let target: Entity | undefined;
    let furthest = -1;
    this.creeps.forEach((creep, creepPosition, follower, health) => {
      if (health.value <= 0 || follower.distance <= furthest) return;
      if ((creepPosition.x - position.x) ** 2 + (creepPosition.y - position.y) ** 2 > range * range) return;
      target = creep;
      furthest = follower.distance;
    });
    if (target === undefined) return;

    tower.cooldown = interval;
    this.engine.addEntity(createProjectile(tower.kind, position.x, position.y, target));
  }
}

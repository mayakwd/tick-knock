import {Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Creep, Health, Poison, Position, Projectile, Slow} from '../components';
import {TowerDescription, TOWERS} from '../towers';

/**
 * Moves projectiles to their targets and applies their effects on hit
 */
export class ProjectileSystem extends IterativeSystem.of(Position, Projectile) {
  private readonly creeps = new QueryBuilder().contains(Position, Health, Creep).build();

  public onAddedToEngine(): void {
    super.onAddedToEngine();
    this.engine.addQuery(this.creeps);
  }

  public onRemovedFromEngine(): void {
    super.onRemovedFromEngine();
    this.engine.removeQuery(this.creeps);
  }

  protected updateEntity(entity: Entity, dt: number, position: Position, {kind, target}: Projectile): void {
    // The target has died or escaped, and the projectile has nothing to fly to
    if (!this.creeps.has(target)) {
      this.engine.removeEntity(entity);
      return;
    }
    const tower = TOWERS[kind];
    const targetPosition = target.get(Position)!;
    const dx = targetPosition.x - position.x;
    const dy = targetPosition.y - position.y;
    const distance = Math.hypot(dx, dy);
    const step = tower.projectileSpeed * dt;
    if (step < distance) {
      position.x += (dx / distance) * step;
      position.y += (dy / distance) * step;
      return;
    }

    this.engine.removeEntity(entity);
    if (tower.splash === undefined) {
      this.hit(target, tower);
      return;
    }
    const splash = tower.splash;
    this.creeps.forEach((creep, creepPosition) => {
      if ((creepPosition.x - targetPosition.x) ** 2 + (creepPosition.y - targetPosition.y) ** 2 <= splash * splash) {
        this.hit(creep, tower);
      }
    });
  }

  private hit(creep: Entity, {damage, slow, poison}: TowerDescription): void {
    creep.get(Health)!.value -= damage;
    // Effects are linked components: a creep can have several of them at the same time
    if (slow !== undefined) creep.append(new Slow(slow.factor, slow.seconds));
    if (poison !== undefined) creep.append(new Poison(poison.damagePerSecond, poison.seconds));
  }
}

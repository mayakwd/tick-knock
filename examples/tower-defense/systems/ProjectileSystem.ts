import {Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Creep, Health, Poison, PoisonOnHit, Position, Projectile, Slow, SlowOnHit, Splash} from '../components';

/**
 * Moves projectiles to their targets and applies their effects on hit. Effects are components of the projectile:
 * the system checks which of them the projectile has, and doesn't know anything about kinds of towers.
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

  protected updateEntity(projectile: Entity, dt: number, position: Position, {target, speed}: Projectile): void {
    // The target has died or escaped, and the projectile has nothing to fly to
    if (!this.creeps.has(target)) {
      this.engine.removeEntity(projectile);
      return;
    }
    const targetPosition = target.get(Position)!;
    const dx = targetPosition.x - position.x;
    const dy = targetPosition.y - position.y;
    const distance = Math.hypot(dx, dy);
    const step = speed * dt;
    if (step < distance) {
      position.x += (dx / distance) * step;
      position.y += (dy / distance) * step;
      return;
    }

    this.engine.removeEntity(projectile);
    const splash = projectile.get(Splash);
    if (splash === undefined) {
      this.hit(target, projectile);
      return;
    }
    const radius = splash.radius;
    this.creeps.forEach((creep, creepPosition) => {
      if ((creepPosition.x - targetPosition.x) ** 2 + (creepPosition.y - targetPosition.y) ** 2 <= radius * radius) {
        this.hit(creep, projectile);
      }
    });
  }

  private hit(creep: Entity, projectile: Entity): void {
    creep.get(Health)!.value -= projectile.get(Projectile)!.damage;
    // Effects are linked components: a creep can have several of them at the same time
    const slow = projectile.get(SlowOnHit);
    const poison = projectile.get(PoisonOnHit);
    if (slow !== undefined) creep.append(new Slow(slow.factor, slow.seconds));
    if (poison !== undefined) creep.append(new Poison(poison.damagePerSecond, poison.seconds));
  }
}

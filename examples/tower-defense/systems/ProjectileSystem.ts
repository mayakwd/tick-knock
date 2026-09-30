import {Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Creep, Damage, Health, Position, Projectile} from '../components';

/**
 * Moves projectiles to their targets and passes their damage to hit creeps. The system doesn't know what the damage
 * does, and doesn't know anything about kinds of towers.
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
    // Damage is a linked component: a creep can suffer several kinds of damage at the same time
    projectile.iterate(Damage, (damage) => {
      if (damage.splash === 0) {
        target.append(new Damage(damage));
        return;
      }
      const radius = damage.splash;
      this.creeps.forEach((creep, creepPosition) => {
        if ((creepPosition.x - targetPosition.x) ** 2 + (creepPosition.y - targetPosition.y) ** 2 <= radius * radius) {
          creep.append(new Damage(damage));
        }
      });
    });
  }
}

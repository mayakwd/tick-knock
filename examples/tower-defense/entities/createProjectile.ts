import {Entity} from 'tick-knock';
import {PoisonOnHit, Position, Projectile, SlowOnHit, Splash, Tower, Weapon} from '../components';

/**
 * Creates a projectile fired by the tower. Effects of the tower are copied to the projectile, so it hits the target
 * with the characteristics the tower had at the moment of the shot.
 */
export function createProjectile(tower: Entity, target: Entity): Entity {
  const {x, y} = tower.get(Position)!;
  const {damage, projectileSpeed} = tower.get(Weapon)!;
  const projectile = new Entity()
    .add(new Position(x, y))
    .add(new Projectile(target, projectileSpeed, damage, tower.get(Tower)!.kind));
  const splash = tower.get(Splash);
  const slow = tower.get(SlowOnHit);
  const poison = tower.get(PoisonOnHit);
  if (splash !== undefined) projectile.add(new Splash(splash.radius));
  if (slow !== undefined) projectile.add(new SlowOnHit(slow.factor, slow.seconds));
  if (poison !== undefined) projectile.add(new PoisonOnHit(poison.damagePerSecond, poison.seconds));
  return projectile;
}

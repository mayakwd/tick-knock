import {Entity} from 'tick-knock';
import {Damage, Position, Projectile, Tower, Weapon} from '../components';

/**
 * Creates a projectile fired by the tower. The damage of the tower is copied to the projectile, so it hits the target
 * with the damage the tower had at the moment of the shot.
 */
export function createProjectile(tower: Entity, target: Entity): Entity {
  const {x, y} = tower.get(Position)!;
  const projectile = new Entity()
    .add(new Position(x, y))
    .add(new Projectile(target, tower.get(Weapon)!.projectileSpeed, tower.get(Tower)!.kind));
  tower.iterate(Damage, (damage) => projectile.append(new Damage(damage)));
  return projectile;
}

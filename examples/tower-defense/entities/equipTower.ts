import {Entity} from 'tick-knock';
import {Damage, Tower, Weapon} from '../components';
import {Cell} from '../map';
import {TowerKind, TOWERS} from '../towers';

/**
 * Turns a level of the tower kind into components of the tower. It's used both to build and to upgrade a tower:
 * the level replaces the weapon and all damage of the tower, so the tower becomes exactly what the level describes.
 */
export function equipTower(entity: Entity, kind: TowerKind, cell: Cell, level: number): Entity {
  const {range, interval, projectileSpeed, damage} = TOWERS[kind].levels[level];
  entity
    .add(new Tower(kind, cell, level))
    .add(new Weapon(range, interval, projectileSpeed));
  entity.remove(Damage);
  for (const description of damage) entity.append(new Damage(description));
  return entity;
}

import {Entity} from 'tick-knock';
import {PoisonOnHit, SlowOnHit, Splash, Tower, Weapon} from '../components';
import {Cell} from '../map';
import {TowerKind, TOWERS} from '../towers';

/**
 * Turns a level of the tower kind into components of the tower. It's used both to build and to upgrade a tower:
 * the level replaces the weapon, and effects the level doesn't have are removed, so the tower becomes exactly
 * what the level describes.
 */
export function equipTower(entity: Entity, kind: TowerKind, cell: Cell, level: number): Entity {
  const {range, interval, damage, projectileSpeed, splash, slow, poison} = TOWERS[kind].levels[level];
  entity
    .add(new Tower(kind, cell, level))
    .add(new Weapon(range, interval, damage, projectileSpeed));
  setOptional(entity, Splash, splash !== undefined ? new Splash(splash) : undefined);
  setOptional(entity, SlowOnHit, slow !== undefined ? new SlowOnHit(slow.factor, slow.seconds) : undefined);
  setOptional(entity, PoisonOnHit, poison !== undefined ? new PoisonOnHit(poison.damagePerSecond, poison.seconds) : undefined);
  return entity;
}

function setOptional<T extends object>(entity: Entity, componentClass: new (...args: any[]) => T, component: T | undefined): void {
  if (component !== undefined) {
    entity.add(component);
  } else {
    entity.remove(componentClass);
  }
}

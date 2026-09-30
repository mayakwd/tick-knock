import {Entity} from 'tick-knock';
import {Cell} from '../../shared/components/Cell';
import {Cooldown} from '../../shared/components/Cooldown';
import {Position} from '../../shared/components/Position';
import {View} from '../../shared/render/View';
import {Payload, Tower, Weapon} from '../components';
import {cellCenter} from '../data/map';
import {TowerKind, TOWERS} from '../data/towers';
import {drawTower} from '../render/graphics';

/**
 * Creates a tower of the first level in the cell. `TowerLevelSystem` equips it for its level, when the tower appears
 * in the engine.
 */
export function createTower(kind: TowerKind, cell: Cell): Entity {
  const {x, y} = cellCenter(cell);
  return new Entity()
    .add(cell)
    .add(new Position(x, y))
    .add(new Tower(kind, 0));
}

/**
 * Gives the tower the components and the view of its level. Adding a component the tower already has replaces it,
 * so after an upgrade the tower is exactly what the new level describes. It's the only place where the table of towers
 * becomes components: from this moment the tower owns its characteristics.
 */
export function equipTower(tower: Entity, {kind, level}: Tower): void {
  const {targeting, levels} = TOWERS[kind];
  const {range, interval, projectileSpeed, payload: {damage, impact, effects}} = levels[level];
  tower
    .add(new Weapon(range, projectileSpeed))
    .add(new Cooldown(interval))
    .add(new Payload(damage, impact, effects))
    .add(new View(drawTower(kind, level)))
    .add(targeting);
}

import {Entity} from 'tick-knock';
import {Position} from '../components';
import {Cell, cellCenter} from '../map';
import {TowerKind} from '../towers';
import {equipTower} from './equipTower';

/**
 * Creates a tower of the first level
 */
export function createTower(kind: TowerKind, cell: Cell): Entity {
  const {x, y} = cellCenter(cell);
  return equipTower(new Entity().add(new Position(x, y)), kind, cell, 0);
}

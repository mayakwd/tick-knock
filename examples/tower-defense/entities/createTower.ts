import {Entity} from 'tick-knock';
import {Cell, Position, Target, Tower} from '../components';
import {cellCenter} from '../map';
import {TowerKind} from '../towers';

/**
 * Creates a tower of the first level in the cell. Characteristics of the level are added by the game, when the tower
 * appears in the engine.
 */
export function createTower(kind: TowerKind, {column, row}: Cell): Entity {
  const cell = new Cell(column, row);
  const {x, y} = cellCenter(cell);
  return new Entity()
    .add(cell)
    .add(new Position(x, y))
    .add(new Target())
    .add(new Tower(kind, 0));
}

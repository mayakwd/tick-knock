import {Entity} from 'tick-knock';
import {Position, Tower} from '../components';
import {Cell, cellCenter} from '../map';
import {TowerKind} from '../towers';

export function createTower(kind: TowerKind, cell: Cell): Entity {
  const {x, y} = cellCenter(cell);
  return new Entity().add(new Position(x, y)).add(new Tower(kind, cell));
}

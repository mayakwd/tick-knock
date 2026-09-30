import {Entity} from 'tick-knock';
import {Cell} from '../components';
import {FOOD} from '../tags';

export function createFood(x: number, y: number): Entity {
  return new Entity().add(new Cell(x, y)).add(FOOD);
}

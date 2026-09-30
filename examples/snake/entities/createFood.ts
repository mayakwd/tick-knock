import {Entity} from 'tick-knock';
import {Position} from '../components';
import {FOOD} from '../tags';

export function createFood(x: number, y: number): Entity {
  return new Entity().add(new Position(x, y)).add(FOOD);
}

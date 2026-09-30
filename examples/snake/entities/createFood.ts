import {Entity} from 'tick-knock';
import {View} from '../../shared/render/View';
import {Cell} from '../components';
import {drawFood} from '../render/graphics';
import {FOOD} from '../tags';

export function createFood(x: number, y: number): Entity {
  return new Entity()
    .add(new Cell(x, y))
    .add(new View(drawFood()))
    .add(FOOD);
}

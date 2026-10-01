import {Entity} from 'tick-knock';
import {View} from '../../shared/render/View';
import {Body, Cell, Heading} from '../components';
import {drawHead} from '../render/graphics';
import {HEAD} from '../tags';

export function createHead(x: number, y: number, length: number): Entity {
  return new Entity()
    .add(new Cell(x, y))
    .add(new Heading(1, 0))
    .add(new Body(length))
    .add(new View(drawHead()))
    .add(HEAD);
}

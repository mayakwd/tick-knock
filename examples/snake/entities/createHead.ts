import {Entity} from 'tick-knock';
import {Body, Heading, Position} from '../components';
import {HEAD} from '../tags';

export function createHead(x: number, y: number, length: number): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Heading(1, 0))
    .add(new Body(length))
    .add(HEAD);
}

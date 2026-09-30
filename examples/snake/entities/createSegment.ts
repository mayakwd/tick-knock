import {Entity} from 'tick-knock';
import {Lifetime, Position} from '../components';
import {SEGMENT} from '../tags';

/**
 * Creates a segment of the body, that disappears after the given amount of ticks
 */
export function createSegment(x: number, y: number, ticks: number): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Lifetime(ticks))
    .add(SEGMENT);
}

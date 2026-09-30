import {Entity} from 'tick-knock';
import {View} from '../../shared/render/View';
import {Cell, Lifetime} from '../components';
import {drawSegment} from '../render/graphics';
import {SEGMENT} from '../tags';

/**
 * Creates a segment of the body, that disappears after the given amount of ticks
 */
export function createSegment(x: number, y: number, ticks: number): Entity {
  return new Entity()
    .add(new Cell(x, y))
    .add(new Lifetime(ticks))
    .add(new View(drawSegment()))
    .add(SEGMENT);
}

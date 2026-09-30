import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {addViews} from '../../shared/render/addViews';
import {View} from '../../shared/render/View';
import {Cell} from '../components';
import {CELL} from '../config';
import {Priority} from '../game';
import {FOOD, HEAD, SEGMENT} from '../tags';
import {drawFood, drawHead, drawSegment} from './graphics';

/**
 * Adds rendering to the game: views are attached to entities by their tags, and follow cells of entities
 */
export function addRendering(engine: Engine, layer: Container): void {
  addViews(engine, layer, {position: Cell, priority: Priority.Render, scale: CELL});
  engine
    .reactive([HEAD], {added: ({current}) => current.add(new View(drawHead()))}, {id: 'head-view'})
    .reactive([SEGMENT], {added: ({current}) => current.add(new View(drawSegment()))}, {id: 'segment-view'})
    .reactive([FOOD], {added: ({current}) => current.add(new View(drawFood()))}, {id: 'food-view'});
}

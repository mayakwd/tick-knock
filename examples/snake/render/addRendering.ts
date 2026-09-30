import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {View} from '../../shared/render/View';
import {ViewSystem} from '../../shared/render/ViewSystem';
import {Position} from '../components';
import {Priority} from '../game';
import {FOOD, HEAD, SEGMENT} from '../tags';
import {CELL, drawFood, drawHead, drawSegment} from './graphics';

/**
 * Adds rendering to the game: views are attached to entities by their tags, and follow cells of entities
 */
export function addRendering(engine: Engine, layer: Container): void {
  engine
    .addSystem(new ViewSystem(layer), {id: 'views'})
    .reactive([HEAD], {added: ({current}) => current.add(new View(drawHead()))}, {id: 'head-view'})
    .reactive([SEGMENT], {added: ({current}) => current.add(new View(drawSegment()))}, {id: 'segment-view'})
    .reactive([FOOD], {added: ({current}) => current.add(new View(drawFood()))}, {id: 'food-view'})
    // A new view is placed right away, entities can appear between ticks
    .reactive([View, Position], {added: (snapshot, view, position) => place(view, position)}, {id: 'view-placement'})
    .iterative([View, Position], (entity, dt, view, position) => place(view, position), {priority: Priority.Render, id: 'view-position'});
}

function place({display}: View, {x, y}: Position): void {
  display.position.set(x * CELL, y * CELL);
}

import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {View} from '../../shared/render/View';
import {ViewSystem} from '../../shared/render/ViewSystem';
import {Asteroid, Position, Rotation, Ship} from '../components';
import {Priority} from '../game';
import {BULLET} from '../tags';
import {drawAsteroid, drawBullet, drawShip} from './graphics';

/**
 * Adds rendering to the game. The game logic doesn't know about views: they are attached to entities
 * when entities appear, and are destroyed together with them.
 */
export function addRendering(engine: Engine, layer: Container): void {
  engine
    .addSystem(new ViewSystem(layer), {id: 'views'})
    .reactive([Ship], {added: ({current}) => current.add(new View(drawShip()))}, {id: 'ship-view'})
    .reactive([Asteroid], {added: ({current}, asteroid) => current.add(new View(drawAsteroid(asteroid)))}, {id: 'asteroid-view'})
    .reactive([BULLET], {added: ({current}) => current.add(new View(drawBullet()))}, {id: 'bullet-view'})
    // A new view is placed right away, entities can appear after the update, for example asteroids of a new wave
    .reactive([View, Position], {added: (snapshot, view, position) => place(view, position)}, {id: 'view-placement'})
    .reactive([View, Rotation], {added: (snapshot, view, rotation) => rotate(view, rotation)}, {id: 'view-orientation'})
    // Views follow entities after all game systems have been updated
    .iterative([View, Position], (entity, dt, view, position) => place(view, position), {priority: Priority.Render, id: 'view-position'})
    .iterative([View, Rotation], (entity, dt, view, rotation) => rotate(view, rotation), {priority: Priority.Render, id: 'view-rotation'});
}

function place({display}: View, {x, y}: Position): void {
  display.position.set(x, y);
}

function rotate({display}: View, {angle}: Rotation): void {
  display.rotation = angle;
}

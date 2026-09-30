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
    // Views follow entities after all game systems have been updated
    .iterative([View, Position], (entity, dt, {display}, {x, y}) => {
      display.position.set(x, y);
    }, {priority: Priority.Render, id: 'view-position'})
    .iterative([View, Rotation], (entity, dt, {display}, {angle}) => {
      display.rotation = angle;
    }, {priority: Priority.Render, id: 'view-rotation'});
}

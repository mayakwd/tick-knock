import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {addViews} from '../../shared/render/addViews';
import {View} from '../../shared/render/View';
import {Asteroid, Position, Rotation} from '../components';
import {Priority} from '../game';
import {BULLET, SHIP} from '../tags';
import {drawAsteroid, drawBullet, drawShip} from './graphics';

/**
 * Adds rendering to the game. The game logic doesn't know about views: they are attached to entities
 * when entities appear, and are destroyed together with them.
 */
export function addRendering(engine: Engine, layer: Container): void {
  const rotate = ({display}: View, {angle}: Rotation) => {
    display.rotation = angle;
  };
  addViews(engine, layer, {position: Position, priority: Priority.Render});
  engine
    .reactive([SHIP], {added: ({current}) => current.add(new View(drawShip()))}, {id: 'ship-view'})
    .reactive([Asteroid], {added: ({current}, asteroid) => current.add(new View(drawAsteroid(asteroid)))}, {id: 'asteroid-view'})
    .reactive([BULLET], {added: ({current}) => current.add(new View(drawBullet()))}, {id: 'bullet-view'})
    // Views are rotated the same way they are placed: right away, and after all game systems
    .reactive([View, Rotation], {added: (snapshot, view, rotation) => rotate(view, rotation)}, {id: 'view-orientation'})
    .iterative([View, Rotation], (entity, dt, view, rotation) => rotate(view, rotation), {priority: Priority.Render, id: 'view-rotation'});
}

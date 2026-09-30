import {Class, Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {Vector} from '../geometry';
import {View} from './View';
import {ViewSystem} from './ViewSystem';

export interface ViewOptions {
  /**
   * Class of the position component of the game
   */
  position: Class<Vector>;
  /**
   * Priority of the system that moves views, it should be updated after all game systems
   */
  priority: number;
  /**
   * Size of a unit of the position in pixels, for example of a cell
   */
  scale?: number;
}

/**
 * Adds views of entities to the layer, and makes them follow positions of their entities. A new view is placed
 * right away, because entities can appear after the update, and views follow entities after all game systems
 * have been updated.
 */
export function addViews(engine: Engine, layer: Container, {position, priority, scale = 1}: ViewOptions): void {
  const place = ({display}: View, {x, y}: Vector) => display.position.set(x * scale, y * scale);
  engine
    .addSystem(new ViewSystem(layer), {id: 'views'})
    .reactive([View, position], {added: (snapshot, view, point) => place(view, point)}, {id: 'view-placement'})
    .iterative([View, position], (entity, dt, view, point) => place(view, point), {priority, id: 'view-position'});
}

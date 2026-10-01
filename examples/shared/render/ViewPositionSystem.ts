import {Entity, EntitySnapshot, IterativeSystem} from 'tick-knock';
import {Position} from '../components/Position';
import {View} from './View';

/**
 * Moves views to positions of their entities. Add it after all game systems, so views show entities where the systems
 * have moved them. A new view is placed right away, because an entity can appear after this system has been updated.
 */
export class ViewPositionSystem extends IterativeSystem.of(View, Position) {
  protected entityAdded = (snapshot: EntitySnapshot, view: View, position: Position): void => {
    this.place(view, position);
  };

  protected updateEntity(entity: Entity, dt: number, view: View, position: Position): void {
    this.place(view, position);
  }

  private place({display}: View, {x, y}: Position): void {
    display.position.set(x, y);
  }
}

import {EntitySnapshot, ReactionSystem} from 'tick-knock';
import {DESTROYED} from '../ecs/tags';

/**
 * Removes destroyed entities from the engine. During the update entities are removed after all systems have been
 * updated, so every system of this update still sees the destroyed entity.
 */
export class DestroySystem extends ReactionSystem.of(DESTROYED) {
  protected entityAdded = ({current}: EntitySnapshot): void => {
    this.engine.removeEntity(current);
  };
}

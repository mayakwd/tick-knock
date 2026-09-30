import {EntitySnapshot, ReactionSystem} from 'tick-knock';

/**
 * Tag of a destroyed entity. Systems destroy entities by adding the tag, and don't remove them themselves: the entity
 * stays in the engine until the end of the update, so systems updated after can react to its destruction, for example
 * give a reward or split an asteroid.
 */
export const DESTROYED = 'destroyed';

/**
 * Removes destroyed entities from the engine. During the update entities are removed after all systems have been
 * updated, so every system of this update still sees the destroyed entity.
 */
export class DestroySystem extends ReactionSystem.of(DESTROYED) {
  protected entityAdded = ({current}: EntitySnapshot): void => {
    this.engine.removeEntity(current);
  };
}

import {Engine, Entity} from 'tick-knock';
import {Collider} from '../components';

/**
 * Removes the entity. During the update it's removed after all systems have been updated, so its collider is removed
 * right away: the entity leaves collision queries and can't hit anything else.
 */
export function destroy(engine: Engine, entity: Entity): void {
  entity.remove(Collider);
  engine.removeEntity(entity);
}

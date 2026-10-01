import {Entity, EntitySnapshot, IterativeSystem} from 'tick-knock';
import {ColliderTree} from '../ColliderTree';
import {Collider, Position} from '../components';

/**
 * Keeps the tree of colliders up to date. A new entity is inserted into the tree, a destroyed one, that has lost its
 * collider, leaves it right away, and every update entities are moved in the tree to their new positions, after
 * everything has moved and before collisions are checked.
 */
export class ColliderTreeSystem extends IterativeSystem.of(Position, Collider) {
  public constructor(private readonly tree: ColliderTree) {
    super();
  }

  protected entityAdded = ({current}: EntitySnapshot, position: Position): void => {
    this.tree.add(current, position);
  };

  protected entityRemoved = ({current}: EntitySnapshot): void => {
    this.tree.remove(current);
  };

  protected updateEntity(entity: Entity, dt: number, position: Position): void {
    this.tree.move(entity, position);
  }
}

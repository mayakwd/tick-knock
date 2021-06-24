import {Query, QueryBuilder, QueryPredicate} from './Query';
import {Entity} from './Entity';
import {ReactionSystem} from './ReactionSystem';

/**
 * Iterative system made for iterating over entities that matches its query.
 *
 * @example
 * You have a View component, that is responsible for entity displaying and contains an image.
 * So every step you want to update image positions, that can depends on Position component.
 *
 * ```ts
 * class ViewSystem extends IterativeSystem {
 *   constructor(container:Container) {
 *      super(new Query((entity:Entity) => entity.hasAll(View, Position));
 *      this.container = container;
 *   }
 *
 *   // Update entity view position on screen, via position component data
 *   updateEntity(entity:Entity) {
 *     const {view} = entity.get(View)!;
 *     const {x, y) = entity.get(Position)!;
 *     view.x = x;
 *     view.y = y;
 *   }
 *
 *   // Add entity view from screen
 *   entityAdded = ({entity}:EntitySnapshot) => {
 *    this.container.add(entity.get(View)!.view);
 *   }
 *
 *   // Remove entity view from screen
 *   entityRemoved = (snapshot:EntitySnapshot) => {
 *    this.container.remove(snapshot.get(View)!.view);
 *   }
 * }
 * ```
 */
export abstract class IterativeSystem extends ReactionSystem {
  private _removed: boolean = false;

  protected constructor(query: Query | QueryBuilder | QueryPredicate) {
    super(query);
  }

  public update(dt: number) {
    this.updateEntities(dt);
  }

  public onAddedToEngine() {
    this._removed = false;
    super.onAddedToEngine();
  }

  public onRemovedFromEngine() {
    this._removed = true;
    super.onRemovedFromEngine();
  }

  protected updateEntities(dt: number) {
    for (let entity of this.query.entities) {
      if (this._removed) return;
      this.updateEntity(entity, dt);
    }
  }

  /**
   * Update entity
   *
   * @param entity Entity to update
   * @param dt Delta time in seconds
   */
  protected abstract updateEntity(entity: Entity, dt: number): void;
}

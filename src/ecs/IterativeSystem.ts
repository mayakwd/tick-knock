import {Query} from './Query';
import {Engine} from './Engine';
import {Entity, EntitySnapshot} from './Entity';
import {System} from './System';

/**
 * Represents system that each update iterates over entities from provided query via updateEntity method
 * @example
 * class ViewSystem extends IterativeSystem {
 *   ...
 *   constructor(container:Container) {
 *      this.container = container;
 *   }
 *
 *   // Update entity view position on screen, via position component data
 *   updateEntity(entity:Entity) {
 *     const view = entity.get(View);
 *     const {x, y) = entity.get(Position);
 *     view.x = x;
 *     view.y = y;
 *   }
 *
 *   // Add entity view from screen
 *   entityAdded = (entity:EntitySnapshot) => {
 *    this.container.add(entity.get(View)!.view);
 *   }
 *
 *   // Remove entity view from screen
 *   entityRemoved = (entity:EntitySnapshot) => {
 *    this.container.remove(entity.get(View)!.view);
 *   }
 * }
 */
export abstract class IterativeSystem extends System {
  private readonly query: Query;
  private _removed: boolean = false;

  protected constructor(query: Query) {
    super();
    this.query = query;
  }

  public onAddedToEngine(engine: Engine) {
    engine.addQuery(this.query);
    this.query.onEntityAdded.connect(this.entityAdded);
    this.query.onEntityRemoved.connect(this.entityRemoved);
  }

  public update(dt: number) {
    this.updateEntities(dt);
  }

  public onRemovedFromEngine(engine: Engine) {
    this._removed = true;
    engine.removeQuery(this.query);

    this.query.onEntityAdded.disconnect(this.entityAdded);
    this.query.onEntityRemoved.disconnect(this.entityRemoved);

    this.query.clear();
  }

  protected get entities(): ReadonlyArray<Entity> {
    return this.query.entities;
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

  /**
   * Method will be called for every new entity that matches system query.
   * You could easily override it with your own logic.
   *
   * Note: Method will not be called for already existing in query entities (at the adding system to engine phase),
   * only new entities will be handled
   *
   * @param entity EntitySnapshot that contains entity that was removed from query or engine, and components that it has
   *   before adding, and component that will be added
   */
  protected entityAdded = (entity: EntitySnapshot) => {
  };

  /**
   * Method will be called for every entity matches system query, that is going to be removed from engine, or it stops
   * matching to the query.
   * You could easily override it with your own logic.
   *
   * @param entity EntitySnapshot that contains entity that was removed from query or engine, and components that it has
   *   before removing
   */
  protected entityRemoved = (entity: EntitySnapshot) => {
  };
}

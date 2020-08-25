import {isQueryBuilder, isQueryPredicate, Query, QueryBuilder, QueryPredicate} from './Query';
import {Engine} from './Engine';
import {Entity, EntitySnapshot} from './Entity';
import {System} from './System';

/**
 * Represents a system that reacts when entities are added to or removed from its query.
 * `entityAdded` and `entityRemoved` will be called accordingly.
 *
 * @example
 * ```ts
 * class ViewSystem extends ReactionSystem {
 *   constructor(
 *      private readonly container:Container
 *   ) {
 *      super(new Query((entity:Entity) => entity.has(View));
 *   }
 *
 *   // Add entity view to the screen
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
export abstract class ReactionSystem extends System {
  protected readonly query: Query;

  protected constructor(query: Query | QueryBuilder | QueryPredicate) {
    super();
    if (isQueryBuilder(query)) {
      this.query = query.build();
    } else if (isQueryPredicate(query)) {
      this.query = new Query(query);
    } else {
      this.query = query;
    }
  }

  protected get entities(): ReadonlyArray<Entity> {
    return this.query.entities;
  }

  public onAddedToEngine(engine: Engine) {
    engine.addQuery(this.query);
    this.prepare();
    this.query.onEntityAdded.connect(this.entityAdded);
    this.query.onEntityRemoved.connect(this.entityRemoved);
  }

  public onRemovedFromEngine(engine: Engine) {
    engine.removeQuery(this.query);

    this.query.onEntityAdded.disconnect(this.entityAdded);
    this.query.onEntityRemoved.disconnect(this.entityRemoved);
    this.query.clear();
  }

  protected prepare() {}

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

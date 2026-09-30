import {ComponentsOf, ComponentType, isQueryBuilder, isQueryPredicate, Query, QueryBuilder, QueryPredicate} from './Query';
import {Tag} from './Tag';
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
export abstract class ReactionSystem<C extends unknown[] = any[]> extends System {
  protected readonly query: Query<C>;

  protected constructor(query: Query<C> | QueryBuilder<C> | QueryPredicate) {
    super();
    if (isQueryBuilder(query)) {
      this.query = query.build();
    } else if (isQueryPredicate(query)) {
      this.query = new Query<C>(query);
    } else {
      this.query = query;
    }
  }

  /**
   * Creates a base class of the reaction system, which query contains specified components and tags.
   * Components are passed to {@link entityAdded} and {@link entityRemoved} right after the snapshot, in the same order,
   * tags are skipped.
   *
   * @param componentsOrTags Component classes and tags that entities must have
   * @example
   * ```ts
   * class ViewSystem extends ReactionSystem.of(View, Position) {
   *   protected entityAdded = (snapshot: EntitySnapshot, {view}: View, {x, y}: Position) => {
   *     view.position.set(x, y);
   *     this.container.addChild(view);
   *   };
   *
   *   protected entityRemoved = (snapshot: EntitySnapshot, {view}: View) => {
   *     this.container.removeChild(view);
   *   };
   * }
   * ```
   */
  public static of<T extends Array<ComponentType | Tag>>(...componentsOrTags: T): abstract new () => ReactionSystem<ComponentsOf<T>> {
    abstract class TypedReactionSystem extends ReactionSystem<ComponentsOf<T>> {
      public constructor() {
        super(new QueryBuilder().contains(...componentsOrTags));
      }
    }

    return TypedReactionSystem;
  }

  protected get entities(): ReadonlyArray<Entity> {
    return this.query.entities;
  }

  public onAddedToEngine() {
    this.engine.addQuery(this.query);
    this.prepare();
    this.query.onEntityAdded.connect(this.handleEntityAdded);
    this.query.onEntityRemoved.connect(this.handleEntityRemoved);
  }

  public onRemovedFromEngine() {
    this.engine.removeQuery(this.query);
    this.query.onEntityAdded.disconnect(this.handleEntityAdded);
    this.query.onEntityRemoved.disconnect(this.handleEntityRemoved);
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
   * @param components Components of the entity, if the system is created with {@link ReactionSystem.of}
   *  or its query is built by {@link QueryBuilder}
   */
  protected entityAdded = (entity: EntitySnapshot, ...components: C) => {
  };

  /**
   * Method will be called for every entity matches system query, that is going to be removed from engine, or it stops
   * matching to the query.
   * You could easily override it with your own logic.
   *
   * @param entity EntitySnapshot that contains entity that was removed from query or engine, and components that it has
   *   before removing
   * @param components Components the entity had before removing, if the system is created with
   *  {@link ReactionSystem.of} or its query is built by {@link QueryBuilder}
   */
  protected entityRemoved = (entity: EntitySnapshot, ...components: C) => {
  };

  private readonly handleEntityAdded = (snapshot: EntitySnapshot) => {
    const components = snapshot.current.components;
    callWithComponents(this.entityAdded, snapshot, this.query.columnIds, (id) => components[id]);
  };

  private readonly handleEntityRemoved = (snapshot: EntitySnapshot) => {
    const components = snapshot.current.components;
    // Previous state is restored only if the entity doesn't have the component anymore
    callWithComponents(this.entityRemoved, snapshot, this.query.columnIds, (id) => components[id] ?? snapshot.previous.components[id]);
  };
}

/**
 * Invokes the handler with the snapshot and components, avoiding array allocation for up to three components
 */
function callWithComponents(
  handler: (snapshot: EntitySnapshot, ...components: any[]) => void,
  snapshot: EntitySnapshot,
  ids: ReadonlyArray<number>,
  get: (id: number) => unknown,
): void {
  switch (ids.length) {
    case 0:
      return handler(snapshot);
    case 1:
      return handler(snapshot, get(ids[0]));
    case 2:
      return handler(snapshot, get(ids[0]), get(ids[1]));
    case 3:
      return handler(snapshot, get(ids[0]), get(ids[1]), get(ids[2]));
    default:
      return handler(snapshot, ...ids.map(get));
  }
}

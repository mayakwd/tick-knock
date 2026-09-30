import {ComponentsOf, Query, QueryBuilder, QueryItem, QueryPredicate} from './Query';
import {Entity} from './Entity';
import {ReactionSystem} from './ReactionSystem';
import {RowSystem, updateRows} from '../utils/rows';

/**
 * Iterative system made for iterating over entities that matches its query.
 *
 * The easiest way to create an iterative system is {@link IterativeSystem.of}: types of components are inferred,
 * and components are passed to {@link updateEntity} right after the entity and delta time.
 *
 * @example
 * ```ts
 * class MovementSystem extends IterativeSystem.of(Position, Velocity) {
 *   protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
 *     position.x += velocity.x * dt;
 *     position.y += velocity.y * dt;
 *   }
 * }
 * ```
 *
 * @example
 * A system with a query built from a predicate receives only entities, it gets components by itself.
 * ```ts
 * class ViewSystem extends IterativeSystem {
 *   public constructor(private readonly container: Container) {
 *     super((entity: Entity) => entity.hasAll(View, Position) && !entity.has(HIDDEN));
 *   }
 *
 *   // Update entity view position on the screen
 *   protected updateEntity(entity: Entity) {
 *     const {view} = entity.get(View)!;
 *     const {x, y} = entity.get(Position)!;
 *     view.position.set(x, y);
 *   }
 *
 *   // Add entity view to the screen
 *   protected entityAdded = ({current}: EntitySnapshot) => {
 *     this.container.addChild(current.get(View)!.view);
 *   };
 *
 *   // Remove entity view from the screen
 *   protected entityRemoved = ({previous}: EntitySnapshot) => {
 *     this.container.removeChild(previous.get(View)!.view);
 *   };
 * }
 * ```
 */
export abstract class IterativeSystem<C extends unknown[] = any[]> extends ReactionSystem<C> {
  private _removed: boolean = false;

  /**
   * @internal
   * Returns a value indicating whether the system has been removed from the engine during its update,
   * then the rest of entities are not updated
   */
  public get isIterationStopped(): boolean {
    return this._removed;
  }

  protected constructor(query: Query<C> | QueryBuilder<C> | QueryPredicate) {
    super(query);
  }

  /**
   * Creates a base class of the iterative system, which query contains specified components and tags.
   * Components are passed to {@link updateEntity} in the same order, tags are skipped.
   *
   * @param componentsOrTags Component classes and tags that entities must have
   * @example
   * ```ts
   * class DamageSystem extends IterativeSystem.of(Health, Damage, ALIVE) {
   *   protected updateEntity(entity: Entity, dt: number, health: Health, damage: Damage) {
   *     health.value -= damage.value;
   *   }
   * }
   * ```
   */
  public static of<T extends Array<QueryItem>>(...componentsOrTags: T): abstract new () => IterativeSystem<ComponentsOf<T>> {
    abstract class TypedIterativeSystem extends IterativeSystem<ComponentsOf<T>> {
      public constructor() {
        super(new QueryBuilder().contains(...componentsOrTags));
      }
    }

    return TypedIterativeSystem;
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

  /**
   * Updates every entity of the query.
   * Entities removed from the query during the update are skipped, entities added during the update
   * are updated in the next one.
   *
   * @param dt Delta time in seconds
   */
  protected updateEntities(dt: number) {
    const query = this.query;
    const dense = query.beginIteration();
    try {
      // Components are stored untyped, their types are guaranteed by QueryBuilder
      updateRows(this as unknown as RowSystem, dense, query.columns, dt);
    } finally {
      query.endIteration();
    }
  }

  /**
   * Update entity
   *
   * @param entity Entity to update
   * @param dt Delta time in seconds
   * @param components Components of the entity, if the system is created with {@link IterativeSystem.of}
   *  or its query is built by {@link QueryBuilder}
   */
  protected abstract updateEntity(entity: Entity, dt: number, ...components: C): void;
}

/**
 * Update function of an iterative system created by {@link Engine.iterative}
 * @typeParam C Types of components of the entity
 */
export type IterativeUpdate<C extends unknown[]> = (entity: Entity, dt: number, ...components: C) => void;

/**
 * @internal
 * Iterative system, which updates entities with a function instead of an overridden method
 */
export class FunctionalIterativeSystem<C extends unknown[]> extends IterativeSystem<C> {
  // The function replaces the method, so it's called by the update loop directly, without an additional call
  protected readonly updateEntity: IterativeUpdate<C>;

  public constructor(componentsOrTags: ReadonlyArray<QueryItem>, update: IterativeUpdate<C>) {
    super(new QueryBuilder().contains(...componentsOrTags) as unknown as QueryBuilder<C>);
    this.updateEntity = update;
  }
}

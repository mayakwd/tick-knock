import {ComponentsOf, ComponentType, Query, QueryBuilder, QueryPredicate} from './Query';
import {Tag} from './Tag';
import {Entity} from './Entity';
import {ReactionSystem} from './ReactionSystem';

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
export abstract class IterativeSystem<C extends unknown[] = any[]> extends ReactionSystem<C> {
  private _removed: boolean = false;

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
  public static of<T extends Array<ComponentType | Tag>>(...componentsOrTags: T): abstract new () => IterativeSystem<ComponentsOf<T>> {
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
    // Components are stored untyped, their types are guaranteed by QueryBuilder
    const system = this as unknown as { updateEntity(entity: Entity, dt: number, ...components: unknown[]): void };
    const dense = query.beginIteration();
    const columns = query.columns;
    const length = dense.length;
    try {
      switch (columns.length) {
        case 0:
          for (let i = 0; i < length && !this._removed; i++) {
            const entity = dense[i];
            if (entity !== undefined) system.updateEntity(entity, dt);
          }
          break;
        case 1: {
          const [a] = columns;
          for (let i = 0; i < length && !this._removed; i++) {
            const entity = dense[i];
            if (entity !== undefined) system.updateEntity(entity, dt, a[i]);
          }
          break;
        }
        case 2: {
          const [a, b] = columns;
          for (let i = 0; i < length && !this._removed; i++) {
            const entity = dense[i];
            if (entity !== undefined) system.updateEntity(entity, dt, a[i], b[i]);
          }
          break;
        }
        case 3: {
          const [a, b, c] = columns;
          for (let i = 0; i < length && !this._removed; i++) {
            const entity = dense[i];
            if (entity !== undefined) system.updateEntity(entity, dt, a[i], b[i], c[i]);
          }
          break;
        }
        default:
          for (let i = 0; i < length && !this._removed; i++) {
            const entity = dense[i];
            if (entity !== undefined) system.updateEntity(entity, dt, ...columns.map((column) => column[i]));
          }
      }
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

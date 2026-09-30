import {getComponentId} from './ComponentId';
import {Entity, EntitySnapshot} from './Entity';
import {isTag, Tag} from './Tag';
import {Signal} from '../utils/Signal';
import {Class} from '../utils/Class';
import {forEachRow, RowCallback} from '../utils/rows';

/**
 * Query Predicate is the type that describes a function that compares Entities with the conditions it sets.
 * In other words, it's a function that determines whether Entities meets the right conditions to get into a
 * given Query or not.
 */
export type QueryPredicate = (entity: Entity) => boolean;

/**
 * Any class, including abstract ones, that can be used as a component type.
 */
export type ComponentType<T = unknown> = abstract new (...args: any[]) => T;

/**
 * Components and tags, that entities must not have to match a query. Created by {@link without}.
 */
export class Exclusion {
  /**
   * @param componentsOrTags Component classes and tags, that entities must not have
   */
  public constructor(public readonly componentsOrTags: ReadonlyArray<ComponentType | Tag>) {}
}

/**
 * Excludes entities that have any of the specified components or tags from a query.
 * It's used together with components and tags, that entities must have, wherever they are listed.
 *
 * An entity leaves the query as soon as it gets an excluded component or tag, and joins the query again when
 * the component or tag is removed.
 *
 * @param componentsOrTags Component classes and tags, that entities must not have
 * @example
 * ```ts
 * class MovementSystem extends IterativeSystem.of(Position, Velocity, without(Frozen, DESTROYED)) {
 *   protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
 *     // Frozen and destroyed entities don't move
 *   }
 * }
 *
 * const query = new QueryBuilder().with(Position).without(DESTROYED).build();
 * ```
 */
export function without(...componentsOrTags: Array<ComponentType | Tag>): Exclusion {
  return new Exclusion(componentsOrTags);
}

/**
 * An item of a query description: a component class or a tag, that entities must have, or an {@link Exclusion} of
 * components and tags, that entities must not have.
 */
export type QueryItem = ComponentType | Tag | Exclusion;

/**
 * Converts a list of component classes and tags to the tuple of component types. Tags and exclusions are skipped.
 * An array, which length is not known at compile time, is converted to `unknown[]`.
 * @example
 * ```ts
 * type Components = ComponentsOf<[typeof Position, 'hero', typeof Velocity]>; // [Position, Velocity]
 * ```
 */
export type ComponentsOf<T extends ReadonlyArray<unknown>> =
  number extends T['length']
    ? unknown[]
    : T extends readonly [infer Head, ...infer Tail]
      ? Head extends ComponentType<infer Instance> ? [Instance, ...ComponentsOf<Tail>] : ComponentsOf<Tail>
      : [];

/**
 * Callback that receives an entity of the query and its components.
 */
export type QueryCallback<C extends unknown[]> = (entity: Entity, ...components: C) => void;

/**
 * Query represents list of entities that matches query request.
 *
 * Queries built by {@link QueryBuilder} know component types they contain, so they store components of their
 * entities next to each other in memory and pass them to {@link forEach}, {@link IterativeSystem} and
 * {@link ReactionSystem}. Queries created from a predicate don't know their components and pass only entities.
 * Entities are kept in the order they started matching the query.
 *
 * @typeParam C Types of components passed to {@link forEach}, inferred by {@link QueryBuilder}.
 *  `Query` without type arguments means a query with unknown components, any typed query can be assigned to it.
 * @see QueryBuilder
 */
export class Query<C extends unknown[] = any[]> {
  /**
   * Signal dispatches if new matched entity were added
   */
  public onEntityAdded: Signal<(snapshot: EntitySnapshot) => void> = new Signal();
  /**
   * Signal dispatches if entity stops matching query
   */
  public onEntityRemoved: Signal<(snapshot: EntitySnapshot) => void> = new Signal();

  /**
   * @internal
   * Component identifiers this query depends on, required and excluded ones.
   * Defined only for queries built by {@link QueryBuilder}.
   * Engine uses it to skip query validation for unrelated component changes.
   */
  public componentIds?: ReadonlyArray<number>;
  /**
   * @internal
   * Tags this query depends on, required and excluded ones. Defined only for queries built by {@link QueryBuilder}.
   */
  public tags?: ReadonlyArray<Tag>;

  private readonly _snapshot: EntitySnapshot = new EntitySnapshot();
  private readonly _predicate: QueryPredicate;
  // Entities in the order they were added. Removed entities leave holes, which are compacted when it's safe.
  private _dense: Array<Entity | undefined> = [];
  // Components of the entities, aligned with the dense list, one array per component type of the query
  private _columns: unknown[][] = [];
  private _columnIds: ReadonlyArray<number> = [];
  private _size: number = 0;
  private _holes: number = 0;
  private _iterations: number = 0;
  private _entitiesCache: Entity[] | undefined;

  /**
   * Initializes Query instance
   * @param predicate Matching predicate
   */
  public constructor(predicate: QueryPredicate) {
    this._predicate = predicate;
  }

  /**
   * Entities list which matches the query.
   * The list is a snapshot: it's rebuilt lazily only after the query has been changed.
   */
  public get entities(): ReadonlyArray<Entity> {
    if (this._entitiesCache === undefined) {
      this._entitiesCache = this._dense.filter(isEntity);
    }
    return this._entitiesCache;
  }

  /**
   * Returns the first entity in the query or `undefined` if query is empty.
   * @returns {Entity | undefined}
   */
  public get first(): Entity | undefined {
    const dense = this._dense;
    for (let i = 0; i < dense.length; i++) {
      if (dense[i] !== undefined) return dense[i];
    }
    return undefined;
  }

  /**
   * Returns the last entity in the query or `undefined` if query is empty.
   * @returns {Entity | undefined}
   */
  public get last(): Entity | undefined {
    const dense = this._dense;
    for (let i = dense.length - 1; i >= 0; i--) {
      if (dense[i] !== undefined) return dense[i];
    }
    return undefined;
  }

  /**
   * Returns the number of the entities in the query
   * @returns {number}
   */
  public get length(): number {
    return this._size;
  }

  /**
   * Gets a value indicating that query is empty
   */
  public get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Invokes the callback for every entity of the query, passing the entity and its components.
   * Components are passed in the order they were specified in {@link QueryBuilder.contains}, tags are skipped.
   *
   * It's safe to add or remove entities and components during iteration: removed entities are skipped,
   * entities added to the query during iteration are visited in the next call.
   * Queries created from a predicate pass only the entity.
   *
   * @example
   * ```ts
   * const query = new QueryBuilder().with(Position, Velocity).build();
   * query.forEach((entity, position, velocity) => {
   *   position.x += velocity.x;
   * });
   * ```
   */
  public forEach(callback: QueryCallback<C>): void {
    // Components are stored untyped, their types are guaranteed by QueryBuilder
    const call = callback as unknown as RowCallback;
    const dense = this.beginIteration();
    try {
      forEachRow(dense, this._columns, call);
    } finally {
      this.endIteration();
    }
  }

  /**
   * Returns the number of entities that have been tested by the predicate.
   * @param {(entity: Entity) => boolean} predicate
   * @returns {number}
   */
  public countBy(predicate: QueryPredicate): number {
    let result = 0;
    for (const entity of this._dense) {
      if (entity !== undefined && predicate(entity)) result++;
    }
    return result;
  }

  /**
   * Returns the first entity from the query, that was accepted by predicate
   * @param {(entity: Entity) => boolean} predicate - function that will be called for every entity in the query until
   *  the result of the function become true.
   * @returns {Entity | undefined}
   */
  public find(predicate: QueryPredicate): Entity | undefined {
    for (const entity of this._dense) {
      if (entity !== undefined && predicate(entity)) return entity;
    }
    return undefined;
  }

  /**
   * Returns new array of entities, which passed testing via predicate
   * @param {(entity: Entity) => boolean} predicate - function that will be called for every entity in the query.
   *  If function returns `true` - entity will stay in the array, if `false` than it will be removed.
   * @returns {Entity[]}
   */
  public filter(predicate: QueryPredicate): Entity[] {
    const result: Entity[] = [];
    for (const entity of this._dense) {
      if (entity !== undefined && predicate(entity)) result.push(entity);
    }
    return result;
  }

  /**
   * Returns a value that indicates whether the entity is in the Query.
   * @param {Entity} entity
   * @returns {boolean}
   */
  public has(entity: Entity): boolean {
    return entity.getQuerySlot(this) !== -1;
  }

  /**
   * This method is matching passed list of entities with predicate of the query to determine
   * if entities are the part of query or not.
   *
   * Entities that will pass testing will become a part of the query
   */
  public matchEntities(entities: Iterable<Entity>) {
    for (const entity of entities) {
      this.entityAdded(entity);
    }
  }

  /**
   * Clears the list of entities of the query
   */
  public clear(): void {
    for (const entity of this._dense) {
      entity?.deleteQuerySlot(this);
    }
    if (this._iterations > 0) {
      // The iteration in progress holds the lists, so entities are removed from them in place, and skipped by it.
      // The lists are compacted when the next iteration starts.
      this._dense.fill(undefined);
      this._holes = this._dense.length;
    } else {
      this._dense = [];
      this._columns = this._columnIds.map(() => []);
      this._holes = 0;
    }
    this._size = 0;
    this._entitiesCache = undefined;
  }

  /**
   * @internal
   * Sets component types, which components are stored by the query and passed to callbacks
   */
  public setColumns(componentIds: ReadonlyArray<number>): void {
    this._columnIds = componentIds;
    this._columns = componentIds.map((id) => this._dense.map((entity) => entity?.components[id]));
  }

  /**
   * @internal
   * Identifiers of component types, which components are passed to callbacks
   */
  public get columnIds(): ReadonlyArray<number> {
    return this._columnIds;
  }

  /**
   * @internal
   * Starts iteration over the dense list of entities. Holes are not compacted until the iteration ends,
   * so indices of the dense list and columns stay valid.
   * @returns Dense list of entities, that can contain holes
   */
  public beginIteration(): ReadonlyArray<Entity | undefined> {
    if (this._iterations === 0 && this._holes > 0) {
      this.compact();
    }
    this._iterations++;
    return this._dense;
  }

  /**
   * @internal
   */
  public endIteration(): void {
    this._iterations--;
  }

  /**
   * @internal
   * Components of entities, aligned with the dense list returned by {@link beginIteration}
   */
  public get columns(): ReadonlyArray<ReadonlyArray<unknown>> {
    return this._columns;
  }

  /**
   * @internal
   */
  public validateEntity(entity: Entity): void {
    this.revalidate(entity);
  }

  /**
   * @internal
   */
  public entityAdded = (entity: Entity) => {
    if (entity.getQuerySlot(this) === -1 && this._predicate(entity)) {
      this.add(entity);
    }
  };

  /**
   * @internal
   */
  public entityRemoved = (entity: Entity) => {
    if (entity.getQuerySlot(this) !== -1) {
      this.delete(entity);
    }
  };

  /**
   * @internal
   */
  public entityComponentAdded = <T>(entity: Entity, componentOrTag: NonNullable<T>, componentClass?: Class<NonNullable<T>>) => {
    this.revalidate(entity, componentOrTag, componentClass);
  };

  /**
   * @internal
   */
  public entityComponentRemoved = <T>(entity: Entity, component: NonNullable<T>, componentClass?: Class<NonNullable<T>>) => {
    this.revalidate(entity, component, componentClass);
  };

  private readonly emitAdded = (snapshot: EntitySnapshot) => this.onEntityAdded.emit(snapshot);
  private readonly emitRemoved = (snapshot: EntitySnapshot) => this.onEntityRemoved.emit(snapshot);

  private revalidate<T>(entity: Entity, changed?: NonNullable<T>, changedClass?: Class<NonNullable<T>>): void {
    const slot = entity.getQuerySlot(this);
    const isMatch = this._predicate(entity);
    if (slot === -1) {
      if (isMatch) this.add(entity, changed, changedClass);
    } else if (!isMatch) {
      this.delete(entity, changed, changedClass);
    } else {
      // Entity stays in the query, but its components could be replaced, for example the head of linked components
      this.updateColumns(entity, slot);
    }
  }

  private add<T>(entity: Entity, changed?: NonNullable<T>, changedClass?: Class<NonNullable<T>>): void {
    const slot = this._dense.length;
    this._dense.push(entity);
    const columns = this._columns;
    for (let i = 0; i < columns.length; i++) {
      columns[i].push(entity.components[this._columnIds[i]]);
    }
    entity.setQuerySlot(this, slot);
    this._size++;
    this._entitiesCache = undefined;
    if (this.onEntityAdded.hasHandlers) {
      entity.takeSnapshot(this._snapshot, changed, changedClass);
      this._snapshot.dispatch(this.emitAdded);
    }
  }

  private delete<T>(entity: Entity, changed?: NonNullable<T>, changedClass?: Class<NonNullable<T>>): void {
    const slot = entity.getQuerySlot(this);
    this._dense[slot] = undefined;
    const columns = this._columns;
    for (let i = 0; i < columns.length; i++) {
      columns[i][slot] = undefined;
    }
    entity.deleteQuerySlot(this);
    this._size--;
    this._holes++;
    this._entitiesCache = undefined;
    // Keep memory bounded if the query is changed much more often than iterated
    if (this._iterations === 0 && this._holes > this._dense.length / 2) {
      this.compact();
    }
    if (this.onEntityRemoved.hasHandlers) {
      entity.takeSnapshot(this._snapshot, changed, changedClass);
      this._snapshot.dispatch(this.emitRemoved);
    }
  }

  private updateColumns(entity: Entity, slot: number): void {
    const columns = this._columns;
    for (let i = 0; i < columns.length; i++) {
      columns[i][slot] = entity.components[this._columnIds[i]];
    }
  }

  /**
   * Removes holes from the dense list and columns, keeping the order of entities
   */
  private compact(): void {
    const dense = this._dense;
    const columns = this._columns;
    let target = 0;
    for (let source = 0; source < dense.length; source++) {
      const entity = dense[source];
      if (entity === undefined) continue;
      if (target !== source) {
        dense[target] = entity;
        for (let i = 0; i < columns.length; i++) {
          columns[i][target] = columns[i][source];
        }
        entity.setQuerySlot(this, target);
      }
      target++;
    }
    dense.length = target;
    for (let i = 0; i < columns.length; i++) {
      columns[i].length = target;
    }
    this._holes = 0;
  }
}

function isEntity(entity: Entity | undefined): entity is Entity {
  return entity !== undefined;
}

function hasNone(entity: Entity, components: ReadonlyArray<number>, tags: ReadonlyArray<Tag>): boolean {
  const entityComponents = entity.components;
  for (let i = 0; i < components.length; i++) {
    if (entityComponents[components[i]] !== undefined) return false;
  }
  for (let i = 0; i < tags.length; i++) {
    if (entity.hasTag(tags[i])) return false;
  }
  return true;
}

function hasAll(entity: Entity, components: ReadonlyArray<number>, tags: ReadonlyArray<Tag>): boolean {
  const entityComponents = entity.components;
  for (let i = 0; i < components.length; i++) {
    if (entityComponents[components[i]] === undefined) return false;
  }
  for (let i = 0; i < tags.length; i++) {
    if (!entity.hasTag(tags[i])) return false;
  }
  return true;
}

/**
 * Query builder, helps to create queries.
 * Types of components are inferred, so they are passed to {@link Query.forEach} and {@link IterativeSystem}
 * with correct types.
 *
 * @example
 * ```ts
 * const query = new QueryBuilder()
 *  .with(Position, Velocity)
 *  .with(HERO)
 *  .without(DESTROYED)
 *  .build(); // Query<[Position, Velocity]>
 * ```
 */
export class QueryBuilder<C extends unknown[] = []> {
  private readonly _components: Set<number> = new Set();
  private readonly _tags: Set<Tag> = new Set();
  private readonly _excludedComponents: Set<number> = new Set();
  private readonly _excludedTags: Set<Tag> = new Set();
  private readonly _columns: number[] = [];

  /**
   * Specifies components and tags that must be added to entity to be matched.
   * Exclusions created by {@link without} can be listed here too.
   * @param items Component classes, tags and exclusions
   */
  public with<T extends Array<QueryItem>>(...items: T): QueryBuilder<[...C, ...ComponentsOf<T>]> {
    for (const item of items) {
      if (item instanceof Exclusion) {
        this.without(...item.componentsOrTags);
      } else if (isTag(item)) {
        this._tags.add(item);
      } else {
        const componentId = getComponentId(item as Class<unknown>, true)!;
        this._components.add(componentId);
        // Every specified component is passed to callbacks, even if it's specified twice
        this._columns.push(componentId);
      }
    }
    return this as unknown as QueryBuilder<[...C, ...ComponentsOf<T>]>;
  }

  /**
   * Specifies components and tags that must be added to entity to be matched
   * @param items Component classes, tags and exclusions
   * @deprecated Use {@link with}, which pairs with {@link without}. It will be removed in the next major version.
   */
  public contains<T extends Array<QueryItem>>(...items: T): QueryBuilder<[...C, ...ComponentsOf<T>]> {
    return this.with(...items);
  }

  /**
   * Specifies components and tags that entity must not have to be matched
   * @param componentsOrTags Component classes and tags
   */
  public without(...componentsOrTags: Array<ComponentType | Tag>): QueryBuilder<C> {
    for (const componentOrTag of componentsOrTags) {
      if (isTag(componentOrTag)) {
        this._excludedTags.add(componentOrTag);
      } else {
        this._excludedComponents.add(getComponentId(componentOrTag as Class<unknown>, true)!);
      }
    }
    return this;
  }

  /**
   * Build query
   */
  public build(): Query<C> {
    const components = Array.from(this._components);
    const tags = Array.from(this._tags);
    const excludedComponents = Array.from(this._excludedComponents);
    const excludedTags = Array.from(this._excludedTags);
    const query = excludedComponents.length === 0 && excludedTags.length === 0
      ? new Query<C>((entity: Entity) => hasAll(entity, components, tags))
      : new Query<C>((entity: Entity) => hasAll(entity, components, tags)
        && hasNone(entity, excludedComponents, excludedTags));
    // The query depends on excluded components and tags too: adding or removing them changes whether it matches
    query.componentIds = Array.from(new Set([...components, ...excludedComponents]));
    query.tags = Array.from(new Set([...tags, ...excludedTags]));
    query.setColumns(this._columns.slice());
    return query;
  }

  /**
   * @internal
   */
  public getComponents(): ReadonlySet<number> {
    return this._components;
  }

  /**
   * @internal
   */
  public getTags(): ReadonlySet<Tag> {
    return this._tags;
  }
}

/**
 * @internal
 */
export function isQueryPredicate(item: unknown): item is QueryPredicate {
  return typeof item === 'function';
}

/**
 * @internal
 */
export function isQueryBuilder(item: unknown): item is QueryBuilder<any> {
  return item instanceof QueryBuilder;
}

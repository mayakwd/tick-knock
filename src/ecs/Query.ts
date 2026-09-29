import {getComponentId, getComponentVersion} from './ComponentId';
import {Entity, EntitySnapshot} from './Entity';
import {isTag, Tag} from './Tag';
import {Signal} from '../utils/Signal';
import {Class} from '../utils/Class';

/**
 * Query Predicate is the type that describes a function that compares Entities with the conditions it sets.
 * In other words, it's a function that determines whether Entities meets the right conditions to get into a
 * given Query or not.
 */
export type QueryPredicate = (entity: Entity) => boolean;

/**
 * Query represents list of entities that matches query request.
 * @see QueryBuilder
 */
export class Query {
  /**
   * Signal dispatches if new matched entity were added
   */
  public onEntityAdded: Signal<(snapshot: EntitySnapshot) => void> = new Signal();
  /**
   * Signal dispatches if entity stops matching query
   */
  public onEntityRemoved: Signal<(snapshot: EntitySnapshot) => void> = new Signal();

  private readonly _snapshot: EntitySnapshot = new EntitySnapshot();
  private readonly _predicate: QueryPredicate;
  private readonly _entities: Set<Entity> = new Set();
  private _entitiesCache: Entity[] | undefined;
  private _version: number = 0;
  private readonly _columns: Map<number, QueryColumn> = new Map();

  /**
   * @internal
   * Component identifiers this query depends on. Defined only for queries built by {@link QueryBuilder}.
   * Engine uses it to skip query validation for unrelated component changes.
   */
  public componentIds?: ReadonlyArray<number>;
  /**
   * @internal
   * Tags this query depends on. Defined only for queries built by {@link QueryBuilder}.
   */
  public tags?: ReadonlyArray<Tag>;

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
      this._entitiesCache = Array.from(this._entities);
    }
    return this._entitiesCache;
  }

  /**
   * Returns components of the specified class for every entity of the query.
   * The result is aligned with {@link entities}: `column(Position)[i]` is the component of `entities[i]`.
   * For linked components it contains the first component of the list.
   * If an entity has no such component, the corresponding value is `undefined`.
   *
   * Iterating over columns is much faster than calling `entity.get` for every entity,
   * because component references are stored contiguously in memory.
   * The same as {@link entities}, the column is a snapshot, rebuilt lazily after the query or
   * components of the class have been changed.
   *
   * @example
   * ```ts
   * const positions = query.column(Position);
   * const velocities = query.column(Velocity);
   * for (let i = 0; i < positions.length; i++) {
   *   positions[i].x += velocities[i].x;
   * }
   * ```
   */
  public column<T>(componentClass: Class<T>): ReadonlyArray<T> {
    const id = getComponentId(componentClass, true)!;
    const componentVersion = getComponentVersion(id);
    let column = this._columns.get(id);
    if (column === undefined) {
      column = {queryVersion: -1, componentVersion: -1, components: []};
      this._columns.set(id, column);
    }
    if (column.queryVersion !== this._version || column.componentVersion !== componentVersion) {
      const entities = this.entities;
      const components = new Array(entities.length);
      for (let i = 0; i < entities.length; i++) {
        components[i] = entities[i].components[id];
      }
      column.components = components;
      column.queryVersion = this._version;
      column.componentVersion = componentVersion;
    }
    return column.components as T[];
  }

  /**
   * @internal
   * Value that changes every time the list of entities is changed.
   */
  public get version(): number {
    return this._version;
  }

  /**
   * Returns the first entity in the query or `undefined` if query is empty.
   * @returns {Entity | undefined}
   */
  public get first(): Entity | undefined {
    if (this._entities.size === 0) return undefined;
    return this._entities.values().next().value;
  }

  /**
   * Returns the last entity in the query or `undefined` if query is empty.
   * @returns {Entity | undefined}
   */
  public get last(): Entity | undefined {
    if (this._entities.size === 0) return undefined;
    const entities = this.entities;
    return entities[entities.length - 1];
  }

  /**
   * Returns the number of the entities in the query
   * @returns {Entity | undefined}
   */
  public get length(): number {
    return this._entities.size;
  }

  /**
   * Returns the number of entities that have been tested by the predicate.
   * @param {(entity: Entity) => boolean} predicate
   * @returns {number}
   */
  public countBy(predicate: QueryPredicate): number {
    let result = 0;
    for (const entity of this._entities) {
      if (predicate(entity)) result++;
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
    for (const entity of this._entities) {
      if (predicate(entity)) return entity;
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
    for (const entity of this._entities) {
      if (predicate(entity)) result.push(entity);
    }
    return result;
  }

  /**
   * Returns a value that indicates whether the entity is in the Query.
   * @param {Entity} entity
   * @returns {boolean}
   */
  public has(entity: Entity): boolean {
    return this._entities.has(entity);
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
   * Gets a value indicating that query is empty
   */
  public get isEmpty(): boolean {
    return this._entities.size === 0;
  }

  /**
   * Clears the list of entities of the query
   */
  public clear(): void {
    this._entities.clear();
    this._entitiesCache = undefined;
    this._columns.clear();
    this._version++;
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
    if (!this._entities.has(entity) && this._predicate(entity)) {
      this.add(entity);
    }
  };

  /**
   * @internal
   */
  public entityRemoved = (entity: Entity) => {
    if (this._entities.has(entity)) {
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
    const isMember = this._entities.has(entity);
    const isMatch = this._predicate(entity);
    if (!isMember && isMatch) {
      this.add(entity, changed, changedClass);
    } else if (isMember && !isMatch) {
      this.delete(entity, changed, changedClass);
    }
  }

  private add<T>(entity: Entity, changed?: NonNullable<T>, changedClass?: Class<NonNullable<T>>): void {
    this._entities.add(entity);
    this._entitiesCache = undefined;
    this._version++;
    if (this.onEntityAdded.hasHandlers) {
      entity.takeSnapshot(this._snapshot, changed, changedClass);
      this._snapshot.dispatch(this.emitAdded);
    }
  }

  private delete<T>(entity: Entity, changed?: NonNullable<T>, changedClass?: Class<NonNullable<T>>): void {
    this._entities.delete(entity);
    this._entitiesCache = undefined;
    this._version++;
    if (this.onEntityRemoved.hasHandlers) {
      entity.takeSnapshot(this._snapshot, changed, changedClass);
      this._snapshot.dispatch(this.emitRemoved);
    }
  }
}

interface QueryColumn {
  queryVersion: number;
  componentVersion: number;
  components: unknown[];
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
 * Query builder, helps to create queries
 * @example
 * const query = new QueryBuilder()
 *  .contains(Position)
 *  .contains(Acceleration)
 *  .contains(TorqueForce)
 *  .build();
 */
export class QueryBuilder {
  private readonly _components: Set<number> = new Set();
  private readonly _tags: Set<Tag> = new Set();

  /**
   * Specifies components that must be added to entity to be matched
   * @param componentsOrTags
   */
  public contains(...componentsOrTags: Array<any>): QueryBuilder {
    for (const componentOrTag of componentsOrTags) {
      if (isTag(componentOrTag)) {
        if (!this._tags.has(componentOrTag)) {
          this._tags.add(componentOrTag);
        }
      } else {
        const componentId = getComponentId(componentOrTag, true)!;
        if (!this._components.has(componentId)) {
          this._components.add(componentId);
        }
      }
    }
    return this;
  }

  /**
   * Build query
   */
  public build(): Query {
    const components = Array.from(this._components);
    const tags = Array.from(this._tags);
    const query = new Query((entity: Entity) => hasAll(entity, components, tags));
    query.componentIds = components;
    query.tags = tags;
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
export function isQueryBuilder(item: unknown): item is QueryBuilder {
  return item instanceof QueryBuilder;
}

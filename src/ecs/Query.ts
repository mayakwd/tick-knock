import {getComponentId} from './ComponentId';
import {Entity, EntitySnapshot} from './Entity';
import {Signal} from 'typed-signals';
import {Class} from '../utils/Class';
import {isTag, Tag} from './Tag';

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
  public onEntityAdded: Signal<(entity: EntitySnapshot) => void> = new Signal();
  /**
   * Signal dispatches if entity stops matching query
   */
  public onEntityRemoved: Signal<(entity: EntitySnapshot) => void> = new Signal();

  private readonly _helper: Entity = new Entity();
  private readonly _snapshot: EntitySnapshot = new EntitySnapshot();

  private readonly _predicate: QueryPredicate;
  private _entities: Entity[] = [];

  /**
   * Initializes Query instance
   * @param predicate Matching predicate
   */
  public constructor(predicate: QueryPredicate) {
    this._predicate = predicate;
  }

  /**
   * Entities list which matches the query
   */
  public get entities(): ReadonlyArray<Entity> {
    return Array.from(this._entities);
  }

  /**
   * Returns the first entity in the query or `undefined` if query is empty.
   * @returns {Entity | undefined}
   */
  public get first(): Entity | undefined {
    if (this._entities.length === 0) return undefined;
    return this._entities[0];
  }

  /**
   * Returns the last entity in the query or `undefined` if query is empty.
   * @returns {Entity | undefined}
   */
  public get last(): Entity | undefined {
    if (this._entities.length === 0) return undefined;
    return this._entities[this._entities.length - 1];
  }

  /**
   * Returns the number of the entities in the query
   * @returns {Entity | undefined}
   */
  public get length(): number {
    return this._entities.length;
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
    return this._entities.find(predicate);
  }

  /**
   * Returns new array of entities, which passed testing via predicate
   * @param {(entity: Entity) => boolean} predicate - function that will be called for every entity in the query.
   *  If function returns `true` - entity will stay in the array, if `false` than it will be removed.
   * @returns {Entity[]}
   */
  public filter(predicate: QueryPredicate): Entity[] {
    return this._entities.filter(predicate);
  }

  /**
   * This method is matching passed list of entities with predicate of the query to determine
   * if entities are the part of query or not.
   *
   * Entities that will pass testing will become a part of the query
   */
  public matchEntities(entities: ReadonlyArray<Entity>) {
    entities.forEach((entity) => this.entityAdded(entity));
  }

  /**
   * Gets a value indicating that query is empty
   */
  public get isEmpty(): boolean {
    return this.entities.length == 0;
  }

  /**
   * Clears the list of entities of the query
   */
  public clear(): void {
    this._entities = [];
  }

  /**
   * @internal
   */
  public validateEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    const isMatch = this._predicate(entity);
    if (index !== -1 && !isMatch) {
      this.entityRemoved(entity);
    } else {
      this.entityAdded(entity);
    }
  }

  /**
   * @internal
   */
  public entityAdded = (entity: Entity) => {
    const index = this._entities.indexOf(entity);
    if (index === -1 && this._predicate(entity)) {
      this._entities.push(entity);
      this._snapshot.takeSnapshot(entity);
      this.onEntityAdded.emit(this._snapshot);
    }
  };

  /**
   * @internal
   */
  public entityRemoved = (entity: Entity) => {
    const index = this._entities.indexOf(entity);
    if (index !== -1) {
      this._entities.splice(index, 1);
      this._snapshot.takeSnapshot(entity);
      this.onEntityRemoved.emit(this._snapshot);
    }
  };

  /**
   * @internal
   */
  public entityComponentAdded = <T>(entity: Entity, component: NonNullable<T>) => {
    this.updateHelper(entity, component);

    const index = this._entities.indexOf(entity);
    const isMatch = this._predicate(this._helper);
    if (index === -1 && isMatch) {
      this._snapshot.takeSnapshot(entity, component);
      this._entities.push(entity);
      this.onEntityAdded.emit(this._snapshot);
    } else if (index !== -1 && !isMatch) {
      this._snapshot.takeSnapshot(entity, component);
      this._entities.splice(index, 1);
      this.onEntityRemoved.emit(this._snapshot);
    }
  };

  /**
   * @internal
   */
  public entityComponentRemoved = <T>(entity: Entity, component: NonNullable<T>) => {
    this.updateHelper(entity, component);

    const index = this._entities.indexOf(entity);
    if (index !== -1 && this._predicate(this._helper) && !this._predicate(entity)) {
      this._snapshot.takeSnapshot(entity, component);
      this._entities.splice(index, 1);
      this.onEntityRemoved.emit(this._snapshot);
    } else if (index === -1 && this._predicate(entity) && !this._predicate(this._helper)) {
      this._snapshot.takeSnapshot(entity, component);
      this._entities.push(entity);
      this.onEntityAdded.emit(this._snapshot);
    }
  };

  private updateHelper<T>(entity: Entity, component: NonNullable<T>) {
    this._helper.clear();
    this._helper.copyFrom(entity);
    this._helper.add(component);
  }
}

function hasAll(entity: Entity, components: Set<number>, tags: Set<Tag>): boolean {
  if (components.size > 0) {
    for (const componentId of components) {
      if (entity.components.get(componentId) === undefined) {
        return false;
      }
    }
  }
  if (tags.size > 0) {
    for (const tag of tags) {
      if (!entity.tags.has(tag)) {
        return false;
      }
    }
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
  public contains<T extends unknown>(...componentsOrTags: Array<Class<T> | Tag>): QueryBuilder {
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
    return new Query((entity: Entity) => hasAll(entity, this._components, this._tags));
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

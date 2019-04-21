import {getComponentId} from './ComponentId';
import {Entity, EntitySnapshot} from './Entity';
import {Signal} from 'typed-signals';
import {Class} from '../utils/Class';

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

  private readonly _predicate: (entity: Entity) => boolean;
  private _entities: Entity[] = [];

  /**
   * Initializes Query instance
   * @param predicate Matching predicate
   */
  public constructor(predicate: (entity: Entity) => boolean) {
    this._predicate = predicate;
  }

  /**
   * Entities list which matches the query
   */
  public get entities(): ReadonlyArray<Entity> {
    return Array.from(this._entities);
  }

  /**
   * Match list entities with query
   */
  public matchEntities(entities: ReadonlyArray<Entity>) {
    entities.forEach((entity) => this.entityAdded(entity));
  }

  public clear(): void {
    this._entities = [];
  }

  public entityAdded = (entity: Entity) => {
    const index = this._entities.indexOf(entity);
    if (index === -1 && this._predicate(entity)) {
      this._entities.push(entity);
      this._snapshot.takeSnapshot(entity);
      this.onEntityAdded.emit(this._snapshot);
    }
  };

  public entityRemoved = (entity: Entity) => {
    const index = this._entities.indexOf(entity);
    if (index !== -1) {
      this._entities.splice(index, 1);
      this._snapshot.takeSnapshot(entity);
      this.onEntityRemoved.emit(this._snapshot);
    }
  };

  public entityComponentAdded = (entity: Entity, component: any) => {
    const index = this._entities.indexOf(entity);
    if (index === -1) {
      this.updateHelper(entity, component);

      if (this._predicate(this._helper)) {
        this._snapshot.takeSnapshot(entity, component);
        this._entities.push(entity);
        this.onEntityAdded.emit(this._snapshot);
      }
    }
  };

  public entityComponentRemoved = (entity: Entity, component: any) => {
    const index = this._entities.indexOf(entity);
    if (index !== -1) {
      this.updateHelper(entity, component);

      if (this._predicate(this._helper) && !this._predicate(entity)) {
        this._snapshot.takeSnapshot(entity, component);
        this._entities.splice(index, 1);
        this.onEntityRemoved.emit(this._snapshot);
      }
    }
  };

  private updateHelper(entity: Entity, component: any) {
    this._helper.clear();
    this._helper.copyFrom(entity);
    this._helper.add(component);
  }
}

function hasAll(entity: Entity, components: number[]): boolean {
  for (let componentId of components) {
    if (entity.components.get(componentId) === undefined) {
      return false;
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
  private readonly _components: number[] = [];

  /**
   * Specifies components that must be added to entity to be matched
   * @param components List of component classes
   */
  public contains(...components: Class<any>[]): QueryBuilder {
    for (let component of components) {
      const componentId = getComponentId(component, true)!;
      if (this._components.indexOf(componentId) === -1) {
        this._components[this._components.length] = componentId;
      }
    }
    return this;
  }

  /**
   * Build query
   */
  public build(): Query {
    return new Query((entity: Entity) => hasAll(entity, this._components));
  }
}

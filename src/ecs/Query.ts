import {getComponentId} from "./ComponentId";
import {Entity} from "./Entity";
import {Signal} from "typed-signals";
import {Class} from "../utils/Class";

/**
 * Query represents list of entities that matches query request.
 * @see QueryBuilder
 */
export class Query {
  /**
   * Signal dispatches if new matched entity were added
   */
  public onEntityAdded: Signal<(entity: Entity) => void> = new Signal();
  /**
   * Signal dispatches if entity stops matching query
   */
  public onEntityRemoved: Signal<(entity: Entity) => void> = new Signal();

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
    return this._entities;
  }

  /**
   * Match list entities with query
   */
  public matchEntities(entities: ReadonlyArray<Entity>) {
    entities.forEach(entity => this.entityAdded(entity));
  }

  public clear(): void {
    this._entities = [];
  }

  public entityAdded = (entity: Entity) => {
    this.handleAddedEntity(entity);
  };

  public entityRemoved = (entity: Entity) => {
    this.handleRemovedEntity(entity);
  };

  protected handleAddedEntity(entity: Entity) {
    const index = this._entities.indexOf(entity);
    if (index === -1 && this._predicate(entity)) {
      this._entities.push(entity);
      this.onEntityAdded.emit(entity);
    }
  }

  protected handleRemovedEntity(entity: Entity) {
    const index = this._entities.indexOf(entity);
    if (index === -1 || this._predicate(entity)) return;
    this._entities.splice(index, 1);
    this.onEntityRemoved.emit(entity);
  }
}

function hasAll(entity: Entity, components: number[]): boolean {
  for (let componentId of components) {
    if (entity.components[componentId] === undefined) {
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

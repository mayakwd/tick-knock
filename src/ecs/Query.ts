import {getComponentId} from "./ComponentId";
import {Entity} from "./Entity";
import {Signal} from "typed-signals";
import {Class} from "../utils/Class";

export class Query {
  public onEntityAdded: Signal<(entity: Entity) => void> = new Signal();
  public onEntityRemoved: Signal<(entity: Entity) => void> = new Signal();

  private readonly _predicate: (entity: Entity) => boolean;

  public constructor(predicate: (entity: Entity) => boolean) {
    this._predicate = predicate;
  }

  private _entities: Entity[] = [];

  public get entities(): ReadonlyArray<Entity> {
    return this._entities;
  }

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
    if (index === -1) return;
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

export class QueryBuilder {
  private readonly _components: number[] = [];

  public contains(...components: Class<any>[]): QueryBuilder {
    for (let component of components) {
      const componentId = getComponentId(component, true)!;
      if (this._components.indexOf(componentId) === -1) {
        this._components[this._components.length] = componentId;
      }
    }
    return this;
  }

  public build(): Query {
    return new Query((entity: Entity) => hasAll(entity, this._components));
  }
}

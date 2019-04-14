import {Entity} from "./Entity";
import {Signal} from "typed-signals";
import {System} from "./System";
import {Class} from "../utils/Class";
import {Query} from "./Query";

/**
 * Engine represents game state, and provides entities update loop on top of systems.
 */
export class Engine {
  public onEntityAdded: Signal<(entity: Entity) => void> = new Signal();
  public onEntityRemoved: Signal<(entity: Entity) => void> = new Signal();
  private _entityMap: EntityMap = Object.create(null);

  public constructor() {}

  private _entities: Entity[] = [];

  public get entities(): ReadonlyArray<Entity> {
    return this._entities;
  }

  private _systems: System[] = [];

  public get systems(): ReadonlyArray<System> {
    return this._systems;
  }

  private _queries: Query[] = [];

  public get queries(): ReadonlyArray<Query> {
    return this._queries;
  }

  public addEntity(entity: Entity) {
    if (this._entityMap[entity.id]) return;
    this._entities.push(entity);
    this._entityMap[entity.id] = entity;
    this.onEntityAdded.emit(entity);
    entity.onComponentAdded.connect(this.entityComponentAdded);
    entity.onComponentRemoved.connect(this.entityComponentRemoved);
  }

  public removeEntity(entity: Entity) {
    if (!this._entityMap[entity.id]) return;
    const index = this._entities.indexOf(entity);
    if (index != -1) {
      this._entities.splice(index, 1);
    }
    this._entityMap[entity.id] = undefined;
    this.onEntityRemoved.emit(entity);
  }

  /**
   * Adds a system to engine, and set it's priority inside of engine update loop.
   *
   * @param system System to add to the engine
   * @param priority Value indicating the priority of updating system in update loop. Lower priority
   *  means sooner update.
   */
  public addSystem(system: System, priority: number = 0) {
    system.priority = priority;
    if (this._systems.length === 0) {
      this._systems[0] = system;
    } else {
      const index = this._systems.findIndex(value => value.priority > priority);
      if (index === -1) {
        this._systems[this._systems.length] = system;
      } else {
        this._systems.splice(index, 0, system);
      }
    }
    system.onAddedToEngine(this);
  }

  public removeSystem(system: System) {
    const index = this._systems.indexOf(system);
    if (index === -1) return;
    this._systems.splice(index, 1);
    system.onRemovedFromEngine(this);
  }

  public getSystem<T extends System>(systemClass: Class<T>): T | undefined {
    return this._systems.find(value => value instanceof systemClass) as T;
  }

  public removeAllSystems(): void {
    const systems = this._systems;
    this._systems = [];
    for (let system of systems) {
      system.onRemovedFromEngine(this);
    }
  }

  public update(dt: number) {
    this._systems.forEach(value => value.update(dt));
  }

  public addQuery(query: Query) {
    this.onEntityAdded.connect(query.entityAdded);
    this.onEntityRemoved.connect(query.entityRemoved);
    query.matchEntities(this.entities);
    this._queries[this._queries.length] = query;
  }

  public removeQuery(query: Query) {
    const index = this._queries.indexOf(query);
    if (index == -1) return;
    this._queries.splice(index, 1);
    this.onEntityAdded.disconnect(query.entityAdded);
    this.onEntityRemoved.disconnect(query.entityRemoved);
    query.clear();
  }

  private entityComponentAdded = (entity: Entity, component: Class<any>) => {
    this._queries.forEach(value => value.entityAdded(entity));
  };

  private entityComponentRemoved = (entity: Entity, component: Class<any>) => {
    this._queries.forEach(value => value.entityRemoved(entity));
  };
}

type EntityMap = {
  [key: number]: Entity | undefined;
};

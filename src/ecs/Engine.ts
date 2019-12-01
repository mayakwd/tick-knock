import {Entity} from './Entity';
import {Signal} from 'typed-signals';
import {System} from './System';
import {Class} from '../utils/Class';
import {Query} from './Query';

/**
 * Engine represents game state, and provides entities update loop on top of systems.
 */
export class Engine {
  /**
   * Signal dispatches when new entity were added to engine
   */
  public onEntityAdded: Signal<(entity: Entity) => void> = new Signal();
  /**
   * Signal dispatches when entity was removed from engine
   */
  public onEntityRemoved: Signal<(entity: Entity) => void> = new Signal();

  private _entityMap: Map<number, Entity> = new Map();
  private _entities: Entity[] = [];
  private _systems: System[] = [];
  private _queries: Query[] = [];

  /**
   * Gets a list of entities added to engine
   */
  public get entities(): ReadonlyArray<Entity> {
    return Array.from(this._entities);
  }

  /**
   * Gets a list of systems added to engine
   */
  public get systems(): ReadonlyArray<System> {
    return this._systems;
  }

  /**
   * Gets a list of queries added to engine
   */
  public get queries(): ReadonlyArray<Query> {
    return this._queries;
  }

  /**
   * Adds an entity to engine.
   * If entity is already added to engine - it does nothing.
   *
   * @param entity Entity to add to engine
   * @see onEntityAdded
   */
  public addEntity(entity: Entity): Engine {
    if (this._entityMap.has(entity.id)) return this;
    this._entities.push(entity);
    this._entityMap.set(entity.id, entity);
    this.onEntityAdded.emit(entity);
    this.connectEntity(entity);

    return this;
  }

  /**
   * Remove entity from engine
   * If engine not contains entity - it does nothing.
   *
   * @param entity Entity to remove from engine
   * @see onEntityRemoved
   */
  public removeEntity(entity: Entity): Engine {
    if (!this._entityMap.has(entity.id)) return this;
    const index = this._entities.indexOf(entity);
    if (index != -1) {
      this._entities.splice(index, 1);
    }
    this._entityMap.delete(entity.id);
    this.onEntityRemoved.emit(entity);
    this.disconnectEntity(entity);

    return this;
  }

  /**
   * Adds a system to engine, and set it's priority inside of engine update loop.
   *
   * @param system System to add to the engine
   * @param priority Value indicating the priority of updating system in update loop. Lower priority
   *  means sooner update.
   */
  public addSystem(system: System, priority: number = 0): Engine {
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

    return this;
  }

  /**
   * Removes a system from engine
   * Avoid remove the system during update cycle, do it only if your sure what your are doing.
   * Note: {@link IterativeSystem} has aware guard during update loop, if system removed - updating is being stopped.
   *
   * @param system System to remove
   */
  public removeSystem(system: System): Engine {
    const index = this._systems.indexOf(system);
    if (index === -1) return this;
    this._systems.splice(index, 1);
    system.onRemovedFromEngine(this);

    return this;
  }

  /**
   * Gets a system of the specific class
   *
   * @param systemClass Class of the system that should be found
   */
  public getSystem<T extends System>(systemClass: Class<T>): T | undefined {
    return this._systems.find(value => value instanceof systemClass) as T;
  }

  /**
   * Remove all systems
   */
  public removeAllSystems(): void {
    const systems = this._systems;
    this._systems = [];
    for (const system of systems) {
      system.onRemovedFromEngine(this);
    }
  }

  /**
   * Remove all queries.
   * After remove all queries will be cleared.
   */
  public removeAllQueries(): void {
    const queries = this._queries;
    this._queries = [];
    for (const query of queries) {
      this.disconnectQuery(query);
      query.clear();
    }
  }

  /**
   * Remove all entities.
   * onEntityRemoved will be fired for every entity.
   */
  public removeAllEntities(): void {
    this.removeAllEntitiesInternal(false);
  }

  /**
   * Removes all entities, queries and systems.
   * All entities will be removed silently, {@link onEntityRemoved} event will not be fired.
   * Queries will be cleared.
   */
  public clear(): void {
    this.removeAllEntitiesInternal(true);
    this.removeAllSystems();
    this.removeAllQueries();
  }

  /**
   * Updates the engine. This cause updating all the systems in the engine in the order of priority they've been added.
   *
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    for (const system of this._systems) {
      system.update(dt);
    }
  }

  /**
   * Adds a query to engine. It matches all available in engine entities with query.
   *
   * When any entity will be added, removed, their components will be modified - this query will be updated,
   * until not being removed from engine.
   *
   * @param query Entity match query
   */
  public addQuery(query: Query): Engine {
    this.connectQuery(query);
    query.matchEntities(this.entities);
    this._queries[this._queries.length] = query;
    return this;
  }

  /**
   * Removes a query and clear it.
   *
   * @param query Entity match query
   */
  public removeQuery(query: Query) {
    const index = this._queries.indexOf(query);
    if (index == -1) return;
    this._queries.splice(index, 1);
    this.disconnectQuery(query);
    query.clear();
    return this;
  }

  private connectEntity(entity: Entity) {
    entity.onComponentAdded.connect(this.onComponentAdded);
    entity.onComponentRemoved.connect(this.onComponentRemoved);
    entity.onInvalidationRequested.connect(this.onInvalidationRequested);
  }

  private disconnectEntity(entity: Entity) {
    entity.onComponentAdded.disconnect(this.onComponentAdded);
    entity.onComponentRemoved.disconnect(this.onComponentRemoved);
    entity.onInvalidationRequested.disconnect(this.onInvalidationRequested);
  }

  private connectQuery(query: Query) {
    this.onEntityAdded.connect(query.entityAdded);
    this.onEntityRemoved.connect(query.entityRemoved);
  }

  private disconnectQuery(query: Query) {
    this.onEntityAdded.disconnect(query.entityAdded);
    this.onEntityRemoved.disconnect(query.entityRemoved);
  }

  private removeAllEntitiesInternal(silently: boolean): void {
    const entities = this._entities;
    this._entities = [];
    this._entityMap.clear();
    for (const entity of entities) {
      if (!silently) {
        this.onEntityRemoved.emit(entity);
      }
      this.disconnectEntity(entity);
    }
  }

  private onComponentAdded = (entity: Entity, component: Class<any>) => {
    this._queries.forEach(value => value.entityComponentAdded(entity, component));
  };

  private onInvalidationRequested = (entity: Entity) => {
    this._queries.forEach(value => value.validateEntity(entity));
  };

  private onComponentRemoved = (entity: Entity, component: Class<any>) => {
    this._queries.forEach(value => value.entityComponentRemoved(entity, component));
  };
}

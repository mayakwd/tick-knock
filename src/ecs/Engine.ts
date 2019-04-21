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
    entity.onComponentAdded.connect(this.onComponentAdded);
    entity.onComponentRemoved.connect(this.onComponentRemoved);

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
    for (let system of systems) {
      system.onRemovedFromEngine(this);
    }
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
    this.onEntityAdded.connect(query.entityAdded);
    this.onEntityRemoved.connect(query.entityRemoved);
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
    this.onEntityAdded.disconnect(query.entityAdded);
    this.onEntityRemoved.disconnect(query.entityRemoved);
    query.clear();
    return this;
  }

  private onComponentAdded = (entity: Entity, component: Class<any>) => {
    this._queries.forEach(value => value.entityComponentAdded(entity, component));
  };

  private onComponentRemoved = (entity: Entity, component: Class<any>) => {
    this._queries.forEach(value => value.entityComponentRemoved(entity, component));
  };
}
import {Entity} from './Entity';
import {System} from './System';
import {Class} from '../utils/Class';
import {Query} from './Query';
import {Subscription} from './Subscription';
import {Signal} from '../utils/Signal';

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
  private _subscriptions: Subscription<any>[] = [];
  private _sharedConfig: Entity = new Entity();

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

  public constructor() {
    this.connectEntity(this._sharedConfig);
  }

  /**
   * @internal
   */
  public get subscriptions(): ReadonlyArray<Subscription<any>> {
    return this._subscriptions;
  }

  /**
   * Gets a shared config entity, that's accessible from every system added to engine
   *
   * @return {Entity}
   */
  public get sharedConfig(): Entity {
    return this._sharedConfig;
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
    this._entities.splice(index, 1);
    this._entityMap.delete(entity.id);
    this.onEntityRemoved.emit(entity);
    this.disconnectEntity(entity);

    return this;
  }

  /**
   * Removes a system from engine
   * Avoid remove the system during update cycle, do it only if your sure what you are doing.
   * Note: {@link IterativeSystem} has aware guard during update loop, if system removed - updating is being stopped.
   *
   * @param system System to remove
   */
  public removeSystem(system: System): Engine {
    const index = this._systems.indexOf(system);
    if (index === -1) return this;
    this._systems.splice(index, 1);
    system.onRemovedFromEngine();
    system.setEngine(undefined);
    return this;
  }

  /**
   * Gets an entity by its id
   *
   * @param {number} id Entity identifier
   * @return {Entity | undefined} corresponding entity or undefined if it's not found.
   */
  public getEntityById(id: number): Entity | undefined {
    return this._entityMap.get(id);
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
      system.onRemovedFromEngine();
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
   * Adds a system to engine, and set its priority inside of engine update loop.
   *
   * @param system System to add to the engine
   * @param priority Value indicating the priority of updating system in update loop. Lower priority
   *  means sooner update.
   */
  public addSystem(system: System, priority: number = 0): Engine {
    system.setPriority(priority);
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
    system.setEngine(this);
    system.onAddedToEngine();

    return this;
  }

  /**
   * Removes a query and clear it.
   *
   * @param query Entity match query
   */
  public removeQuery(query: Query) {
    const index = this._queries.indexOf(query);
    if (index == -1) return undefined;
    this._queries.splice(index, 1);
    this.disconnectQuery(query);
    query.clear();
    return this;
  }

  /**
   * Subscribe to any message of the {@link messageType}.
   * Those messages can be dispatched from any system attached to the engine
   *
   * @param {Class<T> | T} messageType - Message type (can be class or any instance, for example string or number)
   * @param {(value: T) => void} handler - Handler for the message
   */
  public subscribe<T>(messageType: Class<T> | T, handler: (value: T) => void): void {
    this.addSubscription(messageType, handler);
  }

  /**
   * Unsubscribe from messages of specific type
   *
   * @param {Class<T>} messageType - Message type
   * @param {(value: T) => void} handler - Specific handler that must be unsubscribed, if not defined then all handlers
   *  related to this message type will be unsubscribed.
   */
  public unsubscribe<T>(messageType: Class<T> | T, handler?: (value: T) => void): void {
    this.removeSubscription(messageType, handler);
  }

  /**
   * Unsubscribe from all type of messages
   */
  public unsubscribeAll(): void {
    this._subscriptions.length = 0;
  }

  /**
   * @internal
   */
  public addSubscription<T>(messageType: Class<T> | T, handler: (value: T) => void): Subscription<T> {
    for (const subscription of this._subscriptions) {
      if (subscription.equals(messageType, handler)) return subscription;
    }
    const subscription = new Subscription<T>(messageType, handler);
    this._subscriptions.push(subscription);
    return subscription;
  }

  /**
   * @internal
   */
  public removeSubscription<T>(messageType: Class<T> | T, handler: ((value: T) => void) | undefined): void {
    let i = this._subscriptions.length;
    while (--i >= 0) {
      const subscription = this._subscriptions[i];
      if (subscription.equals(messageType, handler)) {
        this._subscriptions.splice(i, 1);
        if (handler !== undefined) return;
      }
    }
  }

  /**
   * @internal
   */
  public dispatch<T>(message: T) {
    for (const subscription of this._subscriptions) {
      if ((typeof subscription.messageType === 'function' && message instanceof subscription.messageType) || message === subscription.messageType) {
        subscription.handler(message);
      }
    }
  }

  private connectEntity(entity: Entity) {
    entity.onComponentAdded.connect(this.onComponentAdded, Number.POSITIVE_INFINITY);
    entity.onComponentRemoved.connect(this.onComponentRemoved, Number.POSITIVE_INFINITY);
    entity.onInvalidationRequested.connect(this.onInvalidationRequested, Number.NEGATIVE_INFINITY);
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

  private onComponentAdded = <T>(entity: Entity, component: NonNullable<T>, componentClass?: Class<NonNullable<T>>) => {
    this._queries.forEach(value => value.entityComponentAdded(entity, component, componentClass));
  };

  private onInvalidationRequested = (entity: Entity) => {
    this._queries.forEach(value => value.validateEntity(entity));
  };

  private onComponentRemoved = <T>(entity: Entity, component: NonNullable<T>, componentClass?: Class<NonNullable<T>>) => {
    this._queries.forEach(value => value.entityComponentRemoved(entity, component, componentClass));
  };
}

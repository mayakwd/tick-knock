import {Entity, EntityObserver} from './Entity';
import {System} from './System';
import {Class} from '../utils/Class';
import {ComponentsOf, Query, QueryItem} from './Query';
import {FunctionalIterativeSystem, IterativeUpdate} from './IterativeSystem';
import {FunctionalReactionSystem, ReactionHandlers} from './ReactionSystem';
import {Subscription} from './Subscription';
import {Signal} from '../utils/Signal';
import {isTag, Tag} from './Tag';
import {getComponentClass, getComponentId} from './ComponentId';

/**
 * Options of a system added to the engine
 */
export interface SystemOptions {
  /**
   * Value indicating the priority of updating system in update loop. Lower priority means sooner update.
   * Default value is 0.
   */
  priority?: number;
  /**
   * Unique identifier of the system in the engine. It can be used to find or remove the system.
   * @see Engine.getSystemById
   * @see Engine.removeSystem
   */
  id?: string;
}

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
  private _systems: System[] = [];
  private _queries: Query[] = [];
  // Queries built by QueryBuilder are indexed by their components and tags,
  // so component changes validate only the queries that depend on them.
  // Lists of queries are replaced instead of being changed, so adding or removing a query from a handler
  // doesn't affect the notification in progress.
  // Indexed by component id, ids are small sequential numbers
  private _queriesByComponent: Array<Query[] | undefined> = [];
  private _queriesByTag: Map<Tag, Query[]> = new Map();
  private _predicateQueries: Query[] = [];
  private _subscriptions: Subscription<any>[] = [];
  // Identifiers are kept by the engine, so systems don't need a property for them
  private _systemsById: Map<string, System> = new Map();
  private _systemIds: Map<System, string> = new Map();
  private _removalRequested: Set<number> = new Set();
  private _isUpdating: boolean = false;

  /**
   * Gets a list of entities added to engine
   */
  public get entities(): ReadonlyArray<Entity> {
    return Array.from(this._entityMap.values());
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
   * @internal
   */
  public get subscriptions(): ReadonlyArray<Subscription<any>> {
    return this._subscriptions;
  }

  /**
   * Adds an entity to engine.
   * If entity is already added to engine - it does nothing.
   *
   * @param entity Entity to add to engine
   * @see onEntityAdded
   */
  public addEntity(entity: Entity): Engine {
    // Adding an entity cancels its removal requested during the update
    this._removalRequested.delete(entity.id);
    if (this._entityMap.has(entity.id)) return this;
    this._entityMap.set(entity.id, entity);
    // The entity is observed before handlers are called, so components added by handlers update queries
    this.connectEntity(entity);
    this.onEntityAdded.emit(entity);
    return this;
  }

  /**
   * Removes an entity from the engine.
   * If the engine doesn't contain the entity - it does nothing.
   *
   * If the engine is being updated, the entity is removed after all systems have been updated, so removing entities
   * from systems never breaks iteration of other systems. Until then, the entity can't be found by
   * {@link getEntityById}, but it stays in queries. If the engine is not being updated, the entity is removed
   * immediately.
   *
   * @param entity Entity to remove from engine
   * @since 5.0.0 - Entities removed during the update are always removed after it, `safe` option is removed.
   * @see onEntityRemoved
   */
  public removeEntity(entity: Entity): Engine {
    if (!this._entityMap.has(entity.id)) return this;
    if (this._isUpdating) {
      this._removalRequested.add(entity.id);
      return this;
    }
    return this.removeEntityNow(entity);
  }

  /**
   * Gets an entity by its id
   *
   * @param {number} id Entity identifier
   * @return {Entity | undefined} corresponding entity or undefined if it's not found.
   */
  public getEntityById(id: number): Entity | undefined {
    if (this._removalRequested.has(id)) return undefined;
    return this._entityMap.get(id);
  }

  /**
   * Removes a system from engine.
   * A system removed during the update is not updated anymore, starting from the moment of removal.
   *
   * @param systemOrId System to remove, or its identifier
   */
  public removeSystem(systemOrId: System | string): Engine {
    const system = typeof systemOrId === 'string' ? this._systemsById.get(systemOrId) : systemOrId;
    if (system === undefined) return this;
    const index = this._systems.indexOf(system);
    if (index === -1) return this;
    // The list is replaced instead of being changed, so the update in progress iterates the list it has started with
    this._systems = [...this._systems.slice(0, index), ...this._systems.slice(index + 1)];
    const id = this._systemIds.get(system);
    if (id !== undefined) {
      this._systemsById.delete(id);
      this._systemIds.delete(system);
    }
    system.onRemovedFromEngine();
    system.setEngine(undefined);
    return this;
  }

  /**
   * Gets an identifier of the system, if it was added to the engine with one
   *
   * @param system System added to the engine
   * @see SystemOptions
   */
  public getSystemId(system: System): string | undefined {
    return this._systemIds.get(system);
  }

  /**
   * Updates the engine. This cause updating all the systems in the engine in the order of priority they've been added.
   *
   * Systems added during the update are updated starting from the next update. Systems removed during the update
   * are not updated anymore. Entities removed during the update are removed after all systems have been updated.
   *
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    this._isUpdating = true;
    try {
      // Adding and removing systems replace the list, so this loop is not affected by them
      for (const system of this._systems) {
        if (!system.isAttachedTo(this)) continue;
        system.update(dt);
        if (system.isRemovalRequested) {
          this.removeSystem(system);
        }
      }
    } finally {
      this._isUpdating = false;
      this.removeRequestedEntities();
    }
  }

  /**
   * Gets a system by its identifier
   *
   * @param id Identifier of the system, specified when it was added
   * @see SystemOptions
   */
  public getSystemById<T extends System = System>(id: string): T | undefined {
    return this._systemsById.get(id) as T | undefined;
  }

  /**
   * Adds a system, that updates every entity with specified components and tags using the function.
   * Components are passed to the function after the entity and delta time, in the same order, tags are skipped.
   *
   * @param componentsOrTags Component classes and tags that entities must have
   * @param update Function that updates an entity
   * @param options Priority and identifier of the system
   * @example
   * ```ts
   * engine
   *   .iterative([Position, Velocity], (entity, dt, position, velocity) => {
   *     position.x += velocity.x * dt;
   *   })
   *   .iterative([Health, Damage, ALIVE], (entity, dt, health, damage) => {
   *     health.value -= damage.value;
   *   }, {priority: 10, id: 'damage'});
   * ```
   */
  public iterative<T extends ReadonlyArray<QueryItem>>(
    componentsOrTags: readonly [...T],
    update: IterativeUpdate<ComponentsOf<T>>,
    options?: SystemOptions,
  ): Engine {
    return this.addSystem(new FunctionalIterativeSystem(componentsOrTags, update), options);
  }

  /**
   * Adds a system, that reacts on entities with specified components and tags added to or removed from the engine,
   * or starting and stopping matching them.
   * Components are passed to handlers after the snapshot, in the same order, tags are skipped.
   *
   * @param componentsOrTags Component classes and tags that entities must have
   * @param handlers Functions invoked when an entity is added or removed
   * @param options Priority and identifier of the system
   * @example
   * ```ts
   * engine.reactive([View, Position], {
   *   added: (snapshot, {view}, {x, y}) => {
   *     view.position.set(x, y);
   *     container.addChild(view);
   *   },
   *   removed: (snapshot, {view}) => container.removeChild(view),
   * });
   * ```
   */
  public reactive<T extends ReadonlyArray<QueryItem>>(
    componentsOrTags: readonly [...T],
    handlers: ReactionHandlers<ComponentsOf<T>>,
    options?: SystemOptions,
  ): Engine {
    return this.addSystem(new FunctionalReactionSystem(componentsOrTags, handlers), options);
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
    this._systemsById.clear();
    this._systemIds.clear();
    for (const system of systems) {
      system.onRemovedFromEngine();
      system.setEngine(undefined);
    }
  }

  /**
   * Remove all queries.
   * After remove all queries will be cleared.
   */
  public removeAllQueries(): void {
    const queries = this._queries;
    this._queries = [];
    this._queriesByComponent = [];
    this._queriesByTag.clear();
    this._predicateQueries = [];
    for (const query of queries) {
      this.disconnectQuery(query);
      query.clear();
    }
  }

  /**
   * Remove all entities.
   * onEntityRemoved will be fired for every entity.
   *
   * If the engine is being updated, entities are removed after all systems have been updated,
   * the same way as {@link removeEntity} does.
   */
  public removeAllEntities(): void {
    if (this._isUpdating) {
      for (const id of this._entityMap.keys()) this._removalRequested.add(id);
      return;
    }
    this.removeAllEntitiesInternal(false);
  }

  /**
   * Removes all entities, queries and systems immediately, even if the engine is being updated.
   * All entities will be removed silently, {@link onEntityRemoved} event will not be fired.
   * Queries will be cleared.
   */
  public clear(): void {
    this.removeAllEntitiesInternal(true);
    this.removeAllSystems();
    this.removeAllQueries();
  }

  private removeRequestedEntities(): void {
    if (this._removalRequested.size === 0) return;
    const ids = Array.from(this._removalRequested);
    this._removalRequested.clear();
    for (const id of ids) {
      const entity = this._entityMap.get(id);
      if (entity !== undefined) this.removeEntityNow(entity);
    }
  }

  private removeEntityNow(entity: Entity): Engine {
    this._entityMap.delete(entity.id);
    // Changes made by handlers of the removed entity don't add it back to queries
    this.disconnectEntity(entity);
    this.onEntityRemoved.emit(entity);

    return this;
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
    if (this._queries.includes(query)) return this;
    this.connectQuery(query);
    query.matchEntities(this._entityMap.values());
    this._queries = [...this._queries, query];
    this.indexQuery(query);
    return this;
  }

  /**
   * Adds a system to engine, and set its priority inside of engine update loop.
   *
   * @param system System to add to the engine
   * @param priorityOrOptions Priority of the system or {@link SystemOptions}. Lower priority means sooner update.
   * @throws Error if a system with the same identifier is already added
   */
  public addSystem(system: System, priorityOrOptions: number | SystemOptions = 0): Engine {
    const {priority = 0, id} = typeof priorityOrOptions === 'number' ? {priority: priorityOrOptions} : priorityOrOptions;
    if (id !== undefined) {
      if (this._systemsById.has(id)) {
        throw new Error(`System with id "${id}" is already added to the engine`);
      }
      this._systemsById.set(id, system);
      this._systemIds.set(system, id);
    }
    system.setPriority(priority);
    // The list is replaced instead of being changed, so the update in progress iterates the list it has started with
    const index = this._systems.findIndex(value => value.priority > priority);
    this._systems = index === -1
      ? [...this._systems, system]
      : [...this._systems.slice(0, index), system, ...this._systems.slice(index)];
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
    if (!this._queries.includes(query)) return undefined;
    this._queries = this._queries.filter((value) => value !== query);
    this.unindexQuery(query);
    this.disconnectQuery(query);
    query.clear();
    return this;
  }

  /**
   * Subscribe to any message of the `messageType`.
   * Those messages can be dispatched from any system attached to the engine
   *
   * @param {Class<T> | T} messageType - Message type (can be class or any instance, for example string or number)
   * @param {(value: T) => void} handler - Handler for the message
   */
  public subscribe<T>(messageType: Class<T> | T, handler: (value: T) => void): Subscription<T> {
    return this.addSubscription(messageType, handler);
  }

  /**
   * Unsubscribe from messages of specific type
   *
   * @param {Class<T> | T} messageType - Message type
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
    entity.addObserver(this._entityObserver);
  }

  private disconnectEntity(entity: Entity) {
    entity.removeObserver(this._entityObserver);
  }

  private connectQuery(query: Query) {
    this.onEntityAdded.connect(query.entityAdded);
    this.onEntityRemoved.connect(query.entityRemoved);
  }

  private disconnectQuery(query: Query) {
    this.onEntityAdded.disconnect(query.entityAdded);
    this.onEntityRemoved.disconnect(query.entityRemoved);
  }

  private indexQuery(query: Query) {
    if (query.componentIds === undefined || query.tags === undefined) {
      this._predicateQueries = [...this._predicateQueries, query];
      return;
    }
    for (const id of query.componentIds) {
      this._queriesByComponent[id] = [...(this._queriesByComponent[id] ?? []), query];
    }
    for (const tag of query.tags) {
      this._queriesByTag.set(tag, [...(this._queriesByTag.get(tag) ?? []), query]);
    }
  }

  private unindexQuery(query: Query) {
    if (query.componentIds === undefined || query.tags === undefined) {
      this._predicateQueries = this._predicateQueries.filter((value) => value !== query);
      return;
    }
    for (const id of query.componentIds) {
      const queries = this._queriesByComponent[id]?.filter((value) => value !== query);
      this._queriesByComponent[id] = queries?.length ? queries : undefined;
    }
    for (const tag of query.tags) {
      const queries = this._queriesByTag.get(tag)?.filter((value) => value !== query);
      if (queries?.length) {
        this._queriesByTag.set(tag, queries);
      } else {
        this._queriesByTag.delete(tag);
      }
    }
  }

  private getIndexedQueries(componentOrTag: unknown, componentClass?: Class<unknown>): Query[] | undefined {
    if (isTag(componentOrTag)) {
      return this._queriesByTag.get(componentOrTag);
    }
    const id = getComponentId(componentClass ?? getComponentClass(componentOrTag as NonNullable<unknown>));
    return id === undefined ? undefined : this._queriesByComponent[id];
  }

  private removeAllEntitiesInternal(silently: boolean): void {
    const entities = Array.from(this._entityMap.values());
    this._entityMap.clear();
    this._removalRequested.clear();
    for (const entity of entities) {
      if (!silently) {
        this.onEntityRemoved.emit(entity);
      }
      this.disconnectEntity(entity);
    }
  }

  private onComponentAdded = <T>(entity: Entity, component: NonNullable<T>, componentClass?: Class<NonNullable<T>>) => {
    const queries = this.getIndexedQueries(component, componentClass);
    if (queries !== undefined) {
      for (const query of queries) query.entityComponentAdded(entity, component, componentClass);
    }
    for (const query of this._predicateQueries) query.entityComponentAdded(entity, component, componentClass);
  };

  private onInvalidationRequested = (entity: Entity) => {
    for (const query of this._queries) query.validateEntity(entity);
  };

  private onComponentRemoved = <T>(entity: Entity, component: NonNullable<T>, componentClass?: Class<NonNullable<T>>) => {
    const queries = this.getIndexedQueries(component, componentClass);
    if (queries !== undefined) {
      for (const query of queries) query.entityComponentRemoved(entity, component, componentClass);
    }
    for (const query of this._predicateQueries) query.entityComponentRemoved(entity, component, componentClass);
  };

  // Declared after the handlers, so they are already initialized
  private readonly _entityObserver: EntityObserver = {
    entityComponentAdded: this.onComponentAdded,
    entityComponentRemoved: this.onComponentRemoved,
    entityInvalidated: this.onInvalidationRequested,
  };
}

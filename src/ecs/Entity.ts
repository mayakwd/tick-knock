import {getComponentClass, getComponentId} from './ComponentId';
import {Class} from '../utils/Class';
import {Signal} from '../utils/Signal';
import {isTag, Tag} from './Tag';
import {ILinkedComponent, isLinkedComponent} from './LinkedComponent';
import {LinkedComponentList} from './LinkedComponentList';

/**
 * Entity readonly interface
 */
export interface ReadonlyEntity {
  /**
   * The signal dispatches if new component or tag was added to the entity
   */
  readonly onComponentAdded: Signal<ComponentUpdateHandler>;
  /**
   * The signal dispatches if component was removed from the entity
   */
  readonly onComponentRemoved: Signal<ComponentUpdateHandler>;
  /**
   * Returns components map, where key is component identifier, and value is a component itself
   * @see {@link getComponentId}, {@link Entity.getComponents}
   */
  readonly components: Readonly<Record<number, unknown>>;
  /**
   * Returns set of tags applied to the entity
   * @see getTags
   */
  readonly tags: ReadonlySet<Tag>;

  /**
   * Returns value indicating whether entity has a specific component or tag
   *
   * @param {Class | Tag} componentClassOrTag
   * @param id Identifier of the LinkedComponent
   * @example
   * ```ts
   * const BERSERK = 10091;
   * if (!entity.has(Immobile) || entity.has(BERSERK)) {
   *   const position = entity.get(Position)!;
   *   position.x += 1;
   * }
   * ```
   */
  has<T>(componentClassOrTag: Class<T> | Tag, id?: string): boolean;

  /**
   * Returns value indicating whether entity contains a component instance.
   * If the component is an instance of ILinkedComponent then all components of its type will be checked for equality.
   *
   * @param {T} component
   * @param {Class<K>} resolveClass
   * @example
   * ```ts
   * const boon = new Boon(BoonType.HEAL);
   * const entity = new Entity()
   *   .append(new Boon(BoonType.PROTECTION))
   *   .append(boon);
   *
   * if (entity.contains(boon)) {
   *   logger.info('Ah, sweet. We have not only protection but heal as well!');
   * }
   * ```
   */
  contains<T extends K, K>(component: T, resolveClass?: Class<K>): boolean;

  /**
   * Returns value indicating whether entity has a specific component
   *
   * @param component
   * @param id Identifier of the LinkedComponent
   * @example
   * ```
   * if (!entity.hasComponent(Immobile)) {
   *   const position = entity.get(Position)!;
   *   position.x += 1;
   * }
   * ```
   */
  hasComponent<T>(component: Class<T>, id?: string): boolean;

  /**
   * Returns value indicating whether entity has a specific tag
   *
   * @param tag
   * @example
   * ```ts
   * const BERSERK = "berserk";
   * let damage = initialDamage;
   * if (entity.hasTag(BERSERK)) {
   *   damage *= 1.2;
   * }
   * ```
   */
  hasTag(tag: Tag): boolean;

  /**
   * Returns value indicating whether entity have any of specified components/tags
   *
   * @param {Class<unknown> | Tag} componentClassOrTag
   * @returns {boolean}
   * @example
   * ```ts
   * const IMMORTAL = "immortal";
   * if (!entity.hasAny(Destroy, Destroying, IMMORTAL)) {
   *   entity.add(new Destroy());
   * }
   * ```
   */
  hasAny(...componentClassOrTag: Array<Class<unknown> | Tag>): boolean;

  /**
   * Returns value indicating whether entity have all of specified components/tags
   *
   * @param {Class<unknown> | Tag} componentClassOrTag
   * @returns {boolean}
   * @example
   * ```ts
   * const I_LOVE_GRAVITY = "no-i-don't";
   * if (entity.hasAll(Position, Acceleration, I_LOVE_GRAVITY)) {
   *   entity.get(Position)!.y += entity.get(Acceleration)!.y * dt;
   * }
   * ```
   */
  hasAll(...componentClassOrTag: Array<Class<unknown> | Tag>): boolean;

  /**
   * Returns an array of entity components
   *
   * @returns {unknown[]}
   */
  getComponents(): unknown[];

  /**
   * Returns an array of tags applied to the entity
   */
  getTags(): Tag[];

  /**
   * Gets a component instance if it's exists in the entity, otherwise returns `undefined`
   * - If you want to check presence of the tag then use {@link has} instead.
   *
   * @param componentClass Specific component class
   * @param id Identifier of the LinkedComponent
   */
  get<T>(componentClass: Class<T>, id?: string): T | undefined;

  /**
   * Iterates over instances of linked component appended to the Entity and performs the action over each.<br>
   * Works for standard components too: the action is called for the single instance.
   *
   * @param {Class<T>} componentClass Component`s class
   * @param {(component: T) => void} action Action to perform over every component instance.
   * @example
   * ```ts
   * class Boon extends LinkedComponent {
   *   public constructor(
   *     public type: BoonType,
   *     public duration: number
   *   ) { super(); }
   * }
   * const entity = new Entity()
   *   .append(new Boon(BoonType.HEAL, 2))
   *   .append(new Boon(BoonType.PROTECTION, 3));
   *
   * // Let's decrease every boon duration and remove them if they are expired.
   * entity.iterate(Boon, (boon) => {
   *   if (--boon.duration <= 0) {
   *      entity.pick(boon);
   *   }
   * });
   * ```
   */
  iterate<T>(componentClass: Class<T>, action: (component: T) => void): void;

  /**
   * Returns generator with all instances of specified linked component class.
   * Works for standard components too: the generator yields the single instance.
   *
   * @param {Class<T>} componentClass Component`s class
   * @example
   * ```ts
   * for (const damage of entity.getAll(Damage)) {
   *   if (damage.value < 0) {
   *     throw new Error('Damage value can\'t be less than zero');
   *   }
   * }
   * ```
   */
  getAll<T>(componentClass: Class<T>): Generator<T, void, T>;

  /**
   * Searches a component instance of specified linked component class.
   * Works for standard components too: the predicate is called for the single instance.
   *
   * @param {Class<T>} componentClass
   * @param {(component: T) => boolean} predicate
   * @return {T | undefined}
   */
  find<T>(componentClass: Class<T>, predicate: (component: T) => boolean): T | undefined;

  /**
   * Returns number of components of specified class: the number of linked components, 1 for a standard component,
   * or 0 if the entity doesn't have the component.
   *
   * @param {Class<T>} componentClass
   * @return {number}
   */
  lengthOf<T>(componentClass: Class<T>): number;
}

/**
 * Entity is a general purpose object, which can be marked with tags and can contain different components.
 * So it is just a container, that can represent any in-game entity, like enemy, bomb, configuration, game state, etc.
 *
 * @example
 * ```ts
 * // Here we can see structure of the component "Position", it's just a data that can be attached to the Entity
 * // There is no limits for component`s structure.
 * // Components mustn't hold the reference to the entity that it attached to.
 *
 * class Position {
 *   public x:number;
 *   public y:number;
 *
 *   public constructor(x:number = 0, y:number = 0) {
 *     this.x = x;
 *     this.y = y;
 *   }
 * }
 *
 * // We can mark an entity with the tag OBSTACLE. Tag can be represented as a number or string.
 * const OBSTACLE = 10100;
 *
 * const entity = new Entity()
 *  .add(OBSTACLE)
 *  .add(new Position(10, 5));
 * ```
 */
export class Entity implements ReadonlyEntity {
  /**
   * The signal dispatches if new component or tag was added to the entity. Works for every linked component as well.
   */
  public get onComponentAdded(): Signal<ComponentUpdateHandler> {
    return this._onComponentAdded ??= new Signal();
  }

  /**
   * The signal dispatches if component was removed from the entity. Works for every linked component as well.
   */
  public get onComponentRemoved(): Signal<ComponentUpdateHandler> {
    return this._onComponentRemoved ??= new Signal();
  }

  /**
   * The signal dispatches that invalidation requested for this entity.
   * Which means that if the entity attached to the engine — its queries will be updated.
   *
   * Use {@link Entity.invalidate} method in case if in query test function is using component properties or complex
   * logic.
   *
   * Only adding/removing components and tags are tracked by Engine. So you need to request queries invalidation
   * manually, if some of your queries depends on logic or component`s properties.
   */
  public get onInvalidationRequested(): Signal<(entity: Entity) => void> {
    return this._onInvalidationRequested ??= new Signal();
  }

  /**
   * Unique id identifier
   */
  public readonly id = entityId++;

  // Indexed by component id. The array grows exactly to the largest id, see setComponentValue
  private _components: unknown[] = [];
  // Linked components, tags, signals and observers are created lazily to keep entities lightweight
  private _linkedComponents?: Record<number, LinkedComponentList<ILinkedComponent>>;
  private _tags?: Set<Tag>;
  private _onComponentAdded?: Signal<ComponentUpdateHandler>;
  private _onComponentRemoved?: Signal<ComponentUpdateHandler>;
  private _onInvalidationRequested?: Signal<(entity: Entity) => void>;
  // Usually the only observer is the engine, so it's stored without allocating an array
  private _observer?: EntityObserver;
  private _extraObservers?: EntityObserver[];
  // Pairs of queries the entity belongs to and its positions in them: [query, slot, query, slot, ...]
  private _querySlots?: unknown[];

  /**
   * Returns components map, where key is component identifier, and value is a component itself
   * @see {@link getComponentId}, {@link Entity.getComponents}
   */
  public get components(): Readonly<Record<number, unknown>> {
    return this._components;
  }

  /**
   * Returns set of tags applied to the entity
   * @see getTags
   */
  public get tags(): ReadonlySet<Tag> {
    return this._tags ??= new Set();
  }

  /**
   * Adds a component or tag to the entity.
   * It's a unified shorthand for {@link addComponent} and {@link addTag}.
   *
   * - If a component of the same type already exists in entity, it will be replaced by the passed one (only if
   *  component itself is not the same, in this case - no actions will be done).
   * - If the tag is already present in the entity - no actions will be done.
   * - During components replacement {@link onComponentRemoved} and {@link onComponentAdded} will be triggered
   *  sequentially.
   * - If there is no component of the same type, or the tag is not present in the entity - then only
   *  {@link onComponentAdded} will be triggered.
   * - If the passed component is an instance of ILinkedComponent then all existing instances will be removed, and the
   *  passed instance will be added to the Entity. {@link onComponentRemoved} will be triggered for every removed
   *  instance and {@link onComponentAdded} will be triggered for the passed component.
   * - Linked component always replaces all existing instances. Even if the passed instance already exists in the
   *  Entity - all existing linked components will be removed anyway, and replaced with the passed one.
   *
   * @throws Throws error if component is null or undefined, or if component is not an instance of the class as well
   * @param {T | Tag} componentOrTag Component instance or Tag
   * @param {K} resolveClass Class that should be used as resolving class.
   *  Passed class always should be an ancestor of Component's class.
   *  It has sense only if component instance is passed, but not the Tag.
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link addComponent, appendComponent}, {@link addTag}
   * @example
   * ```ts
   * const BULLET = 1;
   * const EXPLOSIVE = "explosive";
   * const entity = new Entity()
   *  .add(new Position())
   *  .add(new View())
   *  .add(new Velocity())
   *  .add(BULLET)
   *  .add(EXPLOSIVE);
   * ```
   */
  public add<T extends K, K extends unknown>(componentOrTag: NonNullable<T> | Tag, resolveClass?: Class<K>): Entity {
    if (isTag(componentOrTag)) {
      this.addTag(componentOrTag);
    } else {
      this.addComponent(componentOrTag, resolveClass);
    }
    return this;
  }

  /**
   * Appends a linked component to the entity.
   *
   * - If linked component is not exists, then it will be added to the Entity and {@link onComponentAdded}
   * will be triggered.
   * - If component already exists in the entity, then passed one will be appended to the tail. {@link onComponentAdded}
   *  will be triggered as well.
   *
   * It's a shorthand to {@link appendComponent}
   *
   * @throws Throws error if component is null or undefined, or if component is not an instance of the class as well
   * @param {T | Tag} component ILinkedComponent instance
   * @param {K} resolveClass Class that should be used as resolving class.
   *  Passed class always should be an ancestor of Component's class.
   *
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link addComponent}
   * @see {@link appendComponent}
   * @example
   * ```ts
   * const entity = new Entity()
   *   .append(new Damage(1))
   *   .append(new Damage(2));
   *
   * while (entity.has(Damage)) {
   *   const damage = entity.withdraw(Damage)!;
   *   print(damage.value);
   * }
   * ```
   */
  public append<T extends K, K extends ILinkedComponent>(component: NonNullable<T>, resolveClass?: Class<K>): Entity {
    return this.appendComponent(component, resolveClass);
  }

  /**
   * Removes first appended linked component instance of the specified type.
   * Unlike {@link remove} and {@link removeComponent} remaining linked components stays in the Entity.
   *
   * - If linked component exists in the Entity, then it will be removed from Entity and {@link onComponentRemoved}
   * will be triggered.
   *
   * @param {Class<T>} componentClass
   * @return {T | undefined} Component instance if any of the specified type exists in the entity, otherwise undefined
   * @example
   * ```ts
   * const entity = new Entity()
   *   .append(new Damage(1))
   *   .append(new Damage(2))
   *   .append(new Damage(3));
   *
   * entity.withdraw(Damage);
   * entity.iterate(Damage, (damage) => {
   *   print('Remaining damage: ' + damage.value);
   * });
   *
   * // Remaining damage: 2
   * // Remaining damage: 3
   * ```
   */
  public withdraw<T>(componentClass: Class<T>): T | undefined {
    const component = this.get(componentClass);
    if (component === undefined) return;
    if (isLinkedComponent(component)) {
      return this.withdrawComponent(component, componentClass as Class<ILinkedComponent>);
    } else {
      return this.remove(componentClass);
    }
  }

  /**
   * Removes particular linked component instance from the Entity by its id.
   *
   * - If linked component instance exists in the Entity, then it will be removed from Entity and
   * {@link onComponentRemoved} will be triggered.
   *
   * @param {Class<K>} resolveClass Resolve class
   * @param {string} id Linked component id
   * @return {T | undefined} Component instance if it exists in the entity, otherwise undefined
   */
  public pick<T extends ILinkedComponent>(resolveClass: Class<T>, id: string): T | undefined;
  /**
   * Removes particular linked component instance from the Entity.
   *
   * - If linked component instance exists in the Entity, then it will be removed from Entity and
   * {@link onComponentRemoved} will be triggered.
   *
   * @param {NonNullable<T>} component Linked component instance
   * @param {Class<K> | undefined} resolveClass Resolve class
   * @return {T | undefined} Component instance if it exists in the entity, otherwise undefined
   */
  public pick<T>(component: NonNullable<T>, resolveClass?: Class<T>): T | undefined;
  public pick<T>(componentOrResolveClass: NonNullable<T> | Class<T>, resolveClassOrId?: Class<T> | string): T | undefined {
    if (typeof resolveClassOrId === 'string') {
      const component = this.find<T>(componentOrResolveClass as Class<T>, (component) => isLinkedComponent(component) && component.id === resolveClassOrId);
      if (isLinkedComponent(component)) {
        return this.withdrawComponent(component, componentOrResolveClass as Class<ILinkedComponent>);
      }
      return undefined;
    }
    if (isLinkedComponent(componentOrResolveClass)) {
      return this.withdrawComponent(componentOrResolveClass, resolveClassOrId as Class<ILinkedComponent>);
    }
    return this.remove(resolveClassOrId ?? getComponentClass(componentOrResolveClass as NonNullable<T>));
  }

  /**
   * Adds a component to the entity.
   *
   * - If a component of the same type already exists in entity, it will be replaced by the passed one (only if
   *  component itself is not the same, in this case - no actions will be done).
   * - During components replacement {@link onComponentRemoved} and {@link onComponentAdded} will be triggered
   *  sequentially.
   * - If there is no component of the same type - then only {@link onComponentAdded} will be triggered.
   *
   * @throws Throws error if component is null or undefined, or if component is not an instance of the class as well
   * @param {T} component Component instance
   * @param {K} resolveClass Class that should be used as resolving class.
   *  Passed class always should be an ancestor of Component's class.
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link add}, {@link addTag}
   * @example
   * ```ts
   * const BULLET = 1;
   * const entity = new Entity()
   *  .addComponent(new Position())
   *  .addComponent(new View())
   *  .add(BULLET);
   * ```
   */
  public addComponent<T extends K, K extends unknown>(component: NonNullable<T>, resolveClass?: Class<K>): Entity {
    beforeChange();
    const componentClass = getComponentClass(component, resolveClass);
    const id = getComponentId(componentClass, true)!;
    const linkedComponent = isLinkedComponent(component);
    if (this._components[id] !== undefined) {
      if (!linkedComponent && component === this._components[id]) {
        return this;
      }
      this.remove(componentClass);
    }
    if (linkedComponent) {
      this.append(component as ILinkedComponent, resolveClass as Class<ILinkedComponent>);
    } else {
      this.setComponentValue(id, component);
      this.dispatchOnComponentAdded(component, componentClass);
    }
    return this;
  }

  /**
   * Appends a linked component to the entity.
   *
   * - If linked component is not exists, then it will be added to the Entity and {@link onComponentAdded}
   * will be triggered.
   * - If component already exists in the entity, then passed one will be appended to the tail. {@link onComponentAdded}
   *  will be triggered as well.
   *
   * @throws Throws error if component is null or undefined, or if component is not an instance of the class as well
   * @param {T | Tag} component ILinkedComponent instance
   * @param {K} resolveClass Class that should be used as resolving class.
   *  Passed class always should be an ancestor of Component's class.
   *
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link append}
   * @see {@link addComponent}
   * @example
   * ```ts
   * const entity = new Entity()
   *   .append(new Damage(1))
   *   .append(new Damage(2));
   *
   * let damage = entity.get(Damage);
   * while (damage !== undefined) {
   *   print(damage.value);
   *   damage = damage.next;
   * }
   * ```
   */
  public appendComponent<T extends K, K extends ILinkedComponent>(component: NonNullable<T>, resolveClass?: Class<K>): Entity {
    beforeChange();
    const componentClass = getComponentClass(component, resolveClass);
    const componentId = getComponentId(componentClass, true)!;
    const componentList = this.getLinkedComponentList(componentId)!;
    componentList.add(component);
    if (this._components[componentId] === undefined) {
      this.setComponentValue(componentId, componentList.head);
    }
    this.dispatchOnComponentAdded(component, componentClass);
    return this;
  }

  /**
   * Adds a tag to the entity.
   *
   * - If the tag is already present in the entity - no actions will be done.
   * - If there is no such tag in the entity then {@link onComponentAdded} will be triggered.
   *
   * @param {Tag} tag Tag
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link add}, {@link addComponent}
   * @example
   * ```ts
   * const DEVELOPER = 'developer';
   * const EXHAUSTED = 2;
   * const entity = new Entity()
   *  .addTag(DEVELOPER)
   *  .add(EXHAUSTED)
   * ```
   */
  public addTag(tag: Tag): Entity {
    beforeChange();
    const tags = this._tags ??= new Set();
    if (!tags.has(tag)) {
      tags.add(tag);
      this.dispatchOnComponentAdded(tag);
    }
    return this;
  }

  /**
   * Returns value indicating whether entity has a specific component or tag
   *
   * @param componentClassOrTag
   * @param id Identifier of the LinkedComponent
   * @example
   * ```ts
   * const BERSERK = 10091;
   * if (!entity.has(Immobile) || entity.has(BERSERK)) {
   *   const position = entity.get(Position)!;
   *   position.x += 1;
   * }
   * ```
   */
  public has<T>(componentClassOrTag: Class<T> | Tag, id?: string): boolean {
    if (isTag(componentClassOrTag)) {
      return this.hasTag(componentClassOrTag);
    }
    return this.hasComponent(componentClassOrTag, id);
  }

  /**
   * Returns value indicating whether entity contains a component instance.
   * If the component is an instance of ILinkedComponent then all components of its type will be checked for equality.
   *
   * @param {NonNullable<T>} component
   * @param {Class<K>} resolveClass
   * @example
   * ```ts
   * const boon = new Boon(BoonType.HEAL);
   * const entity = new Entity()
   *   .append(new Boon(BoonType.PROTECTION))
   *   .append(boon);
   *
   * if (entity.contains(boon)) {
   *   logger.info('Ah, sweet. We have not only protection but heal as well!');
   * }
   * ```
   */
  public contains<T extends K, K>(component: NonNullable<T>, resolveClass?: Class<K>): boolean {
    const componentClass = getComponentClass(component, resolveClass);
    if (isLinkedComponent(component)) {
      return this.find(componentClass, (value) => value === component) !== undefined;
    }
    return this.get(componentClass) === component;
  }

  /**
   * Returns value indicating whether entity has a specific component
   *
   * @param component Component class
   * @param id Identifier of the LinkedComponent
   *
   * @example
   * ```
   * if (!entity.hasComponent(Immobile)) {
   *   const position = entity.get(Position)!;
   *   position.x += 1;
   * }
   * ```
   */
  public hasComponent<T>(component: Class<T>, id?: string): boolean {
    return this.get(component, id) !== undefined;
  }

  /**
   * Returns value indicating whether entity has a specific tag
   *
   * @param tag
   * @example
   * ```ts
   * const BERSERK = "berserk";
   * let damage = initialDamage;
   * if (entity.hasTag(BERSERK)) {
   *   damage *= 1.2;
   * }
   * ```
   */
  public hasTag(tag: Tag): boolean {
    return this._tags !== undefined && this._tags.has(tag);
  }

  /**
   * Returns value indicating whether entity have any of specified components/tags
   *
   * @param {Class<unknown> | Tag} componentClassOrTag
   * @returns {boolean}
   * @example
   * ```ts
   * const IMMORTAL = "immortal";
   * if (!entity.hasAny(Destroy, Destroying, IMMORTAL)) {
   *   entity.add(new Destroy());
   * }
   * ```
   */
  public hasAny(...componentClassOrTag: Array<Class<unknown> | Tag>): boolean {
    return componentClassOrTag.some(value => this.has(value));
  }

  /**
   * Returns value indicating whether entity have all of specified components/tags
   *
   * @param {Class<unknown> | Tag} componentClassOrTag
   * @returns {boolean}
   * @example
   * ```ts
   * const I_LOVE_GRAVITY = "no-i-don't";
   * if (entity.hasAll(Position, Acceleration, I_LOVE_GRAVITY)) {
   *   entity.get(Position)!.y += entity.get(Acceleration)!.y * dt;
   * }
   * ```
   */
  public hasAll(...componentClassOrTag: Array<Class<unknown> | Tag>): boolean {
    return componentClassOrTag.every(value => this.has(value));
  }

  /**
   * Gets a component instance if it's exists in the entity, otherwise returns `undefined`
   * - If you want to check presence of the tag then use {@link has} instead.
   *
   * @param componentClass Specific component class
   * @param id Identifier of the LinkedComponent
   */
  public get<T>(componentClass: Class<T>, id?: string): T | undefined {
    const cid = getComponentId(componentClass);
    if (cid === undefined) return undefined;
    let component = this._components[cid];
    if (id !== undefined) {
      if (isLinkedComponent(component)) {
        while (component !== undefined) {
          if ((component as ILinkedComponent).id === id) return component as T;
          component = (component as ILinkedComponent).next;
        }
      }
      return undefined;
    }
    return this._components[cid] as T;
  }

  /**
   * Returns an array of entity components
   *
   * @returns {unknown[]}
   */
  public getComponents(): unknown[] {
    return Array.from(Object.values(this._components));
  }

  /**
   * Returns an array of tags applied to the entity
   */
  public getTags(): Tag[] {
    return this._tags === undefined ? [] : Array.from(this._tags);
  }

  /**
   * Removes a component or tag from the entity.
   *  In case if the component or tag is present - then {@link onComponentRemoved} will be
   *  dispatched after removing it from the entity.
   *
   * If linked component type provided:
   * - For each instance of linked component {@link onComponentRemoved} will be called
   * - Only head of the linked list will be returned.
   *
   * If you need to get all instances use {@link withdraw} or {@link pick} instead, or check {@link iterate},
   * {@link getAll}
   *
   * It's a shorthand for {@link removeComponent}
   *
   * @param componentClassOrTag Specific component class or tag
   * @returns Component instance or `undefined` if it doesn't exists in the entity, or tag was removed
   * @see {@link withdraw}
   * @see {@link pick}
   */
  public remove<T>(componentClassOrTag: Class<T> | Tag): T | undefined {
    if (isTag(componentClassOrTag)) {
      this.removeTag(componentClassOrTag);
      return undefined;
    }
    return this.removeComponent(componentClassOrTag);
  }

  /**
   * Removes a component from the entity.
   *  In case if the component is present - then {@link onComponentRemoved} will be
   *  dispatched after removing it from the entity.
   *
   * If linked component type provided:
   * - For each instance of linked component {@link onComponentRemoved} will be called
   * - Only head of the linked list will be returned.
   *
   * If you need to get all instances use {@link withdraw} or {@link pick} instead, or check {@link iterate},
   * {@link getAll}
   *
   * @param componentClassOrTag Specific component class, use {@link removeTag} to remove a tag
   * @returns Component instance or `undefined` if it doesn't exists in the entity
   */
  public removeComponent<T>(componentClassOrTag: Class<T>): T | undefined {
    beforeChange();
    const id = getComponentId(componentClassOrTag);
    if (id === undefined || this._components[id] === undefined) {
      return undefined;
    }

    let value = this._components[id]!;
    if (isLinkedComponent(value)) {
      const list = this.getLinkedComponentList(componentClassOrTag)!;
      while (!list.isEmpty) {
        this.withdraw(componentClassOrTag);
      }
    } else {
      delete this._components[id];
      this.dispatchOnComponentRemoved(value, componentClassOrTag);
    }

    return value as T;
  }

  /**
   * Removes a tag from the entity.
   *  In case if the component tag is present - then {@link onComponentRemoved} will be
   *  dispatched after removing it from the entity
   *
   * @param {Tag} tag Specific tag
   * @returns {void}
   */
  public removeTag(tag: Tag): void {
    beforeChange();
    if (this._tags !== undefined && this._tags.has(tag)) {
      this._tags.delete(tag);
      this.dispatchOnComponentRemoved(tag);
    }
  }

  /**
   * Removes all components and tags from entity.
   *
   * It's done silently: {@link onComponentRemoved} is not dispatched, and queries are not updated. Remove the entity
   * from the engine before clearing it.
   */
  public clear(): void {
    beforeChange();
    this._components = [];
    this._linkedComponents = undefined;
    this._tags?.clear();
  }

  /**
   * Copies content from entity to itself.
   * Linked components structure will be copied by the link, because we can't duplicate linked list order without
   * cloning components itself. So modifying linked components in the copy will affect linked components in copy
   * source.
   *
   * @param {Entity} entity
   * @return {this}
   */
  public copyFrom(entity: Entity): this {
    this._components = entity._components.slice();
    this._linkedComponents = entity._linkedComponents === undefined ? undefined : Object.assign({}, entity._linkedComponents);
    this._tags = entity._tags === undefined ? undefined : new Set(entity._tags);
    return this;
  }

  /**
   * Iterates over instances of linked component appended to the Entity and performs the action over each.<br>
   * Works for standard components too: the action is called for the single instance.
   *
   * @param {Class<T>} componentClass Component`s class
   * @param {(component: T) => void} action Action to perform over every component instance.
   * @example
   * ```ts
   * class Boon extends LinkedComponent {
   *   public constructor(
   *     public type: BoonType,
   *     public duration: number
   *   ) { super(); }
   * }
   * const entity = new Entity()
   *   .append(new Boon(BoonType.HEAL, 2))
   *   .append(new Boon(BoonType.PROTECTION, 3));
   *
   * // Let's decrease every boon duration and remove them if they are expired.
   * entity.iterate(Boon, (boon) => {
   *   if (--boon.duration <= 0) {
   *      entity.pick(boon);
   *   }
   * });
   * ```
   */
  public iterate<T>(componentClass: Class<T>, action: (component: T) => void): void {
    const id = getComponentId(componentClass, false);
    if (id === undefined) return;
    const component = this._components[id];
    if (component === undefined) return;
    const list = this.getLinkedComponentList(id, false);
    if (list !== undefined) {
      list.iterate(action);
    } else {
      action(component as T);
    }
  }

  /**
   * Returns generator with all instances of specified linked component class.
   * Works for standard components too: the generator yields the single instance.
   *
   * @param {Class<T>} componentClass Component`s class
   * @example
   * ```ts
   * for (const damage of entity.getAll(Damage)) {
   *   if (damage.value < 0) {
   *     throw new Error('Damage value can\'t be less than zero');
   *   }
   * }
   * ```
   */
  public* getAll<T>(componentClass: Class<T>): Generator<T, void, T | undefined> {
    const id = getComponentId(componentClass, false);
    if (id === undefined) return;
    const component = this._components[id];
    if (component === undefined) return;
    const list = this.getLinkedComponentList(id, false);
    if (list !== undefined) {
      yield* list.nodes();
    } else {
      yield component as T;
    }
  }

  /**
   * Searches a component instance of specified linked component class.
   * Works for standard components too: the predicate is called for the single instance.
   *
   * @param {Class<T>} componentClass
   * @param {(component: T) => boolean} predicate
   * @return {T | undefined}
   */
  public find<T>(componentClass: Class<T>, predicate: (component: T) => boolean): T | undefined {
    const componentIdToFind = getComponentId(componentClass, false);
    if (componentIdToFind === undefined) return undefined;
    const component = this._components[componentIdToFind];
    if (component === undefined) return undefined;
    if (isLinkedComponent(component)) {
      let linkedComponent: ILinkedComponent | undefined = component;
      while (linkedComponent !== undefined) {
        if (predicate(linkedComponent as T)) return linkedComponent as T;
        linkedComponent = linkedComponent.next;
      }
    } else return predicate(component as T) ? component as T : undefined;
  }

  /**
   * Returns number of components of specified class.
   *
   * @param {Class<T>} componentClass
   * @return {number}
   */
  public lengthOf<T>(componentClass: Class<T>): number {
    let result = 0;
    this.iterate(componentClass, () => {
      result++;
    });
    return result;
  }

  /**
   * Use this method to dispatch that entity component properties were changed, in case if
   * queries predicates are depends on them.
   * Components properties are not tracking by Engine itself, because it's too expensive.
   */
  public invalidate(): void {
    const observer = this._observer;
    if (observer !== undefined) {
      observer.entityInvalidated(this);
      const extra = this._extraObservers;
      if (extra !== undefined) {
        for (let i = 0; i < extra.length; i++) extra[i].entityInvalidated(this);
      }
    }
    const signal = this._onInvalidationRequested;
    if (signal !== undefined && signal.hasHandlers) {
      signal.emit(this);
    }
  }

  /**
   * @internal
   */
  public addObserver(observer: EntityObserver): void {
    if (this._observer === undefined) {
      this._observer = observer;
    } else if (this._observer !== observer) {
      if (this._extraObservers === undefined) {
        this._extraObservers = [observer];
      } else if (this._extraObservers.indexOf(observer) === -1) {
        this._extraObservers.push(observer);
      }
    }
  }

  /**
   * @internal
   * Gets position of the entity in the query, or -1 if the entity doesn't belong to the query
   */
  public getQuerySlot(query: object): number {
    const slots = this._querySlots;
    if (slots === undefined) return -1;
    for (let i = 0; i < slots.length; i += 2) {
      if (slots[i] === query) return slots[i + 1] as number;
    }
    return -1;
  }

  /**
   * @internal
   * Sets position of the entity in the query
   */
  public setQuerySlot(query: object, slot: number): void {
    const slots = this._querySlots;
    if (slots === undefined) {
      // Array literal is allocated with exact capacity, while push to an empty array reserves space for 17 elements
      this._querySlots = [query, slot];
      return;
    }
    for (let i = 0; i < slots.length; i += 2) {
      if (slots[i] === query) {
        slots[i + 1] = slot;
        return;
      }
    }
    // Concatenation allocates exact capacity, while push reserves space for 16 more elements
    this._querySlots = slots.length === 0 ? [query, slot] : slots.concat(query, slot);
  }

  /**
   * @internal
   * Forgets position of the entity in the query
   */
  public deleteQuerySlot(query: object): void {
    const slots = this._querySlots;
    if (slots === undefined) return;
    for (let i = 0; i < slots.length; i += 2) {
      if (slots[i] === query) {
        // Move the last pair to the place of the removed one
        const last = slots.length - 2;
        slots[i] = slots[last];
        slots[i + 1] = slots[last + 1];
        slots.length = last;
        return;
      }
    }
  }

  /**
   * @internal
   */
  public removeObserver(observer: EntityObserver): void {
    const extra = this._extraObservers;
    if (this._observer === observer) {
      this._observer = extra?.shift();
    } else if (extra !== undefined) {
      const index = extra.indexOf(observer);
      if (index !== -1) extra.splice(index, 1);
    }
    if (extra !== undefined && extra.length === 0) this._extraObservers = undefined;
  }

  /**
   * @internal
   * @param {EntitySnapshot} result
   * @param {T} changedComponentOrTag
   * @param {Class<T>} resolveClass
   */
  public takeSnapshot<T>(result: EntitySnapshot, changedComponentOrTag?: T, resolveClass?: Class<T>): void {
    result.reset(this, changedComponentOrTag, resolveClass);
  }

  /**
   * @internal
   * Restores the state of the entity before the change of the component or tag into the `previous` entity
   */
  public restorePreviousState(previous: Entity, changedComponentOrTag?: unknown, resolveClass?: Class<unknown>): void {
    previous.copyFrom(this);
    if (changedComponentOrTag === undefined) {
      return;
    }

    if (isTag(changedComponentOrTag)) {
      const previousTags = previous._tags ??= new Set();
      if (this.has(changedComponentOrTag)) {
        previousTags.delete(changedComponentOrTag);
      } else {
        previousTags.add(changedComponentOrTag);
      }
    } else {
      const componentClass = resolveClass ?? Object.getPrototypeOf(changedComponentOrTag).constructor;
      const componentId = getComponentId(componentClass!, true)!;
      const previousComponents = previous._components;
      if (this.has(componentClass)) {
        delete previousComponents[componentId];
      } else {
        previousComponents[componentId] = changedComponentOrTag;
      }
    }
  }

  /**
   * @internal
   */
  public getLinkedComponentList(componentClassOrId: number | Class<any>, createIfNotExists = true): LinkedComponentList<any> | undefined {
    if (typeof componentClassOrId !== 'number') {
      componentClassOrId = getComponentId(componentClassOrId)!;
    }
    const linkedComponents = this._linkedComponents;
    if (linkedComponents !== undefined && linkedComponents[componentClassOrId] !== undefined || !createIfNotExists) {
      return linkedComponents?.[componentClassOrId];
    }
    return (this._linkedComponents ??= {})[componentClassOrId] = new LinkedComponentList<ILinkedComponent>();
  }

  private withdrawComponent<T extends K, K extends ILinkedComponent>(component: NonNullable<T>, resolveClass?: Class<K>): T | undefined {
    beforeChange();
    const componentClass = getComponentClass(component, resolveClass);
    const componentList = this.getLinkedComponentList(componentClass, false);
    if (!this.hasComponent(componentClass) || componentList === undefined) return undefined;
    const result = componentList.remove(component) ? component : undefined;
    const componentId = getComponentId(componentClass, true)!;
    if (componentList.isEmpty) {
      delete this._components[componentId];
      delete this._linkedComponents![componentId];
    } else {
      this.setComponentValue(componentId, componentList.head);
    }
    if (result !== undefined) {
      this.dispatchOnComponentRemoved(result, componentClass);
    }
    return result;
  }

  /**
   * Stores the component by its id. If the id is out of the storage, the storage is reallocated with exact length,
   * because growing an array by assignment reserves much more space than needed.
   */
  private setComponentValue(id: number, value: unknown): void {
    const components = this._components;
    if (id < components.length) {
      components[id] = value;
      return;
    }
    const grown = new Array(id + 1);
    for (let i = 0; i < components.length; i++) {
      if (i in components) grown[i] = components[i];
    }
    grown[id] = value;
    this._components = grown;
  }

  private dispatchOnComponentAdded<T>(component: NonNullable<T>, componentClass?: Class<any>): void {
    const signal = this._onComponentAdded;
    if (signal !== undefined && signal.hasHandlers) {
      signal.emit(this, component, componentClass);
    }
    const observer = this._observer;
    if (observer !== undefined) {
      observer.entityComponentAdded(this, component, componentClass);
      const extra = this._extraObservers;
      if (extra !== undefined) {
        for (let i = 0; i < extra.length; i++) extra[i].entityComponentAdded(this, component, componentClass);
      }
    }
  }

  private dispatchOnComponentRemoved<T>(value: NonNullable<T>, componentClass?: Class<any>): void {
    const signal = this._onComponentRemoved;
    if (signal !== undefined && signal.hasHandlers) {
      signal.emit(this, value, componentClass);
    }
    const observer = this._observer;
    if (observer !== undefined) {
      observer.entityComponentRemoved(this, value, componentClass);
      const extra = this._extraObservers;
      if (extra !== undefined) {
        for (let i = 0; i < extra.length; i++) extra[i].entityComponentRemoved(this, value, componentClass);
      }
    }
  }
}

/**
 * EntitySnapshot is a content container that displays the difference between the current state of Entity and its
 * previous state.
 *
 * The {@link EntitySnapshot.current} property always reflects the current state, and {@link EntitySnapshot.previous} -
 * previous one. So you can understand which components have been added and which have been removed.
 *
 * <p>It is important to note that changes in the data of the same entity components will not be reflected in the
 * snapshot, even if a manual invalidation of the entity has been triggered.</p>
 */
export class EntitySnapshot {
  private _current?: Entity;
  private readonly _previous: Entity = new Entity();
  private _changed?: unknown;
  private _changedClass?: Class<unknown>;
  private _isPreviousRestored: boolean = true;

  /**
   * Gets an instance of the actual entity
   * @returns {Entity}
   */
  public get current(): Entity {
    return this._current!;
  }

  /**
   * @internal
   */
  public set current(value: Entity) {
    this.reset(value);
  }

  /**
   * Gets an instance of the previous state of entity.
   * It's restored lazily on the first access, so it costs nothing if handler doesn't use it.
   * Snapshots are reused by queries, so don't keep them after the handler has returned: when it's accessed later,
   * it reflects the state of the entity at the moment of access.
   */
  public get previous(): ReadonlyEntity {
    this.restore();
    return this._previous;
  }

  /**
   * @internal
   */
  public reset(current: Entity, changed?: unknown, changedClass?: Class<unknown>): void {
    this._current = current;
    this._changed = changed;
    this._changedClass = changedClass;
    this._isPreviousRestored = false;
  }

  /**
   * @internal
   */
  public restore(): void {
    if (this._isPreviousRestored) return;
    this._isPreviousRestored = true;
    this._current!.restorePreviousState(this._previous, this._changed, this._changedClass);
  }

  /**
   * @internal
   * Invokes `emit` while the snapshot is dispatched to handlers.
   * If any entity is changed during dispatching, previous state is restored before the change.
   */
  public dispatch(emit: (snapshot: EntitySnapshot) => void): void {
    dispatchedSnapshots.push(this);
    try {
      emit(this);
    } finally {
      dispatchedSnapshots.pop();
    }
  }
}

// Snapshots that are being dispatched right now. Stack, because dispatching can be nested.
const dispatchedSnapshots: EntitySnapshot[] = [];

function beforeChange(): void {
  if (dispatchedSnapshots.length === 0) return;
  for (let i = 0; i < dispatchedSnapshots.length; i++) {
    dispatchedSnapshots[i].restore();
  }
}

/**
 * @internal
 * Observer that is notified after entity signal handlers. Used by Engine to track entity changes.
 */
export interface EntityObserver {
  entityComponentAdded(entity: Entity, componentOrTag: unknown, componentClass?: Class<any>): void;

  entityComponentRemoved(entity: Entity, componentOrTag: unknown, componentClass?: Class<any>): void;

  entityInvalidated(entity: Entity): void;
}

/**
 * Component update handler type.
 * @see {@link Entity.onComponentAdded}
 * @see {@link Entity.onComponentRemoved}
 */
export type ComponentUpdateHandler = <T>(entity: Entity, component: NonNullable<T>, componentClass?: Class<NonNullable<T>>) => void;

/**
 * Entity ids enumerator
 */
let entityId: number = 1;
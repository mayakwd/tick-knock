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
   * @see getComponentId
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
   * entity
   *   .append(new Boon(BoonType.PROTECTION));
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
   * Works and for standard components (action will be called for a single instance in this case).
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
   *   .append(new Boon(BoonType.PROTECTION, 3);
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
   * Returns generator with all instances of specified linked component class
   *
   * @param {Class<T>} componentClass Component`s class
   * @example
   * ```ts
   * for (const damage of entity.linkedComponents(Damage)) {
   *   if (damage.value < 0) {
   *   throw new Error('Damage value can't be less than zero');
   * }
   * ```
   */
  getAll<T>(componentClass: Class<T>): Generator<T, void, T>;

  /**
   * Searches a component instance of specified linked component class.
   * Works and for standard components (predicate will be called for a single instance in this case).
   *
   * @param {Class<T>} componentClass
   * @param {(component: T) => boolean} predicate
   * @return {T | undefined}
   */
  find<T>(componentClass: Class<T>, predicate: (component: T) => boolean): T | undefined;

  /**
   * Returns number of components of specified class.
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
  public readonly onComponentAdded: Signal<ComponentUpdateHandler> = new Signal();
  /**
   * The signal dispatches if component was removed from the entity. Works for every linked component as well.
   */
  public readonly onComponentRemoved: Signal<ComponentUpdateHandler> = new Signal();
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
  public readonly onInvalidationRequested: Signal<(entity: Entity) => void> = new Signal();

  /**
   * Unique id identifier
   */
  public readonly id = entityId++;

  private _components: Record<number, unknown> = {};
  private _linkedComponents: Record<number, LinkedComponentList<ILinkedComponent>> = {};
  private _tags: Set<Tag> = new Set();

  /**
   * Returns components map, where key is component identifier, and value is a component itself
   * @see {@link getComponentId}, {@link Entity.getComponents}
   */
  public get components(): Readonly<Record<number, unknown>> {
    return this._components;
  }

  /**
   * Returns set of tags applied to the entity
   * @see getComponentId
   */
  public get tags(): ReadonlySet<Tag> {
    return this._tags;
  }

  /**
   * Adds a component or tag to the entity.
   * It's a unified shorthand for {@link addComponent} and {@link addTag}.
   *
   * - If a component of the same type already exists in entity, it will be replaced by the passed one (only if
   *  component itself is not the same, in this case - no actions will be done).
   * - If the tag is already present in the entity - no actions will be done.
   * - During components replacement {@link onComponentRemoved} and {@link onComponentAdded} are will be triggered
   *  sequentially.
   * - If there is no component of the same type, or the tag is not present in the entity - then only
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
   * const damage = new Damage();
   * const entity = new Entity()
   *  .append(new Damage(1))
   *  .append(new Damage(2))
   *
   *  const damage = entity.get(Damage);
   *  while (entity.has(Damage)) {
   *    const entity = entity.withdraw(Damage);
   *    print(damage.value);
   *  }
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
    if (component !== undefined) {
      return this.withdrawComponent(component as NonNullable<T>, componentClass);
    }
    return undefined;
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
      const component = this.find<T>(componentOrResolveClass as Class<T>, (component) => (component as ILinkedComponent).id === resolveClassOrId);
      if (component !== undefined) {
        return this.withdrawComponent(component as NonNullable<T>, componentOrResolveClass as Class<T>);
      }
      return undefined;
    }
    return this.withdrawComponent(componentOrResolveClass as NonNullable<T>, resolveClassOrId);
  }

  /**
   * Adds a component to the entity.
   *
   * - If a component of the same type already exists in entity, it will be replaced by the passed one (only if
   *  component itself is not the same, in this case - no actions will be done).
   * - During components replacement {@link onComponentRemoved} and {@link onComponentAdded} are will be triggered
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
  public addComponent<T extends K, K extends unknown>(component: NonNullable<T>, resolveClass?: Class<K>): void {
    const componentClass = getComponentClass(component, resolveClass);
    const id = getComponentId(componentClass, true)!;
    const linkedComponent = isLinkedComponent(component);
    if (this._components[id] !== undefined) {
      if (!linkedComponent && component === this._components[id]) {
        return;
      }
      this.remove(componentClass);
    }
    if (linkedComponent) {
      this.append(component as ILinkedComponent, resolveClass as Class<ILinkedComponent>);
    } else {
      this._components[id] = component;
      this.dispatchOnComponentAdded(component);
    }
  }

  /**
   * Appends a linked component to the entity.
   *
   * - If linked component is not exists, then it will be added via `addComponent` method and {@link onComponentAdded}
   * will be triggered.
   * - If component already exists in the entity, then passed one will be appended to the tail. {@link
    * onComponentAdded} wont be triggered.
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
   * const damage = new Damage();
   * const entity = new Entity()
   *  .append(new Damage())
   *  .append(new Damage())
   *
   *  const damage = entity.get(Damage);
   *  while (damage !== undefined) {
   *    print(damage.value);
   *    damage = damage.next;
   *  }
   * ```
   */
  public appendComponent<T extends K, K extends ILinkedComponent>(component: NonNullable<T>, resolveClass?: Class<K>): Entity {
    const componentClass = getComponentClass(component, resolveClass);
    const componentId = getComponentId(componentClass, true)!;
    const componentList = this.getLinkedComponentList(componentId)!;
    componentList.add(component);
    if (this._components[componentId] === undefined) {
      this._components[componentId] = componentList.head;
    }
    this.dispatchOnComponentAdded(component);
    return this;
  }

  /**
   * Adds a tag to the entity.
   *
   * - If the tag is already present in the entity - no actions will be done.
   * - If there is such tag in the entity then {@link onComponentAdded} will be triggered.
   *
   * @param {Tag} tag Tag
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link add}, {@link addComponent}
   * @example
   * ```ts
   * const DEVELOPER = "developer;
   * const EXHAUSTED = 2;
   * const  = "game-over";
   * const entity = new Entity()
   *  .addTag(DEVELOPER)
   *  .add(EXHAUSTED)
   * ```
   */
  public addTag(tag: Tag): void {
    if (!this._tags.has(tag)) {
      this._tags.add(tag);
      this.dispatchOnComponentAdded(tag);
    }
  }

  /**
   * Returns componentClassOrTag indicating whether entity has a specific component or tag
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
   * entity
   *   .append(new Boon(BoonType.PROTECTION));
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
    return this._tags.has(tag);
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
    return Array.from(this._tags);
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
   * @param componentClassOrTag Specific component class
   * @returns Component instance or `undefined` if it doesn't exists in the entity
   */
  public removeComponent<T>(componentClassOrTag: Class<T>): T | undefined {
    const id = getComponentId(componentClassOrTag);
    if (id === undefined || this._components[id] === undefined) {
      return undefined;
    }

    let value = this._components[id];
    if (isLinkedComponent(value)) {
      const list = this.getLinkedComponentList(componentClassOrTag)!;
      while (!list.isEmpty) {
        this.withdraw(componentClassOrTag);
      }
    } else {
      delete this._components[id];
      this.dispatchOnComponentRemoved(value);
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
    if (this._tags.has(tag)) {
      this._tags.delete(tag);
      this.dispatchOnComponentRemoved(tag);
    }
  }

  /**
   * Removes all components and tags from entity
   */
  public clear(): void {
    this._components = {};
    this._linkedComponents = {};
    this._tags.clear();
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
    this._components = Object.assign({}, entity._components);
    this._linkedComponents = Object.assign({}, entity._linkedComponents);
    this._tags = new Set(entity._tags);
    return this;
  }

  /**
   * Iterates over instances of linked component appended to the Entity and performs the action over each.<br>
   * Works and for standard components (action will be called for a single instance in this case).
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
   *   .append(new Boon(BoonType.PROTECTION, 3);
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
    if (!this.hasComponent(componentClass)) return;
    this.getLinkedComponentList(componentClass)?.iterate(action);
  }

  /**
   * Returns generator with all instances of specified linked component class
   *
   * @param {Class<T>} componentClass Component`s class
   * @example
   * ```ts
   * for (const damage of entity.linkedComponents(Damage)) {
   *   if (damage.value < 0) {
   *   throw new Error('Damage value can't be less than zero');
   * }
   * ```
   */
  public* getAll<T>(componentClass: Class<T>): Generator<T, void, T | undefined> {
    if (!this.hasComponent(componentClass)) return;
    const list = this.getLinkedComponentList(componentClass, false);
    if (list === undefined) return undefined;
    yield* list.nodes();
  }

  /**
   * Searches a component instance of specified linked component class.
   * Works and for standard components (predicate will be called for a single instance in this case).
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
    this.onInvalidationRequested.emit(this);
  }

  /**
   * @internal
   * @param {EntitySnapshot} result
   * @param {T} changedComponentOrTag
   * @param {Class<T>} resolveClass
   */
  public takeSnapshot<T>(result: EntitySnapshot, changedComponentOrTag?: T, resolveClass?: Class<T>): void {
    const previousState = result.previous as Entity;
    if (result.current !== this) {
      result.current = this;
      previousState.copyFrom(this);
    }

    if (changedComponentOrTag === undefined) {
      return;
    }

    if (isTag(changedComponentOrTag)) {
      const previousTags = previousState._tags;
      if (this.has(changedComponentOrTag)) {
        previousTags.delete(changedComponentOrTag);
      } else {
        previousTags.add(changedComponentOrTag);
      }
    } else {
      const componentClass = resolveClass ?? Object.getPrototypeOf(changedComponentOrTag).constructor;
      const componentId = getComponentId(componentClass!, true)!;
      const previousComponents = previousState._components;
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
    if (this._linkedComponents[componentClassOrId] !== undefined || !createIfNotExists) {
      return this._linkedComponents[componentClassOrId];
    } else {
      return this._linkedComponents[componentClassOrId] = new LinkedComponentList<ILinkedComponent>();
    }
  }

  private withdrawComponent<T extends K, K extends ILinkedComponent>(component: NonNullable<T>, resolveClass?: Class<K>): T | undefined {
    const componentClass = getComponentClass(component, resolveClass);
    if (!isLinkedComponent(component)) {
      return this.remove(componentClass);
    }
    const componentList = this.getLinkedComponentList(componentClass, false);
    if (!this.hasComponent(componentClass) || componentList === undefined) return undefined;
    const result = componentList.remove(component) ? component : undefined;
    const componentId = getComponentId(componentClass, true)!;
    if (componentList.isEmpty) {
      delete this._components[componentId];
      delete this._linkedComponents[componentId];
    } else {
      this._components[componentId] = componentList.head;
    }
    if (result !== undefined) {
      this.dispatchOnComponentRemoved(result);
    }
    return result;
  }

  private dispatchOnComponentAdded<T>(component: NonNullable<T>): void {
    if (this.onComponentAdded.hasHandlers) {
      this.onComponentAdded.emit(this, component);
    }
  }

  private dispatchOnComponentRemoved<T>(value: NonNullable<T>): void {
    if (this.onComponentRemoved.hasHandlers) {
      this.onComponentRemoved.emit(this, value);
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
  private _previous: ReadonlyEntity = new Entity();

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
    this._current = value;
  }

  /**
   * Gets an instance of the previous state of entity
   */
  public get previous(): ReadonlyEntity {
    return this._previous;
  }
}

/**
 * Component update handler type.
 * @see {@link Entity.onComponentAdded}
 * @see {@link Entity.onComponentRemoved}
 */
export type ComponentUpdateHandler = (entity: Entity, componentOrTag: unknown, componentClass?: Class<unknown>) => void;

/**
 * Entity ids enumerator
 */
let entityId: number = 1;

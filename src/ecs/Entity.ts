import {getComponentId} from './ComponentId';
import {Signal} from 'typed-signals';
import {Class} from '../utils/Class';
import {isTag, Tag} from './Tag';
import {ILinkedComponent} from './LinkedComponent';

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
export class Entity {
  /**
   * The signal dispatches if new component or tag was added to the entity
   */
  public readonly onComponentAdded: Signal<ComponentUpdateHandler> = new Signal();
  /**
   * The signal dispatches if component was removed from the entity
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

  private _components: Map<number, unknown> = new Map();
  private _tags: Set<Tag> = new Set();

  /**
   * Returns components map, where key is component identifier, and value is a component itself
   * @see {@link getComponentId}, {@link Entity.getComponents}
   */
  public get components(): Readonly<Map<number, unknown>> {
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
   *   {@link onComponentAdded} will be triggered.
   *
   * @throws Throws error if component is null or undefined, or if component is not an instance of the class as well
   * @param {T | Tag} componentOrTag Component instance or Tag
   * @param {K} resolveClass Class that should be used as resolving class.
   *  Passed class always should be an ancestor of Component's class.
   *  It has sense only if component instance is passed, but not the Tag.
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link addComponent}, {@link addTag}
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
   * - If linked component is not exists, then it will be added via `addComponent` method and {@link onComponentAdded}
   * will be triggered.
   * - If component already exists in the entity, then passed one will be appended to the tail. {@link
    * onComponentAdded} wont be triggered.
   *
   * It's a shorthand to {@link appendComponent}
   *
   * @throws Throws error if component is null or undefined, or if component is not an instance of the class as well
   * @param {T | Tag} component ILinkedComponent instance
   * @param {K} resolveClass Class that should be used as resolving class.
   *  Passed class always should be an ancestor of Component's class.
   *  It has sense only if component instance is passed, but not the Tag.
   * @returns {Entity} Reference to the entity itself. It helps to build chain of calls.
   * @see {@link addComponent}
   * @see {@link appendComponent}
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
  public append<T extends K, K extends ILinkedComponent>(component: NonNullable<T>, resolveClass?: Class<K>): Entity {
    return this.appendComponent(component, resolveClass);
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
    let componentClass = Object.getPrototypeOf(component).constructor as Class<T>;
    if (resolveClass) {
      if (!(component instanceof resolveClass && componentClass != resolveClass)) {
        throw new Error('Resolve class should be an ancestor of component class');
      }
      componentClass = resolveClass as Class<T>;
    }

    const id = getComponentId(componentClass, true)!;
    if (this._components.has(id)) {
      if (component === this._components.get(id)) {
        return;
      }
      this.remove(componentClass);
    }
    this._components.set(id, component);
    this.onComponentAdded.emit(this, component);
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
   *  It has sense only if component instance is passed, but not the Tag.
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
    let componentClass = Object.getPrototypeOf(component).constructor as Class<T>;
    if (resolveClass) {
      if (!(component instanceof resolveClass && componentClass != resolveClass)) {
        throw new Error('Resolve class should be an ancestor of component class');
      }
      componentClass = resolveClass as Class<T>;
    }
    if (this.hasComponent(componentClass)) {
      let existingComponent: ILinkedComponent = this.get(componentClass)!;
      while (existingComponent !== component && existingComponent.next !== undefined) {
        existingComponent = existingComponent.next;
      }
      if (existingComponent === component) {
        throw new Error('Component is already appended, appending it once again will break linked items order');
      }
      existingComponent.next = component;
    } else {
      this.addComponent(component, resolveClass);
    }
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
      this.onComponentAdded.emit(this, tag);
    }
  }

  /**
   * Returns value indicating whether entity has a specific component or tag
   *
   * @param componentClassOrTag
   * @example
   * ```ts
   * const BERSERK = 10091;
   * if (!entity.has(Immobile) || entity.has(BERSERK)) {
   *   const position = entity.get(Position)!;
   *   position.x += 1;
   * }
   * ```
   */
  public has<T>(componentClassOrTag: Class<T> | Tag): boolean {
    if (isTag(componentClassOrTag)) {
      return this.hasTag(componentClassOrTag);
    }
    return this.hasComponent(componentClassOrTag);
  }

  /**
   * Returns value indicating whether entity has a specific component
   *
   * @param component
   * @example
   * ```
   * if (!entity.hasComponent(Immobile)) {
   *   const position = entity.get(Position)!;
   *   position.x += 1;
   * }
   * ```
   */
  public hasComponent<T>(component: Class<T>): boolean {
    const id = getComponentId(component);
    if (id === undefined) return false;
    return this._components.has(id);
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
   */
  public get<T>(componentClass: Class<T>): T | undefined {
    const id = getComponentId(componentClass);
    if (id === undefined) return undefined;
    return this._components.get(id) as T;
  }

  /**
   * Returns an array of entity components
   *
   * @returns {unknown[]}
   */
  public getComponents(): unknown[] {
    return Array.from(this._components.values());
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
   *  dispatched after removing it from the entity
   *
   * @param componentClassOrTag Specific component class or tag
   * @returns Component instance or `undefined` if it doesn't exists in the entity, or tag was removed
   */
  public remove<T>(componentClassOrTag: Class<T> | Tag): T | undefined {
    if (isTag(componentClassOrTag)) {
      this.removeTag(componentClassOrTag);
      return undefined;
    }
    return this.removeComponent(componentClassOrTag);
  }

  public removeComponent<T>(componentClassOrTag: Class<T>): T | undefined {
    const id = getComponentId(componentClassOrTag);
    if (id === undefined || !this._components.has(id)) {
      return undefined;
    }

    const value = this._components.get(id);
    this._components.delete(id);
    this.onComponentRemoved.emit(this, value);

    return value as T;
  }

  public removeTag(componentClassOrTag: Tag): void {
    if (this._tags.has(componentClassOrTag)) {
      this._tags.delete(componentClassOrTag);
      this.onComponentRemoved.emit(this, componentClassOrTag);
    }
  }

  /**
   * Removes all components and tags from entity
   */
  public clear(): void {
    this._components.clear();
    this._tags.clear();
  }

  public copyFrom(entity: Entity) {
    this._components = new Map(entity._components);
  }

  /**
   * Use this method to dispatch that entity component properties were changed, in case if
   * queries predicates are depends on them.
   * Components properties are not tracking by Engine itself, because it's too expensive.
   */
  public invalidate(): void {
    this.onInvalidationRequested.emit(this);
  }
}

/**
 * EntitySnapshot is a content container that displays the difference between the current state of Entity and its
 * previous state. The {@link EntitySnapshot.entity} property always reflects the current state, but
 * {@link EntitySnapshot.get} and {@link EntitySnapshot.has} methods are display the previous state.
 * So you can understand which components have been added and which have been removed.
 *
 * <p>It is important to note that changes in the data of the same entity components will not be reflected in the
 * snapshot, even if a manual invalidation of the entity has been triggered.</p>
 */
export class EntitySnapshot {
  private _entity?: Entity;
  private _components?: Map<number, unknown>;
  private _tags?: Set<Tag>;

  /**
   * Gets an instance of the actual entity
   * @returns {Entity}
   */
  public get entity(): Entity {
    return this._entity!;
  }

  /**
   * Takes a snapshot that reflects the difference between current state and updated components or tags.
   *
   * @param {Entity} entity - Entity instance that must be taken as a snapshot source
   * @param updatedComponentsOrTags - Set of components that was in the previous state of entity
   */
  public takeSnapshot(entity: Entity, ...updatedComponentsOrTags: unknown[]) {
    this._entity = entity;
    this._components = new Map<number, unknown>(entity.components.entries());
    this._tags = new Set<Tag>(entity.tags);
    for (const componentOrTag of updatedComponentsOrTags) {
      if (isTag(componentOrTag)) {
        if (entity.has(componentOrTag)) {
          this._tags.delete(componentOrTag);
        } else {
          this._tags.add(componentOrTag);
        }
      } else {
        const componentClass = Object.getPrototypeOf(componentOrTag).constructor;
        const componentId = getComponentId(componentClass, true)!;
        if (entity.has(componentClass)) {
          this._components.delete(componentId);
        } else {
          this._components.set(componentId, componentOrTag);
        }
      }
    }
  }

  /**
   * Gets a component from previous state of the entity
   *
   * @param {Class<T>} component
   * @returns {T | undefined}
   */
  public get<T>(component: Class<T>): T | undefined {
    if (!this._components) {
      return undefined;
    }

    const id = getComponentId(component);
    if (id === undefined) {
      return undefined;
    }
    return this._components.get(id) as T;
  }

  /**
   * Check that component or tag exists in the previous state of the entity.
   *
   * @param {Class<T> | Tag} componentClassOrTag
   * @returns {boolean}
   */
  public has<T>(componentClassOrTag: Class<T> | Tag): boolean {
    if (isTag(componentClassOrTag)) {
      return this._tags?.has(componentClassOrTag) === true;
    }

    const componentId = getComponentId(componentClassOrTag);
    return componentId !== undefined
      && this._components !== undefined
      && this._components.has(componentId);
  }
}

/**
 * Component update handler type.
 * @see {@link Entity.onComponentAdded}
 * @see {@link Entity.onComponentRemoved}
 */
export type ComponentUpdateHandler = (entity: Entity, componentOrTag: unknown) => void;

/**
 * Entity ids enumerator
 */
let entityId: number = 1;

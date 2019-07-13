import {getComponentId} from './ComponentId';
import {Signal} from 'typed-signals';
import {Class} from '../utils/Class';

/**
 * Represents an entity - "faceless" object, which only have a `id`.
 * It can contain components, which are adding characteristics to the entity.
 * It could be position, view representation, speed, etc.
 *
 * @example
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
 * const entity = new Entity().add(new Position(10, 5));
 */
export class Entity {
  /**
   * Signal dispatches if new component were added to entity
   */
  public readonly onComponentAdded: Signal<ComponentUpdateHandler> = new Signal();
  /**
   * Signal dispatches if component were removed from entity
   */
  public readonly onComponentRemoved: Signal<ComponentUpdateHandler> = new Signal();

  /**
   * Unique identifier
   */
  public readonly id = entityId++;

  private _components: Map<number, any> = new Map();

  /**
   * Returns components map, where key is component identifier, and value is a component itself
   * @see getComponentId
   */
  public get components(): Readonly<Map<number, any>> {
    return this._components;
  }

  /**
   * Adds component to entity.
   *
   * If component of the same type is already exists in the entity, it will be replaced with the passed one.
   * {@link onComponentRemoved} and {@link onComponentAdded} will be triggered in sequence.
   * If there is no component of the same type, only {@link onComponentAdded} will be triggered.
   *
   * @throws Throws error if component is null or undefined, or if component is not an instance of the class as well
   * @param {T} component Component instance
   * @param {K} resolveClass Class that should be used as resolving class.
   *  Passed class always should be an ancestor of Component's class.
   * @returns {Entity} Reference to the same entity. This helps to construct chain calls
   * @example
   * const entity = new Entity()
   *  .add(new Position())
   *  .add(new View())
   *  .add(new Velocity());
   */
  public add<T extends K, K extends any>(component: T, resolveClass?: Class<K>): Entity {
    let componentClass = component.constructor;
    if (!component || !componentClass) {
      throw new Error(
        'Component instance mustn\'t be null and must be an instance of the class',
      );
    }

    if (resolveClass) {
      if (!(component instanceof resolveClass && componentClass != resolveClass)) {
        throw new Error('Resolve class should be an ancestor of component class');
      }
      componentClass = resolveClass;
    }

    const id = getComponentId(componentClass, true)!;

    if (this._components.has(id)) {
      this.remove(componentClass);
    }

    this._components.set(id, component);
    this.onComponentAdded.emit(this, component);

    return this;
  }

  /**
   * Returns value indicating whether entity have a specific component
   *
   * @param componentClass
   * @example
   * if (!entity.has(Immobile)) {
   *   const position = entity.get(Position)!;
   *   position.x += 1;
   * }
   */
  public has<T>(componentClass: Class<T>): boolean {
    const id = getComponentId(componentClass);
    if (id === undefined) return false;
    return this._components.has(id);
  }

  /**
   * Returns value indicating whether entity have any of specified components
   *
   * @param {Class<T>} componentClass
   * @returns {boolean}
   * @example
   * if (!entity.hasAny(Destroy, Destroying)) {
   *   entity.add(new Destroy());
   * }
   */
  public hasAny<T>(...componentClass: Class<T>[]): boolean {
    return componentClass.some(value => this.has(value));
  }

  /**
   * Returns value indicating whether entity have all of specified components
   *
   * @param {Class<T>} componentClass
   * @returns {boolean}
   * @example
   * if (entity.hasAll(Position, Acceleration)) {
   *   entity.get(Position)!.y += entity.get(Acceleration)!.y * dt;
   * }
   */
  public hasAll<T>(...componentClass: Class<T>[]): boolean {
    return componentClass.every(value => this.has(value));
  }

  /**
   * Gets a component instance if it's exists in the entity, otherwise returns `undefined`
   *
   * @param componentClass Specific component class
   */
  public get<T>(componentClass: Class<T>): T | undefined {
    const id = getComponentId(componentClass);
    if (id === undefined) return undefined;
    return this._components.get(id);
  }

  /**
   * Gets all entity components
   *
   * @returns {any[]}
   */
  public getAll(): any[] {
    return Array.from(this._components.values());
  }

  /**
   * Removes component from entity.
   * Note: {@link onComponentRemoved} will be dispatched after deleting component from entity
   *
   * @param componentClass Specific component class
   * @returns Component instance or `undefined` if it doesn't exist in the entity
   */
  public remove<T>(componentClass: Class<T>): T | undefined {
    const id = getComponentId(componentClass);
    if (id === undefined || !this._components.has(id)) {
      return undefined;
    }

    const value = this._components.get(id);
    this._components.delete(id);
    this.onComponentRemoved.emit(this, value);

    return value;
  }

  /**
   * Removes all components from entity
   */
  public clear(): void {
    this._components.clear();
  }

  public copyFrom(entity: Entity) {
    this._components = new Map(entity._components);
  }
}

/**
 * Represents entity snapshot, used to detect changes of the entity
 */
export class EntitySnapshot {
  private _entity?: Entity;
  private _components?: Map<number, any>;

  public get entity(): Entity {
    return this._entity!;
  }

  public takeSnapshot(entity: Entity, ...components: any) {
    this._entity = entity;
    this._components = new Map<number, any>(entity.components.entries());
    for (const component of components) {
      const componentId = getComponentId(component.constructor, true)!;
      this._components.set(componentId, component);
    }
  }

  public get<T>(componentClass: Class<T>): T | undefined {
    if (!this._components) {
      return undefined;
    }

    const id = getComponentId(componentClass);
    if (id === undefined) {
      return undefined;
    }
    return this._components.get(id);
  }

  public has<T>(componentClass: Class<T>): boolean {
    const componentId = getComponentId(componentClass);
    return componentId !== undefined
      && this._components !== undefined
      && this._components.has(componentId);
  }
}

/**
 * Component update handler type.
 * @see Entity.onComponentAdded
 * @see Entity.onComponentRemoved
 */
export type ComponentUpdateHandler = (entity: Entity, component: any) => void;

/**
 * Entity ids enumerator
 */
let entityId: number = 1;

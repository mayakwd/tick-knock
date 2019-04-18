import {getComponentId} from "./ComponentId";
import {Signal} from "typed-signals";
import {Class} from "../utils/Class";

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

  private _components: ComponentMap = Object.create(null);

  /**
   * Returns components map, where key is component identifier, and value is a component itself
   * @see getComponentId
   */
  public get components(): Readonly<ComponentMap> {
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
   * @returns {Entity} Reference to the same entity. This helps to construct chain calls
   * @example
   * const entity = new Entity()
   *  .add(new Position())
   *  .add(new View())
   *  .add(new Velocity());
   */
  public add<T extends any>(component: T): Entity {
    if (!component || !component.constructor) {
      throw new Error(
        "Component instance mustn't be null and must be an instance of the class"
      );
    }

    const componentClass = component.constructor;
    const id = getComponentId(componentClass, true)!;

    if (this._components[id]) {
      this.remove(componentClass);
    }

    this._components[id] = component;
    this.dispatchComponentAdded(component);
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
    return !!this._components[id];
  }

  /**
   * Gets a component instance if it's exists in the entity, otherwise returns `undefined`
   *
   * @param componentClass Specific component class
   */
  public get<T>(componentClass: Class<T>): T | undefined {
    const id = getComponentId(componentClass);
    if (id === undefined) return undefined;
    return this._components[id];
  }

  /**
   * Gets all entity components
   *
   * @returns {any[]}
   */
  public getAll(): any[] {
    const result = [];
    for (let key in this._components) {
      result.push(this._components[key]);
    }
    return result;
  }

  /**
   * Removes component from entity.
   * Note: {@link onComponentRemoved} will be dispatched before(!) deleting component from entity
   *
   * @param componentClass Specific component class
   * @returns Component instance or `undefined` if it doesn't exist in the entity
   */
  public remove<T>(componentClass: Class<T>): T | undefined {
    const id = getComponentId(componentClass);
    if (id === undefined || !this._components[id]) {
      return undefined;
    }

    const value = this._components[id];
    this.dispatchComponentRemoved(value);
    delete this._components[id];

    return value;
  }

  private dispatchComponentAdded(component: any) {
    this.onComponentAdded.emit(this, component);
  }

  private dispatchComponentRemoved(component: any) {
    this.onComponentRemoved.emit(this, component);
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

/***
 * Utility components map
 */
type ComponentMap = {
  [key: string]: any;
};

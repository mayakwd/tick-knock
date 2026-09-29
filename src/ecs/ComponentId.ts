import {Class} from '../utils/Class';

/**
 * Gets an id for a component class.
 *
 * @param component Component class
 * @param createIfNotExists - If `true` then unique id for class component will be created,
 *  in case if it wasn't assigned earlier
 */
export function getComponentId<T>(
  component: Class<T>,
  createIfNotExists: boolean = false,
): number | undefined {
  const componentClass = component as ComponentClass<T>;
  // Id is stored on the class itself together with its owner. Subclasses inherit both properties,
  // so the owner check tells whether the id belongs to this exact class.
  if (componentClass[COMPONENT_CLASS_OWNER] === componentClass) {
    return componentClass[COMPONENT_CLASS_ID];
  } else if (createIfNotExists) {
    const id = componentClassId++;
    Object.defineProperty(componentClass, COMPONENT_CLASS_ID, {value: id});
    Object.defineProperty(componentClass, COMPONENT_CLASS_OWNER, {value: componentClass});
    return id;
  }
  return undefined;
}

/**
 * @internal
 * Returns a value that changes every time a component of the class is added to or removed from any entity.
 */
export function getComponentVersion(id: number): number {
  return componentVersions[id] ?? 0;
}

/**
 * @internal
 */
export function touchComponent(componentClass: Class<unknown>): void {
  const id = getComponentId(componentClass, true)!;
  componentVersions[id] = (componentVersions[id] ?? 0) + 1;
}

/**
 * @internal
 */
export function getComponentClass<T extends K, K>(component: NonNullable<T>, resolveClass?: Class<K>) {
  let componentClass = Object.getPrototypeOf(component).constructor as Class<T>;
  if (resolveClass) {
    if (!(component instanceof resolveClass || componentClass === resolveClass)) {
      throw new Error('Resolve class should be an ancestor of component class');
    }
    componentClass = resolveClass as Class<T>;
  }
  return componentClass;
}

const COMPONENT_CLASS_ID: unique symbol = Symbol('componentClassId');
const COMPONENT_CLASS_OWNER: unique symbol = Symbol('componentClassOwner');
let componentClassId: number = 1;
const componentVersions: number[] = [];

type ComponentClass<T> = Class<T> & {
  [COMPONENT_CLASS_ID]?: number;
  [COMPONENT_CLASS_OWNER]?: Class<T>;
};

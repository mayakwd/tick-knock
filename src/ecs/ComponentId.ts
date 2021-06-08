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
  if (component.hasOwnProperty(COMPONENT_CLASS_ID)) {
    return (component as ComponentId<T>)[COMPONENT_CLASS_ID];
  } else if (createIfNotExists) {
    return (component as ComponentId<T>)[COMPONENT_CLASS_ID] = componentClassId++;
  }
  return undefined;
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

let COMPONENT_CLASS_ID = '__componentClassId__';
let componentClassId: number = 1;

type ComponentId<T> = Class<T> & {
  [key: string]: number;
};


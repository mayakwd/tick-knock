import {Class} from "../utils/Class";

/**
 * Gets an id for a component class.
 *
 * @param component Component class
 * @param createIfNotExists If defined - will create unique id for class component, if it's not defined before
 */
export function getComponentId<T>(
  component: Class<T>,
  createIfNotExists: boolean = false
): number | undefined {
  const componentClass = component as ComponentId<T>;
  if (!componentClass[COMPONENT_CLASS_ID] && createIfNotExists) {
    componentClass[COMPONENT_CLASS_ID] = componentClassId++;
  }
  return componentClass[COMPONENT_CLASS_ID];
}

let COMPONENT_CLASS_ID = "__componentClassId__";
let componentClassId: number = 1;

type ComponentId<T> = {
  new(...args: any[]): T;
  [key: string]: number;
};

/**
 * Linked list interface for linked components
 * @see {@link Entity.append}
 */

export interface ILinkedComponent {
  next?: ILinkedComponent;
}

/**
 * Simple ILinkedComponent implementation
 * @see {@link Entity.append}
 */
export class LinkedComponent implements ILinkedComponent {
  public next?: this = undefined;

  public constructor() {
  }
}

/**
 * @internal
 */
export function isLinkedComponent(component: any): component is ILinkedComponent {
  return component.hasOwnProperty('next');
}

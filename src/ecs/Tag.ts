/**
 * A tag is a simple marker that can be considered as a component without data.
 * It can be used instead of creating a new component class, when you don't need an additional data.
 */
export type Tag = number | string;

/**
 * This predicate can help you to understand whether item is a component or tag
 * @param item
 * @returns {item is Tag}
 */
export function isTag(item: unknown): item is Tag {
  const type = typeof item;
  return type === 'string' || type === 'number';
}

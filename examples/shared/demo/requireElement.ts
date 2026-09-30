/**
 * Gets the element of the page by its id, and fails loudly when the page has no such element
 */
export function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`The page has no element with id "${id}"`);
  return element;
}

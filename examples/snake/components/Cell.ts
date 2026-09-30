/**
 * Cell of the grid the entity occupies. It's immutable: an entity moves by getting a new cell, so the grid, which
 * indexes entities by cells, is updated by a reaction to the change.
 */
export class Cell {
  public constructor(public readonly x: number, public readonly y: number) {}
}

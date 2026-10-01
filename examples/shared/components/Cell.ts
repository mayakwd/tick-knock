/**
 * Cell of a grid the entity is in. It's immutable: an entity moves to another cell by getting a new `Cell`, so reaction
 * systems see the previous cell removed and the next one added, and grid indexes follow the change.
 */
export class Cell {
  public constructor(public readonly column: number, public readonly row: number) {}
}

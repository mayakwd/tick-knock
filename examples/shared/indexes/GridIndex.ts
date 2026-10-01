import {Entity} from 'tick-knock';
import {Cell} from '../components/Cell';

/**
 * Entry of an index: the entity and the components systems need, so they don't look them up again
 */
export interface IndexEntry {
  readonly entity: Entity;
}

/**
 * Entries indexed by cells of a grid: a cell is an index of an array, so finding what is in a cell is a lookup, not
 * a search.
 *
 * The index doesn't change itself: an index system of the game adds an entry when an entity gets a `Cell`, and removes
 * it when the entity loses the cell or is destroyed. An entity moving to another cell gets a new `Cell`, so it's
 * removed from the previous cell and added to the next one. Cells outside the grid are not indexed.
 */
export class GridIndex<T extends IndexEntry> {
  private readonly cells: T[][];
  private occupied = 0;

  public constructor(public readonly columns: number, public readonly rows: number) {
    this.cells = Array.from({length: columns * rows}, () => []);
  }

  /**
   * Amount of cells in the grid
   */
  public get size(): number {
    return this.cells.length;
  }

  /**
   * Amount of cells that have at least one entry. It's counted when entries are added and removed, so checking
   * whether the grid is full doesn't look into every cell.
   */
  public get occupiedCells(): number {
    return this.occupied;
  }

  public isInside({column, row}: Cell): boolean {
    return column >= 0 && column < this.columns && row >= 0 && row < this.rows;
  }

  /**
   * Gets entries in the cell
   */
  public at(cell: Cell): ReadonlyArray<T> {
    return this.isInside(cell) ? this.cells[this.indexOf(cell)] : [];
  }

  /**
   * Gets the first entry in the cell, for grids that have one entry in a cell at most
   */
  public first(cell: Cell): T | undefined {
    const entries = this.at(cell);
    return entries.length > 0 ? entries[0] : undefined;
  }

  public add(cell: Cell, entry: T): void {
    if (!this.isInside(cell)) return;

    const entries = this.cells[this.indexOf(cell)];
    if (entries.length === 0) this.occupied++;
    entries.push(entry);
  }

  public remove(cell: Cell, entity: Entity): void {
    if (!this.isInside(cell)) return;

    const entries = this.cells[this.indexOf(cell)];
    const index = entries.findIndex((entry) => entry.entity === entity);
    if (index === -1) return;

    entries.splice(index, 1);
    if (entries.length === 0) this.occupied--;
  }

  /**
   * Calls the callback for every entry in the area of cells, the area is clipped by the grid
   * @param left Column of the left edge of the area, inclusive
   * @param top Row of the top edge of the area, inclusive
   * @param right Column of the right edge of the area, inclusive
   * @param bottom Row of the bottom edge of the area, inclusive
   */
  public forEachInArea(left: number, top: number, right: number, bottom: number, callback: (entry: T) => void): void {
    for (let row = Math.max(0, top); row <= Math.min(this.rows - 1, bottom); row++) {
      for (let column = Math.max(0, left); column <= Math.min(this.columns - 1, right); column++) {
        for (const entry of this.cells[row * this.columns + column]) callback(entry);
      }
    }
  }

  private indexOf({column, row}: Cell): number {
    return row * this.columns + column;
  }
}

import {Entity} from 'tick-knock';
import {isInside, Size, Vector} from '../shared/geometry';

/**
 * Entities indexed by cells of the grid: a cell is an index of an array, so finding what is in a cell is a lookup,
 * not a search. The grid doesn't change itself: a reaction system of the game adds entities when they get a cell,
 * and removes them when they lose it.
 */
export class Grid implements Size {
  private readonly cells: Entity[][];

  public constructor(public readonly width: number, public readonly height: number) {
    this.cells = Array.from({length: width * height}, () => []);
  }

  public isInside(cell: Readonly<Vector>): boolean {
    return isInside(cell, this);
  }

  /**
   * Gets entities in the cell. For a moment a cell can have several entities: the head moves to a cell with food,
   * and eats it right after.
   */
  public at(cell: Readonly<Vector>): ReadonlyArray<Entity> {
    return this.isInside(cell) ? this.cells[this.indexOf(cell)] : [];
  }

  public add(cell: Readonly<Vector>, entity: Entity): void {
    if (this.isInside(cell)) this.cells[this.indexOf(cell)].push(entity);
  }

  public remove(cell: Readonly<Vector>, entity: Entity): void {
    if (!this.isInside(cell)) return;
    const entities = this.cells[this.indexOf(cell)];
    entities.splice(entities.indexOf(entity), 1);
  }

  public get isFull(): boolean {
    return this.cells.every((entities) => entities.length > 0);
  }

  public freeCells(): Vector[] {
    const result: Vector[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y * this.width + x].length === 0) result.push({x, y});
      }
    }
    return result;
  }

  private indexOf({x, y}: Readonly<Vector>): number {
    return y * this.width + x;
  }
}

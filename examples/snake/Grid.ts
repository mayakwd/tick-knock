import {Entity} from 'tick-knock';
import {isInside, Size, Vector} from '../shared/geometry';

/**
 * Entities indexed by cells of the grid: a cell is an index of an array, so finding what occupies a cell is a lookup,
 * not a search. The grid doesn't change itself: a reaction system of the game adds entities when they get a cell,
 * and removes them when they lose it.
 */
export class Grid implements Size {
  private readonly cells: Array<Entity | undefined>;

  public constructor(public readonly width: number, public readonly height: number) {
    this.cells = new Array(width * height).fill(undefined);
  }

  public isInside(cell: Readonly<Vector>): boolean {
    return isInside(cell, this);
  }

  /**
   * Gets the entity occupying the cell
   */
  public at(cell: Readonly<Vector>): Entity | undefined {
    return this.isInside(cell) ? this.cells[this.indexOf(cell)] : undefined;
  }

  public set(cell: Readonly<Vector>, entity: Entity): void {
    if (this.isInside(cell)) this.cells[this.indexOf(cell)] = entity;
  }

  /**
   * Frees the cell, if it's occupied by the entity. Another entity could have moved to the cell already.
   */
  public delete(cell: Readonly<Vector>, entity: Entity): void {
    if (this.at(cell) === entity) this.cells[this.indexOf(cell)] = undefined;
  }

  public freeCells(): Vector[] {
    const result: Vector[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y * this.width + x] === undefined) result.push({x, y});
      }
    }
    return result;
  }

  private indexOf({x, y}: Readonly<Vector>): number {
    return y * this.width + x;
  }
}

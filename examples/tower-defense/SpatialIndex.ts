import {Entity} from 'tick-knock';
import {isWithin, Vector} from '../shared/geometry';
import {Cell, Position} from './components';
import {CELL, COLUMNS, ROWS} from './config';
import {cellIndex, isInsideMap} from './map';

/**
 * Entities indexed by cells of the map. Finding entities near a point looks only into cells around it, instead of
 * checking every entity.
 *
 * The index doesn't change itself: reaction systems of the game add an entity when it gets a cell, and remove it
 * when it loses the cell. An entity moving to another cell gets a new `Cell`, so it's removed from the previous cell
 * and added to the next one. Entities outside the map are not indexed.
 */
export class SpatialIndex {
  private readonly cells: Entity[][] = Array.from({length: COLUMNS * ROWS}, () => []);
  private readonly entities = new Set<Entity>();

  public has(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  /**
   * Gets entities in the cell
   */
  public at(cell: Cell): ReadonlyArray<Entity> {
    return isInsideMap(cell) ? this.cells[cellIndex(cell)] : [];
  }

  public add(cell: Cell, entity: Entity): void {
    if (!isInsideMap(cell)) return;
    this.cells[cellIndex(cell)].push(entity);
    this.entities.add(entity);
  }

  public remove(cell: Cell, entity: Entity): void {
    if (!isInsideMap(cell)) return;
    const entities = this.cells[cellIndex(cell)];
    const index = entities.indexOf(entity);
    if (index >= 0) entities.splice(index, 1);
    this.entities.delete(entity);
  }

  /**
   * Calls the callback for every entity, which position is within the radius from the center. Only cells, that
   * the circle touches, are checked.
   */
  public forEachWithin(center: Readonly<Vector>, radius: number, callback: (entity: Entity, position: Position) => void): void {
    const left = Math.max(0, Math.floor((center.x - radius) / CELL));
    const right = Math.min(COLUMNS - 1, Math.floor((center.x + radius) / CELL));
    const top = Math.max(0, Math.floor((center.y - radius) / CELL));
    const bottom = Math.min(ROWS - 1, Math.floor((center.y + radius) / CELL));
    for (let row = top; row <= bottom; row++) {
      for (let column = left; column <= right; column++) {
        for (const entity of this.cells[row * COLUMNS + column]) {
          const position = entity.get(Position)!;
          if (isWithin(center, position, radius)) callback(entity, position);
        }
      }
    }
  }
}

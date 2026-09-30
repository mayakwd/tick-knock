import {CELL, COLUMNS, ROWS} from './config';

export interface Cell {
  readonly column: number;
  readonly row: number;
}

/**
 * Turns of the path in cells. Creeps enter the map at the first point and leave it at the last one.
 * The map is static data, so it's not stored in entities.
 */
export const WAYPOINTS: ReadonlyArray<Cell> = [
  {column: -1, row: 3},
  {column: 4, row: 3},
  {column: 4, row: 9},
  {column: 9, row: 9},
  {column: 9, row: 5},
  {column: 13, row: 5},
  {column: 13, row: 10},
  {column: COLUMNS, row: 10},
];

/**
 * Center of the cell in pixels
 */
export function cellCenter({column, row}: Cell): { x: number; y: number } {
  return {x: (column + 0.5) * CELL, y: (row + 0.5) * CELL};
}

/**
 * Cells covered by the path
 */
export const PATH_CELLS: ReadonlySet<string> = (() => {
  const cells = new Set<string>();
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const from = WAYPOINTS[i - 1];
    const to = WAYPOINTS[i];
    const steps = Math.max(Math.abs(to.column - from.column), Math.abs(to.row - from.row));
    for (let step = 0; step <= steps; step++) {
      const column = from.column + Math.sign(to.column - from.column) * step;
      const row = from.row + Math.sign(to.row - from.row) * step;
      cells.add(`${column}:${row}`);
    }
  }
  return cells;
})();

/**
 * Returns a value indicating whether a tower can be built in the cell: it's inside the map, not on the path,
 * and not in the top row, which is covered by the status line
 */
export function isBuildable({column, row}: Cell): boolean {
  return column >= 0 && column < COLUMNS && row >= 1 && row < ROWS && !PATH_CELLS.has(`${column}:${row}`);
}

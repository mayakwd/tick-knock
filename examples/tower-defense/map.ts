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
 * Returns a value indicating whether the cell is covered by the path. The path goes straight between its turns,
 * so the cell is on the path if it's between two neighbouring turns.
 */
export function isOnPath({column, row}: Cell): boolean {
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const from = WAYPOINTS[i - 1];
    const to = WAYPOINTS[i];
    if (isBetween(column, from.column, to.column) && isBetween(row, from.row, to.row)) return true;
  }
  return false;
}

/**
 * Returns a value indicating whether a tower can be built in the cell: it's inside the map, not on the path,
 * and not in the top row, which is covered by the status line
 */
export function isBuildable(cell: Cell): boolean {
  return cell.column >= 0 && cell.column < COLUMNS && cell.row >= 1 && cell.row < ROWS && !isOnPath(cell);
}

function isBetween(value: number, a: number, b: number): boolean {
  return value >= Math.min(a, b) && value <= Math.max(a, b);
}

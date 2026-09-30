import {Vector} from '../shared/geometry';
import {Cell} from './components';
import {CELL, COLUMNS, ROWS} from './config';

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
export function cellCenter({column, row}: Cell): Vector {
  return {x: (column + 0.5) * CELL, y: (row + 0.5) * CELL};
}

/**
 * Returns the cell the point is in
 */
export function cellAt({x, y}: Readonly<Vector>): Cell {
  return new Cell(Math.floor(x / CELL), Math.floor(y / CELL));
}

export function isSameCell(a: Cell, b: Cell): boolean {
  return a.column === b.column && a.row === b.row;
}

/**
 * Turns of the path in pixels, creeps follow them
 */
export const PATH: ReadonlyArray<Readonly<Vector>> = WAYPOINTS.map(cellCenter);

/**
 * Returns the index of the cell inside the map, cells are numbered row by row
 */
export function cellIndex({column, row}: Cell): number {
  return row * COLUMNS + column;
}

export function isInsideMap({column, row}: Cell): boolean {
  return column >= 0 && column < COLUMNS && row >= 0 && row < ROWS;
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
  return isInsideMap(cell) && cell.row > 0 && !isOnPath(cell);
}

function isBetween(value: number, a: number, b: number): boolean {
  return value >= Math.min(a, b) && value <= Math.max(a, b);
}

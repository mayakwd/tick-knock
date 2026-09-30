import {Graphics} from 'pixi.js';
import {CELL, COLUMNS, HEIGHT, ROWS, WIDTH} from '../config';
import {PATH_CELLS} from '../map';
import {GRASS_COLOR, GRID_COLOR, PATH_COLOR} from './colors';

/**
 * Draws the map. The map never changes, so it's a single picture, not entities.
 */
export function drawMap(): Graphics {
  const map = new Graphics().rect(0, 0, WIDTH, HEIGHT).fill(GRASS_COLOR);
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      if (PATH_CELLS.has(`${column}:${row}`)) {
        map.rect(column * CELL, row * CELL, CELL, CELL).fill(PATH_COLOR);
      } else {
        map.rect(column * CELL + 0.5, row * CELL + 0.5, CELL - 1, CELL - 1).stroke({width: 1, color: GRID_COLOR});
      }
    }
  }
  return map;
}

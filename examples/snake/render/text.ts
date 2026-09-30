import {Cell} from '../components';
import {SnakeGame} from '../game';
import {FOOD, HEAD} from '../tags';

/**
 * Renders the game as text: `@` is the head, `o` is the body, `*` is food
 */
export function renderSnakeGame({grid}: SnakeGame): string {
  const rows = Array.from({length: grid.height}, (_, y) => Array.from({length: grid.width}, (_, x) => {
    const entity = grid.at(new Cell(x, y));
    if (entity === undefined) return ' ';
    return entity.has(HEAD) ? '@' : entity.has(FOOD) ? '*' : 'o';
  }));
  const border = `+${'-'.repeat(grid.width)}+`;
  return [border, ...rows.map((row) => `|${row.join('')}|`), border].join('\n');
}

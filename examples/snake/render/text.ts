import {Cell} from '../components';
import {SnakeGame} from '../game';
import {FOOD, HEAD} from '../tags';

/**
 * Renders the game as text: `@` is the head, `o` is the body, `*` is food
 */
export function renderSnakeGame({grid}: SnakeGame): string {
  const symbolAt = (x: number, y: number) => {
    const entities = grid.at(new Cell(x, y));
    if (entities.some((entity) => entity.has(HEAD))) return '@';
    if (entities.some((entity) => entity.has(FOOD))) return '*';
    return entities.length > 0 ? 'o' : ' ';
  };

  const rows = Array.from({length: grid.height}, (_, y) => Array.from({length: grid.width}, (_, x) => symbolAt(x, y)));
  const border = `+${'-'.repeat(grid.width)}+`;
  return [border, ...rows.map((row) => `|${row.join('')}|`), border].join('\n');
}

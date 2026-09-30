import {Position} from '../components';
import {SnakeGame} from '../game';
import {FOOD, HEAD} from '../tags';

/**
 * Renders the game as text: `@` is the head, `o` is the body, `*` is food
 */
export function renderSnakeGame(game: SnakeGame): string {
  const rows = Array.from({length: game.height}, () => Array.from({length: game.width}, () => ' '));
  for (const entity of game.engine.entities) {
    const position = entity.get(Position);
    if (position === undefined || rows[position.y]?.[position.x] === undefined) continue;
    rows[position.y][position.x] = entity.has(HEAD) ? '@' : entity.has(FOOD) ? '*' : 'o';
  }
  const border = `+${'-'.repeat(game.width)}+`;
  return [border, ...rows.map((row) => `|${row.join('')}|`), border].join('\n');
}

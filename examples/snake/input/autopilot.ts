import {QueryBuilder} from 'tick-knock';
import {Cell, Heading, Lifetime} from '../components';
import {Direction, DIRECTIONS} from '../Controls';
import {SnakeGame} from '../game';
import {FOOD, HEAD} from '../tags';

/**
 * Creates a greedy autopilot: every tick it turns to the free cell closest to food.
 * It reads the game through its own queries and the grid, the same way any system would do.
 */
export function createAutopilot(game: SnakeGame): () => void {
  const head = new QueryBuilder().contains(Cell, Heading, HEAD).build();
  const food = new QueryBuilder().contains(Cell, FOOD).build();
  game.engine.addQuery(head).addQuery(food);
  const {grid} = game;

  // The tail leaves its cell on the next tick, before the head moves, so it's free
  const isFree = (cell: Cell) => {
    if (!grid.isInside(cell)) return false;
    const lifetime = grid.at(cell)?.get(Lifetime);
    return lifetime === undefined || lifetime.ticks <= 1;
  };

  return () => {
    const snake = head.first;
    if (snake === undefined) return;
    const cell = snake.get(Cell)!;
    const heading = snake.get(Heading)!;
    const target = food.first?.get(Cell);

    let best: Direction | undefined;
    let bestDistance = Infinity;
    for (const [direction, {dx, dy}] of Object.entries(DIRECTIONS) as Array<[Direction, typeof DIRECTIONS.up]>) {
      if (dx === -heading.dx && dy === -heading.dy) continue;
      const next = new Cell(cell.x + dx, cell.y + dy);
      if (!isFree(next)) continue;
      const distance = target === undefined ? 0 : Math.abs(target.x - next.x) + Math.abs(target.y - next.y);
      if (distance < bestDistance) {
        best = direction;
        bestDistance = distance;
      }
    }
    game.controls.direction = best;
  };
}

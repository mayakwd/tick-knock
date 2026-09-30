import {QueryBuilder} from 'tick-knock';
import {Direction, FOOD, HEAD, Heading, Position, SEGMENT, SnakeGame} from './game';

const MOVES: Array<[Direction, number, number]> = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];

/**
 * Creates a greedy autopilot: every tick it turns to the free cell closest to food.
 * It reads the game through its own queries, the same way any system would do.
 */
export function createAutopilot(game: SnakeGame): () => void {
  const head = new QueryBuilder().contains(Position, Heading, HEAD).build();
  const food = new QueryBuilder().contains(Position, FOOD).build();
  const segments = new QueryBuilder().contains(Position, SEGMENT).build();
  game.engine.addQuery(head).addQuery(food).addQuery(segments);

  return () => {
    const snake = head.first;
    if (snake === undefined) return;
    const position = snake.get(Position)!;
    const heading = snake.get(Heading)!;
    const target = food.first?.get(Position);
    const occupied = new Set(segments.entities.map((segment) => {
      const {x, y} = segment.get(Position)!;
      return `${x}:${y}`;
    }));

    let best: Direction | undefined;
    let bestDistance = Infinity;
    for (const [direction, dx, dy] of MOVES) {
      if (dx === -heading.dx && dy === -heading.dy) continue;
      const x = position.x + dx;
      const y = position.y + dy;
      if (x < 0 || y < 0 || x >= game.width || y >= game.height || occupied.has(`${x}:${y}`)) continue;
      const distance = target === undefined ? 0 : Math.abs(target.x - x) + Math.abs(target.y - y);
      if (distance < bestDistance) {
        best = direction;
        bestDistance = distance;
      }
    }
    game.controls.direction = best;
  };
}

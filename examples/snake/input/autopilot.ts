import {Query, QueryBuilder} from 'tick-knock';
import {Autopilot} from '../../shared/Demo';
import {Cell, Heading, Lifetime} from '../components';
import {Direction, DIRECTIONS} from '../Controls';
import {SnakeGame} from '../game';
import {FOOD, HEAD} from '../tags';

/**
 * Greedy autopilot: every tick it turns to the free cell closest to food.
 * It finds the head and food with its own queries, and looks into cells with the grid, as any system would do.
 */
export class SnakeAutopilot implements Autopilot {
  private readonly heads = new QueryBuilder().with(Cell, Heading, HEAD).build();
  private readonly food: Query<[Cell]> = new QueryBuilder().with(Cell, FOOD).build();

  public constructor(private readonly game: SnakeGame) {
    game.engine.addQuery(this.heads).addQuery(this.food);
  }

  public update(): void {
    const head = this.heads.first;
    if (head === undefined) return;

    const cell = head.get(Cell)!;
    const heading = head.get(Heading)!;
    const target = this.food.first?.get(Cell);

    let best: Direction | undefined;
    let bestDistance = Infinity;
    for (const [direction, {dx, dy}] of Object.entries(DIRECTIONS) as Array<[Direction, typeof DIRECTIONS.up]>) {
      // The snake can't turn back
      if (dx === -heading.dx && dy === -heading.dy) continue;

      const next = new Cell(cell.x + dx, cell.y + dy);
      if (!this.isFree(next)) continue;

      const distance = target === undefined ? 0 : Math.abs(target.x - next.x) + Math.abs(target.y - next.y);
      if (distance < bestDistance) {
        best = direction;
        bestDistance = distance;
      }
    }
    this.game.controls.turn(best);
  }

  /**
   * Returns a value indicating whether the head can move to the cell. The tail leaves its cell before the head moves,
   * so it doesn't block the way.
   */
  private isFree(cell: Cell): boolean {
    const {grid} = this.game;
    if (!grid.isInside(cell)) return false;

    return grid.at(cell).every((entity) => {
      const lifetime = entity.get(Lifetime);
      return lifetime === undefined || lifetime.ticks <= 1;
    });
  }
}

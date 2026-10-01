import {Entity, IterativeSystem} from 'tick-knock';
import {GameOver} from '../../shared/GameOver';
import {Cell, Heading} from '../components';
import {Grid} from '../Grid';
import {HEAD, SEGMENT} from '../tags';

/**
 * Looks into the cell the head is about to move to. A wall or the body stops the snake, and the game is over.
 */
export class CollisionSystem extends IterativeSystem.of(Cell, Heading, HEAD) {
  public constructor(private readonly grid: Grid) {
    super();
  }

  protected updateEntity(head: Entity, dt: number, cell: Cell, heading: Heading): void {
    const next = new Cell(cell.x + heading.dx, cell.y + heading.dy);
    const hitsWall = !this.grid.isInside(next);
    const hitsBody = this.grid.at(next).some((entity) => entity.has(SEGMENT));
    if (!hitsWall && !hitsBody) return;

    // The crashed snake loses its heading, so it doesn't move anymore
    head.remove(Heading);
    this.dispatch(new GameOver());
  }
}

import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/ecs/tags';
import {Body, Cell} from '../components';
import {Grid} from '../Grid';
import {FOOD, HEAD} from '../tags';

/**
 * Eats food in the cell of the head, and makes the snake longer
 */
export class EatingSystem extends IterativeSystem.of(Cell, Body, HEAD) {
  public constructor(private readonly grid: Grid) {
    super();
  }

  protected updateEntity(head: Entity, dt: number, cell: Cell, body: Body): void {
    const food = this.grid.at(cell).find((entity) => entity.has(FOOD));
    if (food === undefined) return;

    // New segments live longer, so the body grows
    body.length++;

    food.add(DESTROYED);
  }
}

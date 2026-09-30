import {Entity, IterativeSystem} from 'tick-knock';
import {Body, Cell} from '../components';
import {Grid} from '../Grid';
import {FoodEaten} from '../messages';
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

    // The food is removed after the update, but it loses its cell right away, so it leaves the grid
    food.remove(Cell);
    this.engine.removeEntity(food);
    this.dispatch(new FoodEaten(body.length));
  }
}

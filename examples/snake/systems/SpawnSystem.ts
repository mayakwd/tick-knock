import {QueryBuilder, System} from 'tick-knock';
import {Random} from '../../shared/random';
import {Cell} from '../components';
import {createFood} from '../entities';
import {Grid} from '../Grid';
import {FOOD} from '../tags';

/**
 * Adds food to a random free cell, when there is no food on the grid. When there are no free cells, the snake has
 * filled the grid, and there is nowhere to put food.
 */
export class SpawnSystem extends System {
  private readonly food = new QueryBuilder().contains(Cell, FOOD).build();

  public constructor(private readonly grid: Grid, private readonly random: Random) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.food);
  }

  public onRemovedFromEngine(): void {
    this.engine.removeQuery(this.food);
  }

  public update(): void {
    // The food is still there
    if (!this.food.isEmpty) return;

    // The snake has filled the grid
    const free = this.grid.freeCells();
    if (free.length === 0) return;

    const {x, y} = free[Math.floor(this.random() * free.length)];
    this.engine.addEntity(createFood(x, y));
  }
}

import {Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Body, Lifetime, Position} from '../components';
import {FoodEaten, GameOver} from '../messages';
import {FOOD, HEAD, SEGMENT} from '../tags';

/**
 * Checks what the head of the snake has run into: walls, its own body or food
 */
export class CollisionSystem extends IterativeSystem.of(Position, Body, HEAD) {
  private readonly food = new QueryBuilder().contains(Position, FOOD).build();
  private readonly segments = new QueryBuilder().contains(Position, Lifetime, SEGMENT).build();

  public constructor(private readonly width: number, private readonly height: number) {
    super();
  }

  public onAddedToEngine(): void {
    super.onAddedToEngine();
    this.engine.addQuery(this.food).addQuery(this.segments);
  }

  public onRemovedFromEngine(): void {
    super.onRemovedFromEngine();
    this.engine.removeQuery(this.food);
    this.engine.removeQuery(this.segments);
  }

  protected updateEntity(head: Entity, dt: number, position: Position, body: Body): void {
    const {x, y} = position;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      this.dispatch(new GameOver());
      return;
    }
    this.segments.forEach((segment, segmentPosition, lifetime) => {
      // Expired segments are removed after the update, but the head can already move to their cells
      if (lifetime.ticks > 0 && segmentPosition.x === x && segmentPosition.y === y) {
        this.dispatch(new GameOver());
      }
    });
    this.food.forEach((food, foodPosition) => {
      if (foodPosition.x === x && foodPosition.y === y) {
        body.length++;
        this.engine.removeEntity(food);
        this.dispatch(new FoodEaten(body.length));
      }
    });
  }
}

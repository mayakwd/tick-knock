import {Entity, IterativeSystem} from 'tick-knock';
import {Heading} from '../components';
import {Controls, Direction} from '../Controls';
import {HEAD} from '../tags';

const DIRECTIONS: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Turns the snake according to the controls. It's a class-based system, because it depends on the controls object,
 * which is passed in the constructor.
 */
export class SteeringSystem extends IterativeSystem.of(Heading, HEAD) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(entity: Entity, dt: number, heading: Heading): void {
    const direction = this.controls.direction;
    if (direction === undefined) return;
    this.controls.direction = undefined;
    const [dx, dy] = DIRECTIONS[direction];
    // The snake can't turn back into itself
    if (dx === -heading.dx && dy === -heading.dy) return;
    heading.dx = dx;
    heading.dy = dy;
  }
}

import {Entity, IterativeSystem} from 'tick-knock';
import {AsteroidTree} from '../AsteroidTree';
import {Asteroid, Collider, Position} from '../components';

/**
 * Fills the tree of asteroids. Asteroids move every frame, so the tree is filled again every update, after
 * everything has moved and before collisions are checked.
 */
export class AsteroidTreeSystem extends IterativeSystem.of(Position, Collider, Asteroid) {
  public constructor(private readonly tree: AsteroidTree) {
    super();
  }

  public update(dt: number): void {
    this.tree.clear();
    super.update(dt);
  }

  protected updateEntity(asteroid: Entity, dt: number, position: Position): void {
    this.tree.add(asteroid, position);
  }
}

import {Entity, EntitySnapshot, IterativeSystem} from 'tick-knock';
import {AsteroidTree} from '../AsteroidTree';
import {Asteroid, Collider, Position} from '../components';

/**
 * Keeps the tree of asteroids up to date. A new asteroid is inserted into the tree, a destroyed one, that has lost its
 * collider, leaves it right away, and every update asteroids are moved in the tree to their new positions, after
 * everything has moved and before collisions are checked.
 */
export class AsteroidTreeSystem extends IterativeSystem.of(Position, Collider, Asteroid) {
  public constructor(private readonly tree: AsteroidTree) {
    super();
  }

  protected entityAdded = ({current}: EntitySnapshot, position: Position): void => {
    this.tree.add(current, position);
  };

  protected entityRemoved = ({current}: EntitySnapshot): void => {
    this.tree.remove(current);
  };

  protected updateEntity(asteroid: Entity, dt: number, position: Position): void {
    this.tree.move(asteroid, position);
  }
}

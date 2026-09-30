import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/ecs/tags';
import {GameOver} from '../../shared/GameOver';
import {AsteroidTree} from '../AsteroidTree';
import {Collider, Position} from '../components';
import {SHIP} from '../tags';

/**
 * An asteroid destroys the ship, that touches it, and the game is over
 */
export class ShipCollisionSystem extends IterativeSystem.of(Position, Collider, SHIP) {
  public constructor(private readonly asteroids: AsteroidTree) {
    super();
  }

  protected updateEntity(ship: Entity, dt: number, position: Position, collider: Collider): void {
    if (this.asteroids.find(position, collider.radius) === undefined) return;

    ship.add(DESTROYED);
    this.dispatch(new GameOver());
  }
}

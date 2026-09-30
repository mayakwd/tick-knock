import {Entity, IterativeSystem} from 'tick-knock';
import {AsteroidTree} from '../AsteroidTree';
import {Collider, Position} from '../components';
import {destroy} from '../entities';
import {ShipDestroyed} from '../messages';
import {SHIP} from '../tags';

/**
 * An asteroid destroys the ship, that touches it
 */
export class ShipCollisionSystem extends IterativeSystem.of(Position, Collider, SHIP) {
  public constructor(private readonly asteroids: AsteroidTree) {
    super();
  }

  protected updateEntity(ship: Entity, dt: number, position: Position, collider: Collider): void {
    if (this.asteroids.find(position, collider.radius) === undefined) return;

    destroy(this.engine, ship);
    this.dispatch(new ShipDestroyed());
  }
}

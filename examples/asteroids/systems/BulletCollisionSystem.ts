import {Entity, IterativeSystem} from 'tick-knock';
import {AsteroidTree} from '../AsteroidTree';
import {Collider, Position} from '../components';
import {destroy} from '../entities';
import {AsteroidDestroyed} from '../messages';
import {BULLET} from '../tags';

/**
 * A bullet destroys the first asteroid it touches, and disappears
 */
export class BulletCollisionSystem extends IterativeSystem.of(Position, Collider, BULLET) {
  public constructor(private readonly asteroids: AsteroidTree) {
    super();
  }

  protected updateEntity(bullet: Entity, dt: number, position: Position, collider: Collider): void {
    const asteroid = this.asteroids.find(position, collider.radius);
    if (asteroid === undefined) return;

    destroy(this.engine, bullet);
    destroy(this.engine, asteroid);
    this.dispatch(new AsteroidDestroyed(asteroid));
  }
}

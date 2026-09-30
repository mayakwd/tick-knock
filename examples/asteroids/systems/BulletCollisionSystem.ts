import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/ecs/tags';
import {Score} from '../../shared/Score';
import {AsteroidTree} from '../AsteroidTree';
import {Asteroid, Collider, Position} from '../components';
import {ASTEROIDS} from '../config';
import {BULLET} from '../tags';

/**
 * A bullet destroys the first asteroid it touches, and is destroyed too. The destroyed asteroid gives points.
 */
export class BulletCollisionSystem extends IterativeSystem.of(Position, Collider, BULLET) {
  public constructor(private readonly asteroids: AsteroidTree, private readonly score: Score) {
    super();
  }

  protected updateEntity(bullet: Entity, dt: number, position: Position, collider: Collider): void {
    const asteroid = this.asteroids.find(position, collider.radius);
    if (asteroid === undefined) return;

    this.score.points += ASTEROIDS[asteroid.get(Asteroid)!.size].points;

    bullet.add(DESTROYED);
    asteroid.add(DESTROYED);
  }
}

import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/ecs/tags';
import {Random} from '../../shared/random';
import {Asteroid, Position} from '../components';
import {AsteroidSize} from '../config';
import {createAsteroid} from '../entities';

/**
 * A destroyed asteroid splits into two smaller ones, the smallest asteroids just disappear. The destroyed asteroid is
 * removed after the update, so the system still reads its size and position.
 */
export class SplitSystem extends IterativeSystem.of(Asteroid, Position, DESTROYED) {
  public constructor(private readonly random: Random) {
    super();
  }

  protected updateEntity(asteroid: Entity, dt: number, {size}: Asteroid, {x, y}: Position): void {
    if (size === 1) return;

    const smaller = (size - 1) as AsteroidSize;
    this.engine.addEntity(createAsteroid(x, y, smaller, this.random));
    this.engine.addEntity(createAsteroid(x, y, smaller, this.random));
  }
}

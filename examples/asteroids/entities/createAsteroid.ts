import {Entity} from 'tick-knock';
import {Random} from '../../shared/random';
import {Asteroid, Collider, Position, Rotation, Velocity} from '../components';
import {ASTEROID_RADIUS} from '../config';

/**
 * Creates an asteroid flying in a random direction. Smaller asteroids fly faster.
 */
export function createAsteroid(x: number, y: number, size: number, random: Random): Entity {
  const angle = random() * Math.PI * 2;
  const speed = 30 + random() * 40 * (4 - size);
  const outline = Array.from({length: 10}, () => 0.75 + random() * 0.25);
  return new Entity()
    .add(new Position(x, y))
    .add(new Velocity(Math.cos(angle) * speed, Math.sin(angle) * speed))
    .add(new Rotation(random() * Math.PI * 2))
    .add(new Collider(ASTEROID_RADIUS[size]))
    .add(new Asteroid(size, outline));
}

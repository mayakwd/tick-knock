import {Entity} from 'tick-knock';
import {Random} from '../../shared/random';
import {AngularVelocity, Asteroid, Collider, Position, Rotation, Velocity} from '../components';
import {ASTEROID_SPEED, ASTEROID_SPIN, ASTEROID_VERTICES, ASTEROIDS, AsteroidSize} from '../config';

/**
 * Creates an asteroid flying in a random direction. Smaller asteroids fly faster, and every asteroid spins
 * in the direction it flies.
 */
export function createAsteroid(x: number, y: number, size: AsteroidSize, random: Random): Entity {
  const angle = random() * Math.PI * 2;
  const speed = ASTEROID_SPEED.min + random() * ASTEROID_SPEED.random * (4 - size);
  const velocity = new Velocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  const outline = Array.from({length: ASTEROID_VERTICES}, () => 0.75 + random() * 0.25);
  return new Entity()
    .add(new Position(x, y))
    .add(velocity)
    .add(new Rotation(random() * Math.PI * 2))
    .add(new AngularVelocity(Math.sign(velocity.x) * ASTEROID_SPIN))
    .add(new Collider(ASTEROIDS[size].radius))
    .add(new Asteroid(size, outline));
}

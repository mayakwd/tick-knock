import {Engine, IterativeUpdate} from 'tick-knock';
import {Lifetime, Position, Rotation, Velocity} from '../components';

/**
 * Moves entities and wraps them around the edges of the screen
 */
export function movement(width: number, height: number): IterativeUpdate<[Position, Velocity]> {
  return (entity, dt, position, velocity) => {
    position.x = wrap(position.x + velocity.x * dt, width);
    position.y = wrap(position.y + velocity.y * dt, height);
  };
}

/**
 * Asteroids slowly spin in the direction they fly
 */
export const spin: IterativeUpdate<[Rotation, Velocity]> = (entity, dt, rotation, velocity) => {
  rotation.angle += Math.sign(velocity.x) * dt;
};

/**
 * Removes entities from the engine when their lifetime is over
 */
export function expiration(engine: Engine): IterativeUpdate<[Lifetime]> {
  return (entity, dt, lifetime) => {
    lifetime.seconds -= dt;
    if (lifetime.seconds <= 0) engine.removeEntity(entity);
  };
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

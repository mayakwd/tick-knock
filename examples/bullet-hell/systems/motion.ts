import {Engine, IterativeUpdate} from 'tick-knock';
import {Invulnerable, Position, Sway, Velocity} from '../components';
import {HEIGHT, SCREEN_MARGIN, WIDTH} from '../config';

export const movement: IterativeUpdate<[Position, Velocity]> = (entity, dt, position, velocity) => {
  position.x += velocity.x * dt;
  position.y += velocity.y * dt;
};

/**
 * Swings entities from side to side. Only the change of the swing is added to the position, so it works together
 * with movement.
 */
export const swaying: IterativeUpdate<[Position, Sway]> = (entity, dt, position, sway) => {
  sway.time += dt;
  const offset = Math.sin(sway.time * sway.frequency * Math.PI * 2) * sway.amplitude;
  position.x += offset - sway.offset;
  sway.offset = offset;
};

/**
 * Removes moving entities that have left the screen: bullets and enemies that have flown by
 */
export function leavingScreen(engine: Engine): IterativeUpdate<[Position, Velocity]> {
  return (entity, dt, {x, y}) => {
    if (x < -SCREEN_MARGIN || x > WIDTH + SCREEN_MARGIN || y < -SCREEN_MARGIN * 2 || y > HEIGHT + SCREEN_MARGIN) {
      engine.removeEntity(entity);
    }
  };
}

/**
 * Removes the invulnerability when its time is over
 */
export const invulnerability: IterativeUpdate<[Invulnerable]> = (entity, dt, invulnerable) => {
  invulnerable.seconds -= dt;
  if (invulnerable.seconds <= 0) entity.remove(Invulnerable);
};

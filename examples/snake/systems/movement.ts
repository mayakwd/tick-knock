import {Engine, IterativeUpdate} from 'tick-knock';
import {Body, Heading, Lifetime, Position} from '../components';
import {createSegment} from '../entities';

/**
 * Moves the head one cell forward. The head leaves a segment behind, which lives as many ticks as long the snake is.
 */
export function movement(engine: Engine): IterativeUpdate<[Position, Heading, Body]> {
  return (head, dt, position, heading, body) => {
    engine.addEntity(createSegment(position.x, position.y, body.length));
    position.x += heading.dx;
    position.y += heading.dy;
  };
}

/**
 * Removes segments when their lifetime is over
 */
export function aging(engine: Engine): IterativeUpdate<[Lifetime]> {
  return (segment, dt, lifetime) => {
    if (--lifetime.ticks <= 0) engine.removeEntity(segment);
  };
}

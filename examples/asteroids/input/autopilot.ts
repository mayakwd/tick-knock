import {QueryBuilder} from 'tick-knock';
import {Asteroid, Position, Rotation, Ship} from '../components';
import {AsteroidsGame} from '../game';

/**
 * Creates an autopilot for the demo mode and tests: it turns the ship to the nearest asteroid and fires.
 * It reads the game through its own queries, the same way any system would do.
 */
export function createAutopilot(game: AsteroidsGame): () => void {
  const ships = new QueryBuilder().contains(Ship, Position, Rotation).build();
  const asteroids = new QueryBuilder().contains(Position, Asteroid).build();
  game.engine.addQuery(ships).addQuery(asteroids);

  return () => {
    const {controls} = game;
    controls.left = controls.right = controls.thrust = controls.fire = false;
    const ship = ships.first;
    if (ship === undefined) return;
    const position = ship.get(Position)!;
    const rotation = ship.get(Rotation)!;

    let target: Position | undefined;
    let distance = Infinity;
    asteroids.forEach((asteroid, asteroidPosition) => {
      const value = Math.hypot(asteroidPosition.x - position.x, asteroidPosition.y - position.y);
      if (value < distance) {
        target = asteroidPosition;
        distance = value;
      }
    });
    if (target === undefined) return;

    const angle = Math.atan2(target.y - position.y, target.x - position.x);
    // Difference of angles normalized to [-PI, PI]
    const turn = Math.atan2(Math.sin(angle - rotation.angle), Math.cos(angle - rotation.angle));
    controls.left = turn < -0.05;
    controls.right = turn > 0.05;
    controls.fire = Math.abs(turn) < 0.3;
  };
}

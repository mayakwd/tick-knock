import {QueryBuilder} from 'tick-knock';
import {angleDifference, angleTo, distanceSquared} from '../../shared/geometry';
import {Asteroid, Position, Rotation} from '../components';
import {AsteroidsGame} from '../game';
import {SHIP} from '../tags';

/**
 * The ship turns while the target is further than this angle in radians
 */
const AIM_PRECISION = 0.05;
/**
 * The ship fires while the target is closer than this angle in radians
 */
const FIRE_ANGLE = 0.3;

/**
 * Creates an autopilot for the demo mode and tests: it turns the ship to the nearest asteroid and fires.
 * It reads the game through its own queries, the same way any system would do.
 */
export function createAutopilot(game: AsteroidsGame): () => void {
  const ships = new QueryBuilder().contains(Position, Rotation, SHIP).build();
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
    let nearest = Infinity;
    asteroids.forEach((asteroid, asteroidPosition) => {
      const distance = distanceSquared(position, asteroidPosition);
      if (distance < nearest) {
        target = asteroidPosition;
        nearest = distance;
      }
    });
    if (target === undefined) return;

    const turn = angleDifference(rotation.angle, angleTo(position, target));
    controls.left = turn < -AIM_PRECISION;
    controls.right = turn > AIM_PRECISION;
    controls.fire = Math.abs(turn) < FIRE_ANGLE;
  };
}

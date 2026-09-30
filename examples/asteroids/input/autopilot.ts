import {QueryBuilder} from 'tick-knock';
import {Autopilot} from '../../shared/Demo';
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
 * Autopilot for the demo mode and tests: it turns the ship to the nearest asteroid and fires.
 * It reads the game through its own queries, the same way any system would do.
 */
export class AsteroidsAutopilot implements Autopilot {
  private readonly ships = new QueryBuilder().contains(Position, Rotation, SHIP).build();
  private readonly asteroids = new QueryBuilder().contains(Position, Asteroid).build();

  public constructor(private readonly game: AsteroidsGame) {
    game.engine.addQuery(this.ships).addQuery(this.asteroids);
  }

  public update(): void {
    const {controls} = this.game;
    controls.release();

    const ship = this.ships.first;
    if (ship === undefined) return;
    const position = ship.get(Position)!;
    const rotation = ship.get(Rotation)!;

    const target = this.nearestAsteroid(position);
    if (target === undefined) return;

    const turn = angleDifference(rotation.angle, angleTo(position, target));
    controls.left = turn < -AIM_PRECISION;
    controls.right = turn > AIM_PRECISION;
    controls.fire = Math.abs(turn) < FIRE_ANGLE;
  }

  private nearestAsteroid(position: Position): Position | undefined {
    let nearest: Position | undefined;
    let nearestDistance = Infinity;
    this.asteroids.forEach((asteroid, asteroidPosition) => {
      const distance = distanceSquared(position, asteroidPosition);
      if (distance >= nearestDistance) return;

      nearest = asteroidPosition;
      nearestDistance = distance;
    });
    return nearest;
  }
}

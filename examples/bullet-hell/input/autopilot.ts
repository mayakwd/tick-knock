import {QueryBuilder} from 'tick-knock';
import {Autopilot} from '../../shared/Demo';
import {distance} from '../../shared/geometry';
import {Enemy, Position, Velocity} from '../components';
import {HEIGHT} from '../config';
import {BulletHellGame} from '../game';
import {ENEMY_BULLET, PLAYER} from '../tags';

/**
 * Bullets closer than this distance in pixels push the ship away
 */
const DANGER_DISTANCE = 70;
/**
 * The autopilot looks this far ahead in seconds, so it dodges bullets before they come
 */
const LOOKAHEAD = 0.2;
/**
 * The autopilot keeps this far from the bottom edge of the screen, so it has room to dodge
 */
const BOTTOM_DISTANCE = 90;
/**
 * How strongly the ship is pulled to its place under the enemy, and how strongly bullets push it away
 */
const PULL = 0.02;
const PUSH = 3;
/**
 * Pushes weaker than this don't move the ship, so it doesn't jitter
 */
const DEAD_ZONE = 0.2;
/**
 * Weight of the vertical distance to an enemy when the autopilot chooses the enemy to keep under
 */
const VERTICAL_WEIGHT = 0.2;

/**
 * Autopilot for the demo mode and tests: it keeps under the nearest enemy, fires all the time, and is pushed away by
 * bullets flying to it.
 */
export class BulletHellAutopilot implements Autopilot {
  private readonly players = new QueryBuilder().with(Position, PLAYER).build();
  private readonly enemies = new QueryBuilder().with(Position, Enemy).build();
  private readonly bullets = new QueryBuilder().with(Position, Velocity, ENEMY_BULLET).build();

  public constructor(private readonly game: BulletHellGame) {
    game.engine.addQuery(this.players).addQuery(this.enemies).addQuery(this.bullets);
  }

  public update(): void {
    const {controls} = this.game;
    controls.fire = true;
    controls.focus = false;

    const ship = this.players.first?.get(Position);
    if (ship === undefined) return;

    // The ship is pulled to its place under the enemy, and bullets push it away
    const push = {
      x: (this.targetX(ship) - ship.x) * PULL,
      y: (HEIGHT - BOTTOM_DISTANCE - ship.y) * PULL,
    };
    this.bullets.forEach((bullet, position, velocity) => {
      const ahead = {x: position.x + velocity.x * LOOKAHEAD, y: position.y + velocity.y * LOOKAHEAD};
      const length = distance(ahead, ship);
      if (length > DANGER_DISTANCE || length === 0) return;

      const force = ((DANGER_DISTANCE - length) / DANGER_DISTANCE) * PUSH;
      push.x += ((ship.x - ahead.x) / length) * force;
      push.y += ((ship.y - ahead.y) / length) * force;
    });

    controls.left = push.x < -DEAD_ZONE;
    controls.right = push.x > DEAD_ZONE;
    controls.up = push.y < -DEAD_ZONE;
    controls.down = push.y > DEAD_ZONE;
  }

  /**
   * Returns the horizontal position of the enemy to keep under. The nearest enemy horizontally is preferred,
   * enemies far above count less.
   */
  private targetX(ship: Position): number {
    let targetX = ship.x;
    let nearest = Infinity;
    this.enemies.forEach((enemy, {x, y}) => {
      const cost = Math.abs(x - ship.x) + (ship.y - y) * VERTICAL_WEIGHT;
      if (y >= ship.y || cost >= nearest) return;

      nearest = cost;
      targetX = x;
    });
    return targetX;
  }
}

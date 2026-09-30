import {QueryBuilder} from 'tick-knock';
import {Enemy, Position, Velocity} from '../components';
import {distance} from '../../shared/geometry';
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
 * Creates an autopilot for the demo mode and tests: it keeps under the nearest enemy, fires all the time,
 * and is pushed away by bullets flying to it.
 */
export function createAutopilot(game: BulletHellGame): () => void {
  const player = new QueryBuilder().contains(Position, PLAYER).build();
  const enemies = new QueryBuilder().contains(Position, Enemy).build();
  const bullets = new QueryBuilder().contains(Position, Velocity, ENEMY_BULLET).build();
  game.engine.addQuery(player).addQuery(enemies).addQuery(bullets);

  return () => {
    const {controls} = game;
    const ship = player.first?.get(Position);
    controls.fire = true;
    if (ship === undefined) return;

    let targetX = ship.x;
    let nearest = Infinity;
    // The nearest enemy horizontally is preferred, enemies far above count less
    enemies.forEach((enemy, {x, y}) => {
      const cost = Math.abs(x - ship.x) + (ship.y - y) * VERTICAL_WEIGHT;
      if (y < ship.y && cost < nearest) {
        nearest = cost;
        targetX = x;
      }
    });
    let pushX = (targetX - ship.x) * PULL;
    let pushY = (HEIGHT - BOTTOM_DISTANCE - ship.y) * PULL;

    bullets.forEach((bullet, position, velocity) => {
      const ahead = {x: position.x + velocity.x * LOOKAHEAD, y: position.y + velocity.y * LOOKAHEAD};
      const length = distance(ahead, ship);
      if (length > DANGER_DISTANCE || length === 0) return;
      const force = ((DANGER_DISTANCE - length) / DANGER_DISTANCE) * PUSH;
      pushX += ((ship.x - ahead.x) / length) * force;
      pushY += ((ship.y - ahead.y) / length) * force;
    });

    controls.left = pushX < -DEAD_ZONE;
    controls.right = pushX > DEAD_ZONE;
    controls.up = pushY < -DEAD_ZONE;
    controls.down = pushY > DEAD_ZONE;
    controls.focus = false;
  };
}

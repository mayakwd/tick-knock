import {QueryBuilder} from 'tick-knock';
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
    enemies.forEach((enemy, {x, y}) => {
      const distance = Math.abs(x - ship.x) + (ship.y - y) * 0.2;
      if (y < ship.y && distance < nearest) {
        nearest = distance;
        targetX = x;
      }
    });
    let pushX = (targetX - ship.x) * 0.02;
    let pushY = (HEIGHT - 90 - ship.y) * 0.02;

    bullets.forEach((bullet, position, velocity) => {
      const dx = ship.x - (position.x + velocity.x * LOOKAHEAD);
      const dy = ship.y - (position.y + velocity.y * LOOKAHEAD);
      const distance = Math.hypot(dx, dy);
      if (distance > DANGER_DISTANCE || distance === 0) return;
      const force = (DANGER_DISTANCE - distance) / DANGER_DISTANCE;
      pushX += (dx / distance) * force * 3;
      pushY += (dy / distance) * force * 3;
    });

    controls.left = pushX < -0.2;
    controls.right = pushX > 0.2;
    controls.up = pushY < -0.2;
    controls.down = pushY > 0.2;
    controls.focus = false;
  };
}

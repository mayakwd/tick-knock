import {Entity} from 'tick-knock';
import {AimedPattern, Collider, Enemy, Health, Position, Reward, RingPattern, SpiralPattern, Sway, Velocity} from '../components';
import {ENEMIES, EnemyKind} from '../enemies';
import {REMOVED_OFFSCREEN} from '../tags';

/**
 * Delay in seconds before the first shot, so enemies don't fire right at the edge of the screen
 */
const FIRST_SHOT_DELAY = 0.5;

/**
 * Creates an enemy from the description of its kind above the top edge of the screen. Optional behaviour is an optional component: an enemy sways only
 * if it has `Sway`, and fires with the patterns it has.
 *
 * @param strength Multiplier of health, it grows every time waves repeat
 */
export function createEnemy(kind: EnemyKind, x: number, strength: number): Entity {
  const {health, radius, speed, reward, sway, ring, spiral, aimed} = ENEMIES[kind];
  const entity = new Entity()
    .add(new Enemy(kind))
    .add(new Position(x, -radius))
    .add(new Velocity(0, speed))
    .add(new Collider(radius))
    .add(new Health(Math.round(health * strength)))
    .add(new Reward(reward))
    .add(REMOVED_OFFSCREEN);
  if (sway !== undefined) entity.add(new Sway(sway.amplitude, sway.frequency));
  if (ring !== undefined) entity.add(new RingPattern(ring.interval, ring.count, ring.speed, FIRST_SHOT_DELAY));
  if (spiral !== undefined) {
    entity.add(new SpiralPattern(spiral.interval, spiral.count, spiral.speed, spiral.step, FIRST_SHOT_DELAY));
  }
  if (aimed !== undefined) {
    entity.add(new AimedPattern(aimed.interval, aimed.count, aimed.speed, aimed.spread, FIRST_SHOT_DELAY));
  }
  return entity;
}

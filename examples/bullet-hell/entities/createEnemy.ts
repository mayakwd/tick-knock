import {Entity} from 'tick-knock';
import {Cooldown} from '../../shared/components/Cooldown';
import {View} from '../../shared/render/View';
import {Barrel, Collider, Enemy, Health, Position, Reward, Sway, Velocity} from '../components';
import {ENEMIES, EnemyKind} from '../enemies';
import {drawEnemy} from '../render/graphics';
import {REMOVED_OFFSCREEN} from '../tags';

/**
 * Delay in seconds before the first shot, so enemies don't fire right at the edge of the screen
 */
const FIRST_SHOT_DELAY = 0.5;

/**
 * Creates an enemy from the description of its kind above the top edge of the screen. The pattern of the kind is
 * a component, so it's added as is. Optional behaviour is an optional component: an enemy sways only if it has `Sway`.
 *
 * @param strength Multiplier of health, it grows every time waves repeat
 */
export function createEnemy(kind: EnemyKind, x: number, strength: number): Entity {
  const {health, radius, speed, reward, fireInterval, pattern, sway} = ENEMIES[kind];
  const entity = new Entity()
    .add(new Enemy(kind))
    .add(new Position(x, -radius))
    .add(new Velocity(0, speed))
    .add(new Collider(radius))
    .add(new Health(Math.round(health * strength)))
    .add(new Reward(reward))
    .add(new Cooldown(fireInterval, FIRST_SHOT_DELAY))
    .add(new Barrel())
    .add(pattern)
    .add(new View(drawEnemy(kind, radius)))
    .add(REMOVED_OFFSCREEN);

  if (sway !== undefined) entity.add(new Sway(sway.amplitude, sway.frequency));

  return entity;
}

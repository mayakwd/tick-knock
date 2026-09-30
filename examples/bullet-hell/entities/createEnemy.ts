import {Entity} from 'tick-knock';
import {Collider, Emitter, Enemy, Health, Position, Reward, Sway, Velocity} from '../components';
import {ENEMIES, EnemyKind} from '../enemies';

/**
 * Creates an enemy from its description
 * @param strength Multiplier of health, it grows every time waves repeat
 */
export function createEnemy(kind: EnemyKind, x: number, y: number, strength: number): Entity {
  const description = ENEMIES[kind];
  const {amplitude, frequency} = description.sway;
  const entity = new Entity()
    .add(new Enemy(kind))
    .add(new Position(x, y))
    .add(new Velocity(0, description.speed))
    .add(new Collider(description.radius))
    .add(new Health(Math.round(description.health * strength)))
    .add(new Reward(description.reward))
    .add(new Emitter(description.pattern, description.interval, description.count, description.bulletSpeed));
  // Optional behaviour is an optional component: enemies without it don't sway
  if (amplitude > 0) entity.add(new Sway(x, amplitude, frequency));
  return entity;
}

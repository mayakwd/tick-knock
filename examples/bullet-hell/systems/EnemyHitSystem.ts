import {Entity, IterativeSystem} from 'tick-knock';
import {Enemy, Health, Hit, Reward} from '../components';
import {destroy} from '../entities';
import {EnemyDestroyed} from '../messages';

/**
 * Every hit takes one point of health of an enemy. An enemy without health is destroyed, and gives points.
 */
export class EnemyHitSystem extends IterativeSystem.of(Hit, Health, Reward, Enemy) {
  protected updateEntity(enemy: Entity, dt: number, hit: Hit, health: Health, reward: Reward): void {
    health.value -= enemy.lengthOf(Hit);
    enemy.remove(Hit);
    if (health.value > 0) return;

    destroy(this.engine, enemy);
    this.dispatch(new EnemyDestroyed(reward.points));
  }
}

import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/DestroySystem';
import {Score} from '../../shared/Score';
import {Enemy, Health, Hit, Reward} from '../components';

/**
 * Every hit takes one point of health of an enemy. An enemy without health is destroyed, and gives points.
 */
export class EnemyHitSystem extends IterativeSystem.of(Hit, Health, Reward, Enemy) {
  public constructor(private readonly score: Score) {
    super();
  }

  protected updateEntity(enemy: Entity, dt: number, hit: Hit, health: Health, reward: Reward): void {
    health.value -= enemy.lengthOf(Hit);
    enemy.remove(Hit);
    if (health.value > 0) return;

    this.score.points += reward.points;
    enemy.add(DESTROYED);
  }
}

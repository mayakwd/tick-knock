import {EntitySnapshot, ReactionSystem} from 'tick-knock';
import {Reward} from '../../shared/components/Reward';
import {KILLED} from '../../shared/ecs/tags';
import {TowerDefenseState} from '../TowerDefenseState';

/**
 * A killed creep gives its reward. Creeps that have escaped are destroyed, but not killed, so they give nothing.
 */
export class RewardSystem extends ReactionSystem.of(Reward, KILLED) {
  public constructor(private readonly state: TowerDefenseState) {
    super();
  }

  protected entityAdded = (snapshot: EntitySnapshot, reward: Reward): void => {
    this.state.gold += reward.points;
  };
}

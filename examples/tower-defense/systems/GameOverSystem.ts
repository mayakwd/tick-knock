import {System} from 'tick-knock';
import {GameOver} from '../../shared/ecs/GameOver';
import {TowerDefenseState} from '../TowerDefenseState';

/**
 * The game is lost when the last life is lost. The game stops updating when it's over, so the message is dispatched
 * once.
 */
export class GameOverSystem extends System {
  public constructor(private readonly state: TowerDefenseState) {
    super();
  }

  public update(): void {
    // The player still has lives
    if (this.state.lives > 0) return;

    this.state.outcome = 'lost';
    this.dispatch(new GameOver('lost'));
  }
}

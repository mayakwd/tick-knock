import {ReactionSystem} from 'tick-knock';
import {CREEP, ESCAPED} from '../tags';
import {TowerDefenseState} from '../TowerDefenseState';

/**
 * An escaped creep takes a life
 */
export class EscapeSystem extends ReactionSystem.of(CREEP, ESCAPED) {
  public constructor(private readonly state: TowerDefenseState) {
    super();
  }

  protected entityAdded = (): void => {
    this.state.lives = Math.max(0, this.state.lives - 1);
  };
}

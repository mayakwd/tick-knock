import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/DestroySystem';
import {GameOver} from '../../shared/GameOver';
import {Hit, Invulnerable, Lives} from '../components';
import {INVULNERABILITY_TIME} from '../config';
import {PLAYER} from '../tags';

/**
 * The player loses one life for being hit, even if several things have hit it at once, and becomes invulnerable
 * for a while. The player without lives is destroyed, and the game is over.
 */
export class PlayerHitSystem extends IterativeSystem.of(Hit, Lives, PLAYER) {
  protected updateEntity(player: Entity, dt: number, hit: Hit, lives: Lives): void {
    player.remove(Hit);
    lives.count--;

    if (lives.count > 0) {
      player.add(new Invulnerable(INVULNERABILITY_TIME));
      return;
    }

    player.add(DESTROYED);
    this.dispatch(new GameOver());
  }
}

import {Entity, IterativeSystem} from 'tick-knock';
import {Hit, Invulnerable, Lives} from '../components';
import {INVULNERABILITY_TIME} from '../config';
import {destroy} from '../entities';
import {GameOver, PlayerHit} from '../messages';
import {PLAYER} from '../tags';

/**
 * The player loses one life for being hit, even if several things have hit it at once, and becomes invulnerable
 * for a while. The game is over when there are no lives left.
 */
export class PlayerHitSystem extends IterativeSystem.of(Hit, Lives, PLAYER) {
  protected updateEntity(player: Entity, dt: number, hit: Hit, lives: Lives): void {
    player.remove(Hit);
    lives.count--;
    this.dispatch(new PlayerHit());

    if (lives.count > 0) {
      player.add(new Invulnerable(INVULNERABILITY_TIME));
      return;
    }

    destroy(this.engine, player);
    this.dispatch(new GameOver());
  }
}

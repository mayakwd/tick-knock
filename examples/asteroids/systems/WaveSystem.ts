import {ReactionSystem} from 'tick-knock';
import {Asteroid} from '../components';

/**
 * Starts the next wave when the last asteroid is destroyed.
 * The system checks its own query, which is already updated when the handler is called, so the result doesn't depend
 * on the order in which other queries are notified.
 */
export class WaveSystem extends ReactionSystem.of(Asteroid) {
  public constructor(private readonly spawnWave: () => void, private readonly isOver: () => boolean) {
    super();
  }

  protected entityRemoved = () => {
    if (this.query.isEmpty && !this.isOver()) this.spawnWave();
  };
}

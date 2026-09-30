import {QueryBuilder, System} from 'tick-knock';
import {Size} from '../../shared/geometry';
import {Random} from '../../shared/random';
import {Asteroid} from '../components';
import {createAsteroid} from '../entities';

/**
 * Progress of waves, shared with the game, which shows the number of the wave
 */
export class WaveState {
  /**
   * Number of the current wave, 0 before the first one
   */
  public number = 0;
}

/**
 * Starts the next wave, when there are no asteroids left. Large asteroids appear at the edges, away from the ship in
 * the center, and every wave has one asteroid more.
 */
export class SpawnSystem extends System {
  private readonly asteroids = new QueryBuilder().with(Asteroid).build();

  public constructor(private readonly state: WaveState, private readonly screen: Size, private readonly random: Random) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.asteroids);
  }

  public onRemovedFromEngine(): void {
    this.engine.removeQuery(this.asteroids);
  }

  public update(): void {
    // Asteroids of the wave are still flying
    if (!this.asteroids.isEmpty) return;

    this.state.number++;

    const {width, height} = this.screen;
    for (let i = 0; i < this.state.number + 2; i++) {
      const onVerticalEdge = this.random() < 0.5;
      const x = onVerticalEdge ? 0 : this.random() * width;
      const y = onVerticalEdge ? this.random() * height : 0;
      this.engine.addEntity(createAsteroid(x, y, 3, this.random));
    }
  }
}

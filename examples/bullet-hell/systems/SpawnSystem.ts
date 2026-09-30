import {QueryBuilder, System} from 'tick-knock';
import {Enemy} from '../components';
import {WIDTH} from '../config';
import {Spawn, WAVES} from '../enemies';
import {createEnemy} from '../entities';

/**
 * Health of enemies grows by this share every time waves repeat
 */
const STRENGTH_GROWTH = 0.5;
/**
 * Pause in seconds between waves
 */
const PAUSE = 1.5;

/**
 * Progress of waves, shared with the game, which shows the number of the wave
 */
export interface WaveState {
  /**
   * Number of the current wave, starting from 1
   */
  number: number;
}

/**
 * Spawns enemies of waves. The next wave starts when all enemies of the current one are destroyed or have left
 * the screen. The system keeps the progress of waves in its own fields: it's state of the system, not of entities.
 */
export class SpawnSystem extends System {
  private readonly enemies = new QueryBuilder().contains(Enemy).build();
  private time = -PAUSE;
  private pending: Spawn[] = [];

  public constructor(private readonly state: WaveState) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.enemies);
    this.startWave();
  }

  public onRemovedFromEngine(): void {
    this.engine.removeQuery(this.enemies);
  }

  public update(dt: number): void {
    this.time += dt;
    const strength = 1 + Math.floor((this.state.number - 1) / WAVES.length) * STRENGTH_GROWTH;
    while (this.pending.length > 0 && this.pending[0].time <= this.time) {
      const {kind, x} = this.pending.shift()!;
      this.engine.addEntity(createEnemy(kind, x * WIDTH, strength));
    }
    if (this.pending.length === 0 && this.enemies.isEmpty) {
      this.state.number++;
      this.startWave();
    }
  }

  private startWave(): void {
    this.time = -PAUSE;
    this.pending = [...WAVES[(this.state.number - 1) % WAVES.length]];
  }
}

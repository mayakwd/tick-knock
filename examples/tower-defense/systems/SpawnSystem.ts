import {QueryBuilder, System} from 'tick-knock';
import {Creep} from '../components';
import {createCreep} from '../entities';

/**
 * Pause in seconds before every wave
 */
const PAUSE = 3;
/**
 * Time in seconds between creeps of a wave
 */
const INTERVAL = 0.9;

/**
 * Progress of waves, shared with the game, which shows the number of the wave
 */
export interface WaveState {
  number: number;
}

/**
 * Spawns creeps of waves, every wave has more and stronger creeps. The next wave starts when all creeps
 * of the current one are killed or have escaped.
 */
export class SpawnSystem extends System {
  private readonly creeps = new QueryBuilder().contains(Creep).build();
  private time = -PAUSE;
  private spawned = 0;

  public constructor(private readonly state: WaveState) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.creeps);
  }

  public onRemovedFromEngine(): void {
    this.engine.removeQuery(this.creeps);
  }

  public update(dt: number): void {
    const wave = this.state.number;
    const count = 6 + wave * 2;
    this.time += dt;
    while (this.spawned < count && this.time >= this.spawned * INTERVAL) {
      const health = Math.round(18 * 1.22 ** (wave - 1));
      this.engine.addEntity(createCreep(health, 45 + wave * 1.5, 4 + Math.floor(wave / 2)));
      this.spawned++;
    }
    if (this.spawned === count && this.creeps.isEmpty) {
      this.state.number++;
      this.time = -PAUSE;
      this.spawned = 0;
    }
  }
}

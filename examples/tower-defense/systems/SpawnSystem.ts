import {QueryBuilder, System} from 'tick-knock';
import {Creep} from '../components';
import {createCreep} from '../entities';
import {creepOfWave, SPAWN_INTERVAL, WAVE_PAUSE, waveSize} from '../waves';

/**
 * Progress of waves, shared with the game, which shows the number of the wave
 */
export class WaveState {
  /**
   * Number of the current wave, starting from 1
   */
  public number = 1;
}

/**
 * Spawns creeps of waves. The next wave starts when all creeps of the current one are killed or have escaped.
 * The time and the amount of spawned creeps are the state of the system, not of any entity.
 */
export class SpawnSystem extends System {
  private readonly creeps = new QueryBuilder().contains(Creep).build();
  private time = -WAVE_PAUSE;
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
    this.time += dt;

    // Creeps of the wave appear one after another
    const size = waveSize(this.state.number);
    while (this.spawned < size && this.time >= this.spawned * SPAWN_INTERVAL) {
      this.engine.addEntity(createCreep(creepOfWave(this.state.number)));
      this.spawned++;
    }

    // The next wave starts after a pause, when all creeps have appeared, and are gone
    if (this.spawned === size && this.creeps.isEmpty) {
      this.state.number++;
      this.time = -WAVE_PAUSE;
      this.spawned = 0;
    }
  }
}

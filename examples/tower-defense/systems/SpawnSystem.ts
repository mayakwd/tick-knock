import {ReactionSystem} from 'tick-knock';
import {SPAWN_INTERVAL, WAVE_PAUSE} from '../config';
import {creepOfWave, waveSize} from '../data/waves';
import {createCreep} from '../entities';
import {CREEP} from '../tags';
import {TowerDefenseState} from '../TowerDefenseState';

/**
 * Spawns creeps of waves. The next wave starts when all creeps of the current one are killed or have escaped: the query
 * of creeps is empty. The time and the amount of spawned creeps are the state of the system, not of any entity.
 */
export class SpawnSystem extends ReactionSystem.of(CREEP) {
  private time = -WAVE_PAUSE;
  private spawned = 0;

  public constructor(private readonly state: TowerDefenseState) {
    super();
  }

  public update(dt: number): void {
    this.time += dt;

    // Creeps of the wave appear one after another
    const {wave} = this.state;
    const size = waveSize(wave);
    while (this.spawned < size && this.time >= this.spawned * SPAWN_INTERVAL) {
      this.engine.addEntity(createCreep(creepOfWave(wave)));
      this.spawned++;
    }

    // The next wave starts after a pause, when all creeps have appeared, and are gone
    if (this.spawned === size && this.query.isEmpty) {
      this.state.wave++;
      this.time = -WAVE_PAUSE;
      this.spawned = 0;
    }
  }
}

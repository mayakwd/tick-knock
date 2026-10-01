import {Entity, IterativeSystem, Query, QueryBuilder} from 'tick-knock';
import {Cooldown} from '../../shared/components/Cooldown';
import {WaveStats} from '../components';
import {WAVE_PAUSE} from '../config';
import {waveSize} from '../data/waves';
import {CREEP, SPAWNER} from '../tags';

/**
 * The next wave starts after a pause, when all creeps of the current one have appeared, and are gone: killed or
 * escaped
 */
export class NextWaveSystem extends IterativeSystem.of(WaveStats, Cooldown, SPAWNER) {
  private readonly creeps: Query = new QueryBuilder().with(CREEP).build();

  public onAddedToEngine(): void {
    super.onAddedToEngine();
    this.engine.addQuery(this.creeps);
  }

  public onRemovedFromEngine(): void {
    this.engine.removeQuery(this.creeps);
    super.onRemovedFromEngine();
  }

  protected updateEntity(spawner: Entity, dt: number, wave: WaveStats, cooldown: Cooldown): void {
    // Creeps of the wave are still coming, or still on the map
    if (wave.left > 0 || !this.creeps.isEmpty) return;

    wave.number++;
    wave.left = waveSize(wave.number);
    cooldown.remaining = WAVE_PAUSE;
  }
}

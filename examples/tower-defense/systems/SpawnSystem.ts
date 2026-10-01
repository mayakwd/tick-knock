import {Entity, IterativeSystem} from 'tick-knock';
import {Cooldown} from '../../shared/components/Cooldown';
import {WaveStats} from '../components';
import {creepOfWave} from '../data/waves';
import {createCreep} from '../entities';
import {SPAWNER} from '../tags';

/**
 * The spawner releases creeps of the wave one after another, every time its cooldown is over
 */
export class SpawnSystem extends IterativeSystem.of(WaveStats, Cooldown, SPAWNER) {
  protected updateEntity(spawner: Entity, dt: number, wave: WaveStats, cooldown: Cooldown): void {
    while (wave.left > 0 && cooldown.remaining <= 0) {
      this.engine.addEntity(createCreep(creepOfWave(wave.number)));
      wave.left--;
      cooldown.remaining += cooldown.interval;
    }
  }
}

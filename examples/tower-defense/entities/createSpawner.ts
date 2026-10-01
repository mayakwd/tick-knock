import {Entity} from 'tick-knock';
import {Cooldown} from '../../shared/components/Cooldown';
import {WaveStats} from '../components';
import {SPAWN_INTERVAL, WAVE_PAUSE} from '../config';
import {waveSize} from '../data/waves';
import {SPAWNER} from '../tags';

/**
 * Creates the spawner of creeps. Its cooldown is the time until the next creep: creeps of a wave appear one after
 * another, and the first wave starts after a pause, so the player has time to build towers.
 */
export function createSpawner(): Entity {
  return new Entity()
    .add(new WaveStats(1, waveSize(1)))
    .add(new Cooldown(SPAWN_INTERVAL, WAVE_PAUSE))
    .add(SPAWNER);
}

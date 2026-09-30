/**
 * Pause in seconds before every wave
 */
export const WAVE_PAUSE = 3;
/**
 * Time in seconds between creeps of a wave
 */
export const SPAWN_INTERVAL = 0.9;

export interface CreepDescription {
  readonly health: number;
  /**
   * Speed in pixels per second
   */
  readonly speed: number;
  /**
   * Gold for killing the creep
   */
  readonly reward: number;
}

/**
 * Creeps of the first wave, and how they grow with every wave
 */
const FIRST_WAVE = {count: 8, health: 18, speed: 46.5, reward: 4};
/**
 * Every wave has 2 creeps more, their health grows by 22%, speed by 1.5 pixels per second, and the reward by a coin
 * every two waves
 */
const GROWTH = {count: 2, health: 1.22, speed: 1.5, reward: 0.5};

/**
 * Returns the amount of creeps in the wave
 * @param wave Number of the wave, starting from 1
 */
export function waveSize(wave: number): number {
  return FIRST_WAVE.count + (wave - 1) * GROWTH.count;
}

/**
 * Describes creeps of the wave: every wave has more creeps, which are stronger, faster and give more gold
 * @param wave Number of the wave, starting from 1
 */
export function creepOfWave(wave: number): CreepDescription {
  return {
    health: Math.round(FIRST_WAVE.health * GROWTH.health ** (wave - 1)),
    speed: FIRST_WAVE.speed + (wave - 1) * GROWTH.speed,
    reward: FIRST_WAVE.reward + Math.floor(wave * GROWTH.reward),
  };
}

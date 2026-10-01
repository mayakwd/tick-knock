/**
 * Progress of the current wave of the spawner
 */
export class WaveStats {
  public constructor(
    /**
     * Number of the wave, starting from 1
     */
    public number: number,
    /**
     * Creeps of the wave, that haven't appeared yet
     */
    public left: number,
  ) {}
}
